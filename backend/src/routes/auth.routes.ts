import { Router } from 'express';
import {
    checkPhone,
    completeRegistration,
    deleteAccount,
    googleSignIn,
    loginWithPhone,
    refresh,
    resetPassword,
    sendOTPCode,
    verifyOTPCode
} from '../controllers/auth.controller';
import { auth } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Phone-based authentication endpoints (Twilio OTP)
 */

// ======================================
// Email-based routes (DEPRECATED - Kept for backward compatibility)
// Use phone-based authentication instead
// ======================================
// router.post('/register', authLimiter, register);
// router.post('/login', authLimiter, login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 */
router.post('/refresh', refresh);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with phone number and password
 *     description: Standard login using phone number and password (alternative to OTP login)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Phone number with country code
 *                 example: "+84123456789"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password
 *                 example: "SecurePass123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         name:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Phone and password are required
 */
router.post('/login', authLimiter, loginWithPhone);

/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Send OTP code to phone number via Twilio SMS
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Phone number with country code
 *                 example: "+84123456789"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "OTP sent successfully"
 *                     phone:
 *                       type: string
 *                       example: "+84123456789"
 *       400:
 *         description: Phone number is required
 *       500:
 *         description: Failed to send OTP
 */
router.post('/send-otp', authLimiter, sendOTPCode);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP code and check if user exists
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - code
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Phone number with country code
 *                 example: "+84123456789"
 *               code:
 *                 type: string
 *                 description: 6-digit OTP code
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     data:
 *                       type: object
 *                       properties:
 *                         userExists:
 *                           type: boolean
 *                           example: true
 *                         user:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             phone:
 *                               type: string
 *                             name:
 *                               type: string
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     data:
 *                       type: object
 *                       properties:
 *                         userExists:
 *                           type: boolean
 *                           example: false
 *                         phone:
 *                           type: string
 *                           example: "+84123456789"
 *       400:
 *         description: Invalid or expired OTP code
 *       500:
 *         description: OTP verification failed
 */
router.post('/verify-otp', authLimiter, verifyOTPCode);

/**
 * Google Sign-In endpoint
 */
router.post('/google', authLimiter, googleSignIn);

/**
 * @swagger
 * /api/auth/complete-registration:
 *   post:
 *     summary: Complete registration after OTP verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - name
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Verified phone number
 *                 example: "+84123456789"
 *               name:
 *                 type: string
 *                 description: User full name
 *                 example: "Nguyen Van A"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password
 *                 example: "SecurePass123"
 *     responses:
 *       201:
 *         description: Registration completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         name:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       400:
 *         description: All fields are required
 *       409:
 *         description: User already exists
 */
router.post('/complete-registration', authLimiter, completeRegistration);

/**
 * @swagger
 * /api/auth/check-phone:
 *   post:
 *     summary: Check if phone number is registered
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Phone number with country code
 *                 example: "+84123456789"
 *     responses:
 *       200:
 *         description: Phone check successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     exists:
 *                       type: boolean
 *                       example: true
 */
router.post('/check-phone', authLimiter, checkPhone);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password after OTP verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - newPassword
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Verified phone number
 *                 example: "+84123456789"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password
 *                 example: "NewSecurePass123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Password reset successfully"
 *       400:
 *         description: Phone number and new password are required
 *       404:
 *         description: User not found
 */
router.post('/reset-password', authLimiter, resetPassword);

/**
 * @swagger
 * /api/auth/delete-account:
 *   delete:
 *     summary: Delete user account
 *     description: Permanently delete the authenticated user's account and all associated data
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Account deleted successfully"
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: User not found
 */
router.delete('/delete-account', auth, deleteAccount);

export default router;

