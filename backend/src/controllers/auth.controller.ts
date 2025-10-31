import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Session } from '../models/Session';
import { User } from '../models/User';
import { errorResponse, successResponse } from '../utils/responses';

// Define type for JWT SignOptions to avoid overload issues
type JWTSignOptions = { expiresIn: string };

// Helper to safely get env vars as strings
const getEnvString = (key: string, fallback: string): string => {
  return process.env[key] || fallback;
};

const JWT_SECRET = getEnvString('JWT_SECRET', 'default-secret');
const JWT_EXPIRES = getEnvString('JWT_EXPIRES', '1d');
const REFRESH_TOKEN_SECRET = getEnvString('REFRESH_TOKEN_SECRET', 'refresh-secret');
const REFRESH_TOKEN_EXPIRES = getEnvString('REFRESH_TOKEN_EXPIRES', '7d');

// Helper function to sign JWT tokens with proper types
const signToken = (payload: object, secret: string, expiresIn: string): string => {
  const options: JWTSignOptions = { expiresIn };
  return jwt.sign(payload, secret, options as any) as string;
};

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               displayName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return errorResponse(res, 'AUTH_003', 'User already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      email,
      phone,
      passwordHash,
      displayName,
    });

    // Generate tokens
    const accessToken = signToken(
      { userId: user._id, email: user.email, roles: user.roles },
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return successResponse(
      res,
      {
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
        },
        accessToken,
        refreshToken,
      },
      201
    );
  } catch (error) {
    return errorResponse(res, 'SERVER_001', 'Registration failed', 500);
  }
};

/**
 * Login endpoint
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      return errorResponse(res, 'AUTH_001', 'Invalid credentials', 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return errorResponse(res, 'AUTH_001', 'Invalid credentials', 401);
    }

    // Generate tokens
    const accessToken = signToken(
      { userId: user._id, email: user.email, roles: user.roles },
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return successResponse(res, {
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return errorResponse(res, 'SERVER_001', 'Login failed', 500);
  }
};

/**
 * Refresh token endpoint
 */
export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { userId: string };

    // Generate new access token
    const user = await User.findById(decoded.userId);
    if (!user) {
      return errorResponse(res, 'AUTH_001', 'User not found', 401);
    }

    const accessToken = signToken(
      { userId: user._id, email: user.email, roles: user.roles },
      JWT_SECRET,
      JWT_EXPIRES
    );

    return successResponse(res, { accessToken });
  } catch (error) {
    return errorResponse(res, 'AUTH_002', 'Token refresh failed', 401);
  }
};

/**
 * Login with phone and password
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with phone and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 */
export const loginWithPhone = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    // Validate input
    if (!phone || !password) {
      return errorResponse(res, 'AUTH_004', 'Phone and password are required', 400);
    }

    // Find user by phone
    const user = await User.findOne({ phone }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      return errorResponse(res, 'AUTH_001', 'Invalid credentials', 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return errorResponse(res, 'AUTH_001', 'Invalid credentials', 401);
    }

    // Generate tokens
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return successResponse(res, {
      user: {
        id: user._id,
        phone: user.phone,
        name: user.displayName,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return errorResponse(res, 'SERVER_001', 'Login failed', 500);
  }
};

/**
 * Send OTP to phone number via Twilio SMS
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send OTP code to phone number
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 */
export const sendOTPCode = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return errorResponse(res, 'AUTH_005', 'Phone number is required', 400);
    }

    // Import Twilio service
    const { sendOTP } = require('../services/twilio.service');

    // Send OTP via Twilio
    await sendOTP(phone);

    return successResponse(res, {
      message: 'OTP sent successfully',
      phone: phone,
    });
  } catch (error: any) {
    return errorResponse(res, 'AUTH_007', error.message || 'Failed to send OTP', 500);
  }
};

/**
 * Verify phone OTP with Twilio
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP code and check if user exists
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               code:
 *                 type: string
 */
export const verifyOTPCode = async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return errorResponse(res, 'AUTH_005', 'Phone number and OTP code are required', 400);
    }

    // Import Twilio service
    const { verifyOTP } = require('../services/twilio.service');

    // Verify OTP with Twilio
    const isValid = await verifyOTP(phone, code);

    if (!isValid) {
      return errorResponse(res, 'AUTH_006', 'Invalid or expired OTP code', 400);
    }

    // Check if user exists
    const user = await User.findOne({ phone });

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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
        },
        accessToken,
        refreshToken,
      });
    } else {
      // User doesn't exist - require registration
      return successResponse(res, {
        userExists: false,
        phone: phone,
      });
    }
  } catch (error: any) {
    return errorResponse(res, 'AUTH_007', error.message || 'OTP verification failed', 500);
  }
};

/**
 * Complete registration after OTP verification
 * @swagger
 * /auth/complete-registration:
 *   post:
 *     summary: Complete registration with name and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 */
export const completeRegistration = async (req: Request, res: Response) => {
  try {
    const { phone, name, password } = req.body;

    if (!phone || !name || !password) {
      return errorResponse(res, 'AUTH_008', 'All fields are required', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return errorResponse(res, 'AUTH_003', 'User already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      phone,
      displayName: name,
      passwordHash,
      isPhoneVerified: true,
      roles: ['user'],
    });

    // Generate tokens
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return successResponse(
      res,
      {
        user: {
          id: user._id,
          phone: user.phone,
          name: user.displayName,
          createdAt: user.createdAt,
        },
        accessToken,
        refreshToken,
      },
      201
    );
  } catch (error: any) {
    return errorResponse(res, 'SERVER_001', error.message || 'Registration failed', 500);
  }
};

/**
 * Reset password after OTP verification
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password after OTP verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               newPassword:
 *                 type: string
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { phone, newPassword } = req.body;

    if (!phone || !newPassword) {
      return errorResponse(res, 'AUTH_009', 'Phone number and new password are required', 400);
    }

    // Find user
    const user = await User.findOne({ phone });
    if (!user) {
      return errorResponse(res, 'AUTH_010', 'User not found', 404);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    user.passwordHash = passwordHash;
    await user.save();

    // Invalidate all existing sessions
    await Session.deleteMany({ userId: user._id });

    return successResponse(res, {
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    return errorResponse(res, 'SERVER_001', error.message || 'Password reset failed', 500);
  }
};

