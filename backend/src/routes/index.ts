import { Router } from 'express';
import authRoutes from './auth.js';
import dashboardRoutes from './dashboard.js';
import searchRoutes from './search.js';
import leadsRoutes from './leads.js';
import settingsRoutes from './settings.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/search', searchRoutes);
apiRouter.use('/leads', leadsRoutes);
apiRouter.use('/settings', settingsRoutes);

export default apiRouter;
