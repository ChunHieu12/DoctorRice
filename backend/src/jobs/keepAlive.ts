import axios from 'axios';
import cron from 'node-cron';
import { logger } from '../utils/logger';

/**
 * Keep-alive cron job to prevent Render free tier from sleeping
 * Runs every 10 minutes (Render free tier sleeps after 15 min inactive)
 */
export function startKeepAliveJob() {
  // Skip in local development (when running on localhost)
  if (process.env.NODE_ENV === 'development' && !process.env.RENDER_INTERNAL_URL) {
    logger.info('⏸️  Keep-alive job skipped (local development)');
    return;
  }

  const internalUrl = process.env.RENDER_INTERNAL_URL || process.env.RENDER_EXTERNAL_URL;
  
  if (!internalUrl) {
    logger.warn('⚠️  Keep-alive job not started: RENDER_INTERNAL_URL or RENDER_EXTERNAL_URL not set');
    return;
  }

  // Run every 10 minutes (Render free tier sleeps after 15 min)
  cron.schedule('*/10 * * * *', async () => {
    try {
      const pingUrl = `${internalUrl}/api/health`;
      
      await axios.get(pingUrl, {
        timeout: 10000, // 10 seconds timeout
        headers: {
          'User-Agent': 'Keep-Alive-Cron',
        },
      });
      
      logger.info('✅ Keep-alive ping successful');
    } catch (error: any) {
      logger.error('❌ Keep-alive ping failed:', error.message);
    }
  });

  logger.info(`✅ Keep-alive cron job started (every 10 minutes) → ${internalUrl}`);
}

