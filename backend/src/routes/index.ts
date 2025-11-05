import { Request, Response, Router } from 'express';
import authRoutes from './auth.routes';
import docsRoutes from './docs.routes';
import photoRoutes from './photo.routes';

const router = Router();

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
});

// Routes
router.use('/auth', authRoutes);
router.use('/photos', photoRoutes);
router.use('/detail', docsRoutes);

export default router;

