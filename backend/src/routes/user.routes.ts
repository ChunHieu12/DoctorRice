import { Router } from 'express';
import multer from 'multer';
import {
    changePassword,
    getExperts,
    getProfile,
    updateProfile,
    uploadAvatar,
} from '../controllers/user.controller';
import { auth } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User profile management endpoints
 */

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', auth, getProfile);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user profile (name, phone)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', auth, updateProfile);

/**
 * @swagger
 * /api/user/avatar:
 *   post:
 *     summary: Upload/update user avatar
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: No file provided
 *       401:
 *         description: Unauthorized
 */
router.post('/avatar', auth, upload.single('avatar'), uploadAvatar);

/**
 * @swagger
 * /api/user/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid password
 *       401:
 *         description: Unauthorized or incorrect current password
 */
router.post('/change-password', auth, changePassword);

/**
 * @swagger
 * /api/user/experts:
 *   get:
 *     summary: Get list of all experts
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Experts list retrieved successfully
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
 *                     experts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           displayName:
 *                             type: string
 *                           avatar:
 *                             type: string
 *                           expertise:
 *                             type: string
 */
router.get('/experts', getExperts);

export default router;

