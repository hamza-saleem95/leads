import { Router } from 'express';
import { SearchAssistantController } from '../controllers/searchAssistantController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/assistant/strategy', authenticateToken, SearchAssistantController.generateStrategy);
router.post('/assistant/launch', authenticateToken, SearchAssistantController.launchSearch);
router.get('/projects', authenticateToken, SearchAssistantController.getProjects);
router.get('/projects/:id', authenticateToken, SearchAssistantController.getProject);
router.get('/jobs/:id', authenticateToken, SearchAssistantController.getJob);
router.post('/jobs/:id/cancel', authenticateToken, SearchAssistantController.cancelJob);
router.post('/jobs/:id/pause', authenticateToken, SearchAssistantController.pauseJob);
router.post('/jobs/:id/resume', authenticateToken, SearchAssistantController.resumeJob);
router.post('/jobs/:id/retry', authenticateToken, SearchAssistantController.retryJob);

export default router;
