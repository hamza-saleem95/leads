import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/providers', authenticateToken, SettingsController.getProviders);
router.post('/providers/:name', authenticateToken, SettingsController.updateProvider);
router.post('/providers/:name/test', authenticateToken, SettingsController.testProvider);
router.get('/usage', authenticateToken, SettingsController.getUsage);
router.get('/audit-logs', authenticateToken, SettingsController.getAuditLogs);

export default router;
