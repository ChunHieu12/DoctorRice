import { Request, Response, Router } from 'express';
import adminIoTRoutes from './admin-iot.routes';
import authRoutes from './auth.routes';
import conversationRoutes from './conversation.routes';
import docsRoutes from './docs.routes';
import expertRoutes from './expert.routes';
import fieldRoutes from './field.routes';
import iotRoutes from './iot.routes';
import photoRoutes from './photo.routes';
import userRoutes from './user.routes';

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
router.use('/user', userRoutes);
router.use('/conversations', conversationRoutes);
router.use('/experts', expertRoutes);
router.use('/detail', docsRoutes);
router.use('/fields', fieldRoutes);
router.use('/iot', iotRoutes);
router.use('/admin/iot-codes', adminIoTRoutes);

export default router;

