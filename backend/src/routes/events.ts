import { Router, Request, Response } from 'express';
import { searchQueue, ProgressEventPayload } from '../queues/searchQueue.js';

const router = Router();

router.get('/progress', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable proxy buffering in nginx
  res.flushHeaders();

  // Send initial connected message
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE stream connected' })}\n\n`);

  // Listener for progress events
  const onProgress = (payload: ProgressEventPayload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  searchQueue.on('progress', onProgress);

  // Keep-alive heartbeat every 15 seconds
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    searchQueue.off('progress', onProgress);
  });
});

export default router;
