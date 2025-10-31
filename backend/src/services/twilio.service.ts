/**
 * Twilio SMS OTP Service
 * Handles phone verification using Twilio Verify API
 */
import twilio from 'twilio';
import { logger } from '../utils/logger';

// Initialize Twilio client
let twilioClient: twilio.Twilio;
let TWILIO_VERIFY_SERVICE_SID = '';

/**
 * Initialize Twilio client
 */
export const initializeTwilio = (): void => {
  try {
    // Read credentials from environment variables (after dotenv.config() has run)
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
    TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID || '';

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
      logger.error('Missing Twilio credentials. Please check .env file:', {
        hasSID: !!TWILIO_ACCOUNT_SID,
        hasToken: !!TWILIO_AUTH_TOKEN,
        hasServiceSID: !!TWILIO_VERIFY_SERVICE_SID,
      });
      throw new Error('Twilio credentials missing in environment variables');
    }

    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    
    logger.info('📱 Twilio initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize Twilio:', error);
    throw error;
  }
};

/**
 * Send OTP to phone number via SMS
 * @param phoneNumber - Phone number with country code (e.g., +84123456789)
 * @returns Verification SID
 */
export const sendOTP = async (phoneNumber: string): Promise<string> => {
  try {
    if (!twilioClient) {
      initializeTwilio();
    }

    if (!TWILIO_VERIFY_SERVICE_SID) {
      throw new Error('Twilio Verify Service SID not initialized');
    }

    // Send verification code using Twilio Verify
    const verification = await twilioClient.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: phoneNumber,
        channel: 'sms', // Send via SMS
      });

    logger.info(`📱 OTP sent successfully to: ${phoneNumber}`, {
      status: verification.status,
      sid: verification.sid,
    });

    return verification.sid;
  } catch (error: any) {
    logger.error('❌ Failed to send OTP:', {
      error: error.message,
      phone: phoneNumber,
    });
    
    // Handle specific Twilio errors
    if (error.code === 60200) {
      throw new Error('Invalid phone number format');
    } else if (error.code === 60203) {
      throw new Error('Maximum verification attempts reached. Please try again later.');
    } else if (error.code === 60212) {
      throw new Error('Too many verification requests. Please try again later.');
    }
    
    throw new Error(error.message || 'Failed to send OTP');
  }
};

/**
 * Verify OTP code
 * @param phoneNumber - Phone number with country code
 * @param code - 6-digit OTP code
 * @returns Whether verification was successful
 */
export const verifyOTP = async (
  phoneNumber: string,
  code: string
): Promise<boolean> => {
  try {
    if (!twilioClient) {
      initializeTwilio();
    }

    if (!TWILIO_VERIFY_SERVICE_SID) {
      throw new Error('Twilio Verify Service SID not initialized');
    }

    // Verify code using Twilio Verify
    const verificationCheck = await twilioClient.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: phoneNumber,
        code: code,
      });

    const isValid = verificationCheck.status === 'approved';

    if (isValid) {
      logger.info(`✅ OTP verified successfully for: ${phoneNumber}`);
    } else {
      logger.warn(`❌ Invalid OTP for: ${phoneNumber}`, {
        status: verificationCheck.status,
      });
    }

    return isValid;
  } catch (error: any) {
    logger.error('❌ Failed to verify OTP:', {
      error: error.message,
      phone: phoneNumber,
    });

    // Handle specific Twilio errors
    if (error.code === 60200) {
      throw new Error('Invalid phone number format');
    } else if (error.code === 60202) {
      throw new Error('Maximum verification attempts reached');
    } else if (error.code === 60223) {
      throw new Error('Invalid verification code');
    }

    throw new Error(error.message || 'Failed to verify OTP');
  }
};

/**
 * Cancel a pending verification
 * @param phoneNumber - Phone number
 */
export const cancelVerification = async (phoneNumber: string): Promise<void> => {
  try {
    if (!twilioClient) {
      initializeTwilio();
    }

    if (!TWILIO_VERIFY_SERVICE_SID) {
      return; // Silently fail if not initialized
    }

    // Cancel pending verifications for this phone number
    await twilioClient.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verifications(phoneNumber)
      .update({ status: 'canceled' });

    logger.info(`Verification canceled for: ${phoneNumber}`);
  } catch (error: any) {
    logger.error('Failed to cancel verification:', error);
    // Don't throw - this is best effort
  }
};

export default {
  initializeTwilio,
  sendOTP,
  verifyOTP,
  cancelVerification,
};

