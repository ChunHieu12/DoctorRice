/**
 * Treatment Routes
 * Send treatment information to IoT devices
 */
import express from 'express';
import * as treatmentController from '../controllers/treatment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/iot/treatment/send:
 *   post:
 *     summary: Send treatment to IoT device
 *     tags: [Treatment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - photoId
 *               - fieldId
 *             properties:
 *               photoId:
 *                 type: string
 *               fieldId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Treatment sent successfully
 */
router.post('/send', authMiddleware, treatmentController.sendTreatment);

/**
 * @swagger
 * /api/iot/treatment/history:
 *   get:
 *     summary: Get treatment history
 *     tags: [Treatment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fieldId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 20
 *     responses:
 *       200:
 *         description: Treatment history
 */
router.get('/history', authMiddleware, treatmentController.getTreatmentHistory);

export default router;

