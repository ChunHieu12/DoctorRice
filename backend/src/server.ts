import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { connectDatabase } from './config/database';
import { swaggerSpec } from './config/swagger';
import { startKeepAliveJob } from './jobs/keepAlive';
import { apiLimiter } from './middleware/rateLimiter.middleware';
import routes from './routes';
import { initializeTwilio } from './services/twilio.service';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:8081'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', apiLimiter);

// Serve static uploads
app.use('/uploads', express.static('uploads'));

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (_req: express.Request, res: express.Response) => {
  res.json({
    message: 'Bác sĩ Lúa API - Backend for DoctorRice App',
    version: '1.0.0',
    docs: '/api/docs',
  });
});

// 404 handler
app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: err.message || 'Internal server error',
    },
  });
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Initialize Twilio
    initializeTwilio();

    // Start keep-alive job
    startKeepAliveJob();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📚 API Docs: http://localhost:${PORT}/api/docs`);
      logger.info(`🏥 Health: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

