process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import apiRouter from './routes/index.js';
import eventsRouter from './routes/events.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security and middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Rate limiting for public routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AI Lead Finder Backend API',
    version: '1.0.0',
    env: config.env,
  });
});

// Real-time Server-Sent Events (SSE) route
app.use('/events', eventsRouter);

// Main REST API routes
app.use('/api', apiRouter);

// Centralized error handler
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🚀 AI Lead Finder Server running on port ${config.port}`);
  console.log(`📡 Health Check: http://localhost:${config.port}/health`);
  console.log(`⚡ SSE Stream:   http://localhost:${config.port}/events/progress`);
  console.log(`🔗 REST API:     http://localhost:${config.port}/api`);
  console.log(`=======================================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default app;
