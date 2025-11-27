/**
 * Admin IoT Routes
 * Routes for managing IoT connection codes (admin only)
 */
import express from 'express';
import * as adminIoTController from '../controllers/admin-iot.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/admin/iot-codes/generate:
 *   post:
 *     summary: Generate new IoT connection codes
 *     tags: [Admin - IoT]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *               - quantity
 *             properties:
 *               deviceId:
 *                 type: string
 *                 example: "JETSON001"
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 500
 *                 example: 100
 *     responses:
 *       201:
 *         description: Codes generated successfully
 */
router.post('/generate', authMiddleware, adminIoTController.generateCodes);

/**
 * @swagger
 * /api/admin/iot-codes/list:
 *   get:
 *     summary: List IoT connection codes
 *     tags: [Admin - IoT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: string
 *         description: Filter by device ID
 *       - in: query
 *         name: isUsed
 *         schema:
 *           type: boolean
 *         description: Filter by used status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *     responses:
 *       200:
 *         description: List of codes
 */
router.get('/list', authMiddleware, adminIoTController.listCodes);

/**
 * @swagger
 * /api/admin/iot-codes/export:
 *   get:
 *     summary: Export IoT connection codes as CSV
 *     tags: [Admin - IoT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: string
 *         description: Filter by device ID
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/export', authMiddleware, adminIoTController.exportCodes);

/**
 * @swagger
 * /api/admin/iot-codes/stats:
 *   get:
 *     summary: Get IoT connection code statistics
 *     tags: [Admin - IoT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: string
 *         description: Filter by device ID
 *     responses:
 *       200:
 *         description: Code statistics
 */
router.get('/stats', authMiddleware, adminIoTController.getCodeStats);

export default router;

