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

