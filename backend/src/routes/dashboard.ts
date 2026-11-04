import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authenticateToken, DashboardController.getStats);

export default router;
