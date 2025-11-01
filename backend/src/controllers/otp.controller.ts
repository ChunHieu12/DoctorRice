/**
 * OTP Controller
 * Handle Phone OTP sending and verification
 * 
 * Uses AWS SNS for sending real SMS messages
 */
import AWS from 'aws-sdk';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import Session from '../models/Session';
import User from '../models/User';
import { signToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { errorResponse, successResponse } from '../utils/responses';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret';
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || '30d';

// AWS SNS Configuration
const sns = new AWS.SNS({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-southeast-2',
});

// In-memory OTP storage (Use Redis in production)
interface OTPData {
  code: string;
  expiresAt: number;
  attempts: number;
}

const otpStore = new Map<string, OTPData>();

// OTP Configuration
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '3');

// Test phone numbers (optional - if empty, all numbers are real)
const TEST_PHONE_NUMBERS = process.env.TEST_PHONE_NUMBERS
  ? process.env.TEST_PHONE_NUMBERS.split(',').map(n => n.trim()).filter(Boolean)
  : [];

/**
 * Generate 6-digit OTP code
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send SMS via AWS SNS
 */
async function sendSMS(phoneNumber: string, message: string): Promise<void> {
  try {
    const params: AWS.SNS.PublishInput = {
      PhoneNumber: phoneNumber,
      Message: message,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: process.env.AWS_SMS_SENDER_ID || 'DoctorRice',
        },
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional', // Transactional SMS for OTP
        },
      },
    };

    const result = await sns.publish(params).promise();
    
    logger.info(`✅ SMS sent successfully via AWS SNS to ${phoneNumber}`, {
      messageId: result.MessageId,
    });
  } catch (error: any) {
    logger.error(`❌ Failed to send SMS via AWS SNS to ${phoneNumber}:`, error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

/**
 * @swagger
 * /api/otp/send:
 *   post:
 *     summary: Send OTP to phone number via Firebase Admin SDK
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number with country code
 *                 example: "+84987654321"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid phone number
 *       500:
 *         description: Failed to send OTP
 */
export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return errorResponse(res, 'OTP_001', 'Phone number is required', 400);
    }

    // Validate phone number format (E.164)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return errorResponse(res, 'OTP_002', 'Invalid phone number format. Use E.164 format (e.g., +84987654321)', 400);
    }

    logger.info(`📱 Sending OTP to phone: ${phoneNumber}`);

    // Generate OTP code
    const otpCode = generateOTP();
    const isTestNumber = TEST_PHONE_NUMBERS.length > 0 && TEST_PHONE_NUMBERS.includes(phoneNumber);

    // Store OTP (expires based on config)
    otpStore.set(phoneNumber, {
      code: otpCode,
      expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
      attempts: 0,
    });

    // Send SMS (test numbers skip actual SMS sending)
    if (isTestNumber) {
      logger.info(`🧪 Test number detected: ${phoneNumber}, OTP: ${otpCode}`);
      // For test numbers, return OTP in response (development only)
      return successResponse(res, {
        message: `OTP sent successfully (Test Mode - Valid for ${OTP_EXPIRY_MINUTES} minutes)`,
        phoneNumber,
        testOTP: process.env.NODE_ENV === 'development' ? otpCode : undefined,
      });
    } else {
      // Send real SMS via AWS SNS
      const message = `Your DoctorRice verification code is: ${otpCode}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`;
      await sendSMS(phoneNumber, message);

      logger.info(`✅ OTP sent via SMS to: ${phoneNumber}`);
      return successResponse(res, {
        message: 'OTP sent successfully. Please check your SMS.',
        phoneNumber,
      });
    }
  } catch (error: any) {
    logger.error('❌ Error sending OTP:', error);
    return errorResponse(res, 'OTP_003', error.message || 'Failed to send OTP', 500);
  }
};

/**
 * @swagger
 * /api/otp/verify:
 *   post:
 *     summary: Verify OTP and login/register user
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firebaseToken
 *             properties:
 *               firebaseToken:
 *                 type: string
 *                 description: Firebase ID token from client after phone auth
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid token
 *       500:
 *         description: Verification failed
 */
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return errorResponse(res, 'OTP_004', 'Phone number and OTP code are required', 400);
    }

    // Get OTP data from storage
    const otpData = otpStore.get(phoneNumber);

    if (!otpData) {
      return errorResponse(res, 'OTP_005', 'OTP not found or expired. Please request a new one.', 400);
    }

    // Check expiration
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(phoneNumber);
      return errorResponse(res, 'OTP_006', 'OTP has expired. Please request a new one.', 400);
    }

    // Check attempts
    if (otpData.attempts >= OTP_MAX_ATTEMPTS) {
      otpStore.delete(phoneNumber);
      return errorResponse(res, 'OTP_007', 'Too many failed attempts. Please request a new OTP.', 400);
    }

    // Verify code
    if (otpData.code !== code) {
      otpData.attempts += 1;
      otpStore.set(phoneNumber, otpData);
      return errorResponse(res, 'OTP_008', `Invalid OTP code. ${OTP_MAX_ATTEMPTS - otpData.attempts} attempts remaining.`, 400);
    }

    // OTP verified successfully - remove from storage
    otpStore.delete(phoneNumber);
    logger.info(`✅ OTP verified for phone: ${phoneNumber}`);

    // Check if user exists in our database
    let user = await User.findOne({ phone: phoneNumber });

    if (user) {
      // User exists - generate tokens and login
      const accessToken = signToken(
        { userId: user._id, phone: user.phone, roles: user.roles },
        JWT_SECRET,
        JWT_EXPIRES
      );

      const refreshToken = signToken(
        { userId: user._id },
        REFRESH_TOKEN_SECRET,
        REFRESH_TOKEN_EXPIRES
      );

      // Save refresh token
      await Session.create({
        userId: user._id,
        refreshToken: await bcrypt.hash(refreshToken, 10),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      // Mark phone as verified
      if (!user.isPhoneVerified) {
        user.isPhoneVerified = true;
        await user.save();
      }

      return successResponse(res, {
        userExists: true,
        user: {
          id: user._id,
          phone: user.phone,
          name: user.displayName,
          email: user.email,
        },
        accessToken,
        refreshToken,
      });
    } else {
      // User doesn't exist - require registration
      return successResponse(res, {
        userExists: false,
        phone: phoneNumber,
      });
    }
  } catch (error: any) {
    logger.error('❌ Error verifying OTP:', error);
    return errorResponse(res, 'OTP_009', error.message || 'OTP verification failed', 500);
  }
};

