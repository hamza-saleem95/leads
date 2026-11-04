import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../database/db.js';
import { ExportService } from '../services/exportService.js';
import { LeadStatus, EmailStatus } from '../types/index.js';
import { LeadScoringEngine } from '../scoring/leadScorer.js';

const emptyToUndefined = (val: unknown) => (typeof val === 'string' && val.trim() === '' ? undefined : val);

const leadFilterSchema = z.object({
  searchProjectId: z.preprocess(emptyToUndefined, z.string().optional()),
  industry: z.preprocess(emptyToUndefined, z.string().optional()),
  country: z.preprocess(emptyToUndefined, z.string().optional()),
  city: z.preprocess(emptyToUndefined, z.string().optional()),
  minScore: z.preprocess((val) => (val === '' || val === undefined ? undefined : Number(val)), z.number().optional()),
  emailStatus: z.preprocess(emptyToUndefined, z.enum(['VERIFIED', 'INVALID', 'UNVERIFIED', 'UNKNOWN']).optional()),
  leadStatus: z.preprocess(emptyToUndefined, z.enum(['NEW', 'REVIEWED', 'QUALIFIED', 'CONTACTED', 'CONVERTED', 'REJECTED']).optional()),
  query: z.preprocess(emptyToUndefined, z.string().optional()),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  sortBy: z.string().optional().default('leadScore'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export class LeadsController {
  static async getLeads(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId || 'user-default-admin-01';
    const filters = leadFilterSchema.parse(req.query);

    const result = await db.getLeads({
      userId,
      ...filters,
    });

    res.json({
      success: true,
      data: result.leads,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  }

  static async getLeadById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const lead = await db.getLeadById(id);
    if (!lead) {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }
    res.json({ success: true, lead });
  }

  static async createLead(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId || 'user-default-admin-01';
    const body = req.body;

    const { total, breakdown } = LeadScoringEngine.scoreLead(body, {
      industry: body.industry,
      country: body.country,
      cities: body.city ? [body.city] : [],
    });

    const lead = await db.createLead({
      userId,
      searchProjectId: body.searchProjectId || null,
      companyName: body.companyName,
      industry: body.industry || null,
      businessDescription: body.businessDescription || null,
      website: body.website || null,
      email: body.email || null,
      emailStatus: body.emailStatus || 'UNKNOWN',
      phone: body.phone || null,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      country: body.country || null,
      linkedinCompanyUrl: body.linkedinCompanyUrl || null,
      contactPageUrl: body.contactPageUrl || null,
      leadScore: total,
      scoreBreakdown: breakdown,
      leadStatus: body.leadStatus || 'NEW',
      sourceUrl: body.sourceUrl || null,
      sourceProvider: body.sourceProvider || 'MANUAL',
      extractionStatus: 'COMPLETED',
    });

    res.status(201).json({ success: true, lead });
  }

  static async updateLead(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const updates = req.body;

    const updated = await db.updateLead(id, updates);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }
    res.json({ success: true, lead: updated });
  }

  static async deleteLead(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const deleted = await db.deleteLead(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }
    res.json({ success: true, message: 'Lead deleted successfully' });
  }

  static async bulkUpdateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { ids, status } = z.object({
      ids: z.array(z.string()),
      status: z.enum(['NEW', 'REVIEWED', 'QUALIFIED', 'CONTACTED', 'CONVERTED', 'REJECTED']),
    }).parse(req.body);

    const count = await db.bulkUpdateLeadStatus(ids, status as LeadStatus);
    res.json({ success: true, count, message: `Updated ${count} leads to ${status}` });
  }

  static async bulkDelete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(req.body);
    const count = await db.bulkDeleteLeads(ids);
    res.json({ success: true, count, message: `Deleted ${count} leads` });
  }

  static async toggleSave(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId || 'user-default-admin-01';
    const { id } = req.params;
    const tags = req.body.tags || [];

    const isSaved = await db.toggleSaveLead(userId, id, tags);
    res.json({ success: true, isSaved });
  }

  static async getSaved(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId || 'user-default-admin-01';
    const leads = await db.getSavedLeads(userId);
    res.json({ success: true, leads });
  }

  static async addNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId || 'user-default-admin-01';
    const { id } = req.params;
    const { note } = z.object({ note: z.string().min(1) }).parse(req.body);

    const created = await db.addLeadNote(id, userId, note);
    res.status(201).json({ success: true, note: created });
  }

  static async deleteNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { noteId } = req.params;
    const deleted = await db.deleteLeadNote(noteId);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Note not found' });
      return;
    }
    res.json({ success: true, message: 'Note deleted' });
  }

  static async exportCSV(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId || 'user-default-admin-01';
    const filters = leadFilterSchema.parse(req.query);
    // Fetch all matching records without pagination limit for export
    const { leads } = await db.getLeads({ ...filters, userId, limit: 5000, page: 1 });

    const csvBuffer = ExportService.generateCSV(leads);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=leads_export_${Date.now()}.csv`);
    res.send(csvBuffer);
  }

  static async exportExcel(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId || 'user-default-admin-01';
    const filters = leadFilterSchema.parse(req.query);
    const { leads } = await db.getLeads({ ...filters, userId, limit: 5000, page: 1 });

    const excelBuffer = ExportService.generateExcel(leads);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=leads_export_${Date.now()}.xlsx`);
    res.send(excelBuffer);
  }
}
