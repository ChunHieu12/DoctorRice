import { Router } from 'express';
import { login, refresh, register } from '../controllers/auth.controller';
import { authLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);

export default router;

