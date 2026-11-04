import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { OpenAIService } from '../ai/openaiService.js';
import { searchQueue } from '../queues/searchQueue.js';
import { db } from '../database/db.js';

const strategyRequestSchema = z.object({
  prompt: z.string().optional().default(''),
  questionnaire: z.object({
    industry: z.string().optional(),
    country: z.string().optional(),
    cities: z.array(z.string()).optional(),
    quantity: z.number().optional(),
    businessType: z.string().optional(),
    needEmails: z.boolean().optional(),
    needPhones: z.boolean().optional(),
    needWebsites: z.boolean().optional(),
    needAddresses: z.boolean().optional(),
    needLinkedin: z.boolean().optional(),
    additionalRequirements: z.string().optional(),
  }).optional(),
});

const launchSearchSchema = z.object({
  strategy: z.object({
    industry: z.string(),
    country: z.string(),
    cities: z.array(z.string()),
    quantity: z.number(),
    businessType: z.string().optional(),
    requiredFields: z.array(z.string()),
    additionalRequirements: z.string().optional(),
    targetKeywords: z.array(z.string()),
    searchQueries: z.array(z.object({
      query: z.string(),
      provider: z.string(),
    })),
    suggestedProviders: z.array(z.string()),
    rationale: z.string(),
  }),
  projectName: z.string().optional(),
});

export class SearchAssistantController {
  static async generateStrategy(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId || 'user-default-admin-01';
    const body = strategyRequestSchema.parse(req.body);

    const promptText = body.prompt || (body.questionnaire?.industry
      ? `Find ${body.questionnaire.quantity || 50} ${body.questionnaire.industry} businesses in ${body.questionnaire.country || 'anywhere'}`
      : 'Find verified B2B companies');

    const strategy = await OpenAIService.generateSearchStrategy({
      prompt: promptText,
      previousAnswers: body.questionnaire,
      userId,
    });

    res.json({
      success: true,
      strategy,
    });
  }

  static async launchSearch(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId || 'user-default-admin-01';
    const { strategy, projectName } = launchSearchSchema.parse(req.body);

    const name = projectName || `${strategy.industry} - ${strategy.country} (${strategy.quantity} leads)`;

    // 1. Create Search Project in DB
    const project = await db.createSearchProject({
      userId,
      name,
      industry: strategy.industry,
      country: strategy.country,
      configuration: strategy,
    });

    // 2. Create Search Job in DB
    const job = await db.createSearchJob({
      searchProjectId: project.id,
      totalItems: strategy.quantity,
    });

    // 3. Dispatch to Queue
    await searchQueue.addSearchJob({
      searchProjectId: project.id,
      searchJobId: job.id,
      userId,
      strategy,
    });

    await db.createAuditLog({
      userId,
      action: 'SEARCH_LAUNCHED',
      entity: 'SearchProject',
      entityId: project.id,
      details: { jobId: job.id, strategy },
    });

    res.status(202).json({
      success: true,
      projectId: project.id,
      jobId: job.id,
      project,
      job,
      message: 'Search strategy approved and queued for multi-source execution.',
    });
  }

  static async getProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId || 'user-default-admin-01';
    const projects = await db.getProjectsByUser(userId);
    res.json({
      success: true,
      projects,
    });
  }

  static async getProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const project = await db.getProjectById(id);
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }
    const jobs = await db.getJobsByProject(id);
    res.json({
      success: true,
      project,
      jobs,
    });
  }

  static async getJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const job = await db.getSearchJobById(id);
    if (!job) {
      res.status(404).json({ success: false, error: 'Search job not found' });
      return;
    }
    res.json({
      success: true,
      job,
    });
  }

  static async cancelJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    searchQueue.cancelJob(id);
    await db.updateSearchJob(id, { status: 'CANCELLED' });
    res.json({ success: true, message: 'Cancellation signal dispatched.' });
  }

  static async pauseJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    searchQueue.pauseJob(id);
    await db.updateSearchJob(id, { status: 'PAUSED' });
    res.json({ success: true, message: 'Pause signal dispatched.' });
  }

  static async resumeJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    searchQueue.resumeJob(id);
    await db.updateSearchJob(id, { status: 'PROCESSING' });
    res.json({ success: true, message: 'Resume signal dispatched.' });
  }

  static async retryJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId || 'user-default-admin-01';
    const { id } = req.params;
    const oldJob = await db.getSearchJobById(id);
    if (!oldJob) {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }

    const project = await db.getProjectById(oldJob.searchProjectId);
    if (!project || !project.configuration) {
      res.status(400).json({ success: false, error: 'Project configuration missing for retry' });
      return;
    }

    const newJob = await db.createSearchJob({
      searchProjectId: project.id,
      totalItems: project.configuration.quantity || 50,
    });

    await searchQueue.addSearchJob({
      searchProjectId: project.id,
      searchJobId: newJob.id,
      userId,
      strategy: project.configuration,
    });

    res.json({
      success: true,
      jobId: newJob.id,
      message: 'Job restarted with identical strategy.',
    });
  }
}
