/**
 * OTP Routes
 * Routes for Phone OTP authentication
 */
import express from 'express';
import { sendOTP, verifyOTP } from '../controllers/otp.controller';
import { rateLimiter } from '../middleware/rateLimiter.middleware';

const router = express.Router();

// Rate limiter for OTP endpoints (stricter than normal)
const otpLimiter = rateLimiter(5, 15); // 5 requests per 15 minutes

/**
 * @swagger
 * /api/otp/send:
 *   post:
 *     summary: Send OTP to phone number
 *     description: Initiates phone authentication with Firebase. Returns custom token for client.
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
 *                 example: "+84987654321"
 *     responses:
 *       200:
 *         description: OTP process initiated
 *       400:
 *         description: Invalid phone number
 */
router.post('/send', otpLimiter, sendOTP);

/**
 * @swagger
 * /api/otp/verify:
 *   post:
 *     summary: Verify phone OTP and login
 *     description: Verifies Firebase ID token and returns user info with JWT tokens
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
 *                 description: Firebase ID token from client
 *     responses:
 *       200:
 *         description: User verified successfully
 *       400:
 *         description: Invalid token
 */
router.post('/verify', otpLimiter, verifyOTP);

export default router;

