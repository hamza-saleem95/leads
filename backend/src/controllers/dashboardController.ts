import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../database/db.js';

export class DashboardController {
  static async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId || 'user-default-admin-01';
    const stats = await db.getDashboardStats(userId);
    res.json({
      success: true,
      data: stats,
    });
  }
}
