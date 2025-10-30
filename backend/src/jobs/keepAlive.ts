import axios from 'axios';
import cron from 'node-cron';
import { logger } from '../utils/logger';

/**
 * Keep-alive cron job to prevent Render free tier from sleeping
 * Runs every 2 minutes
 */
export function startKeepAliveJob() {
  const cronSecret = process.env.CRON_SECRET;
  const internalUrl = process.env.RENDER_INTERNAL_URL;

  if (!cronSecret || !internalUrl || process.env.NODE_ENV !== 'production') {
    logger.info('Keep-alive job not started (dev environment or missing config)');
    return;
  }

  // Run every 2 minutes
  cron.schedule('*/2 * * * *', async () => {
    try {
      await axios.get(`${internalUrl}/health`, {
        headers: {
          'X-Cron-Secret': cronSecret,
        },
        timeout: 5000,
      });
      logger.debug('Keep-alive ping successful');
    } catch (error) {
      logger.error('Keep-alive ping failed:', error);
    }
  });

  logger.info('✅ Keep-alive cron job started (every 2 minutes)');
}

