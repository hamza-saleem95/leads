import { EventEmitter } from 'events';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../config/index.js';
import { SearchStrategy } from '../types/index.js';

export interface SearchJobData {
  searchProjectId: string;
  searchJobId: string;
  userId: string;
  strategy: SearchStrategy;
}

export interface ProgressEventPayload {
  jobId: string;
  searchProjectId: string;
  stage: string;
  progress: number;
  totalItems: number;
  processedItems: number;
  currentMessage: string;
  status: 'PENDING' | 'PROCESSING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  leadFound?: any;
}

class SearchQueueManager extends EventEmitter {
  private queue: Queue | null = null;
  private isRedisConnected = false;
  private activeLocalJobs = new Map<string, { status: string; cancelRequested: boolean; pauseRequested: boolean }>();

  constructor() {
    super();
    this.initRedis();
  }

  private async initRedis() {
    try {
      const redisConnection = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        retryStrategy: () => null, // don't retry endlessly if redis is down
        lazyConnect: true,
      });

      await redisConnection.connect();
      this.isRedisConnected = true;
      this.queue = new Queue('search-jobs', { connection: redisConnection });
      console.log('[SearchQueue] Connected to Redis BullMQ.');
    } catch {
      console.log('[SearchQueue] Redis not reachable. Using robust asynchronous in-process queue runner.');
      this.isRedisConnected = false;
    }
  }

  public getRedisStatus(): boolean {
    return this.isRedisConnected;
  }

  /**
   * Dispatches progress updates to SSE subscribers
   */
  public emitProgress(payload: ProgressEventPayload) {
    this.emit('progress', payload);
  }

  /**
   * Adds a search job to the processing queue
   */
  public async addSearchJob(data: SearchJobData): Promise<void> {
    this.activeLocalJobs.set(data.searchJobId, {
      status: 'PROCESSING',
      cancelRequested: false,
      pauseRequested: false,
    });

    if (this.isRedisConnected && this.queue) {
      try {
        await this.queue.add('process-search', data, {
          jobId: data.searchJobId,
          removeOnComplete: false,
        });
        return;
      } catch (err: any) {
        console.warn('[SearchQueue] BullMQ add failed, switching to local queue executor:', err.message);
      }
    }

    // Process asynchronously via embedded worker
    // Dynamically import worker to prevent circular dependencies
    const { SearchWorker } = await import('../workers/searchWorker.js');
    setTimeout(() => {
      SearchWorker.executeSearchPipeline(data).catch((err) => {
        console.error(`[SearchQueue] Job ${data.searchJobId} failed:`, err);
      });
    }, 50);
  }

  public cancelJob(jobId: string) {
    const job = this.activeLocalJobs.get(jobId);
    if (job) {
      job.cancelRequested = true;
      job.status = 'CANCELLED';
    }
  }

  public pauseJob(jobId: string) {
    const job = this.activeLocalJobs.get(jobId);
    if (job) {
      job.pauseRequested = true;
      job.status = 'PAUSED';
    }
  }

  public resumeJob(jobId: string) {
    const job = this.activeLocalJobs.get(jobId);
    if (job) {
      job.pauseRequested = false;
      job.status = 'PROCESSING';
    }
  }

  public isCancelled(jobId: string): boolean {
    return this.activeLocalJobs.get(jobId)?.cancelRequested || false;
  }

  public isPaused(jobId: string): boolean {
    return this.activeLocalJobs.get(jobId)?.pauseRequested || false;
  }
}

export const searchQueue = new SearchQueueManager();
