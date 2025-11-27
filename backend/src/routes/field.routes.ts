/**
 * Field Routes
 * Routes for managing rice fields
 */
import express from 'express';
import * as fieldController from '../controllers/field.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/fields/create:
 *   post:
 *     summary: Create new field
 *     tags: [Fields]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - gpsCenter
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Ruộng Tân Định"
 *               gpsCenter:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 10.8525093
 *                   lng:
 *                     type: number
 *                     example: 106.6664848
 *               radius:
 *                 type: number
 *                 default: 500
 *                 example: 500
 *               metadata:
 *                 type: object
 *                 properties:
 *                   area:
 *                     type: number
 *                   cropType:
 *                     type: string
 *                   plantedDate:
 *                     type: string
 *                     format: date
 *     responses:
 *       201:
 *         description: Field created successfully
 */
router.post('/create', authMiddleware, fieldController.createField);

/**
 * @swagger
 * /api/fields/list:
 *   get:
 *     summary: Get list of user's fields
 *     tags: [Fields]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Include inactive fields
 *     responses:
 *       200:
 *         description: List of fields
 */
router.get('/list', authMiddleware, fieldController.listFields);

/**
 * @swagger
 * /api/fields/{id}:
 *   get:
 *     summary: Get field details
 *     tags: [Fields]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Field details
 *       404:
 *         description: Field not found
 */
router.get('/:id', authMiddleware, fieldController.getField);

/**
 * @swagger
 * /api/fields/{id}/iot-code:
 *   get:
 *     summary: Get IoT connection code for field
 *     tags: [Fields]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: IoT connection code
 *       404:
 *         description: Field not found or no code available
 */
router.get('/:id/iot-code', authMiddleware, fieldController.getFieldIoTCode);

/**
 * @swagger
 * /api/fields/{id}:
 *   put:
 *     summary: Update field
 *     tags: [Fields]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               gpsCenter:
 *                 type: object
 *               radius:
 *                 type: number
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Field updated
 */
router.put('/:id', authMiddleware, fieldController.updateField);

/**
 * @swagger
 * /api/fields/{id}:
 *   delete:
 *     summary: Delete field (soft delete)
 *     tags: [Fields]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Field deleted
 *       409:
 *         description: Cannot delete field with active IoT connection
 */
router.delete('/:id', authMiddleware, fieldController.deleteField);

export default router;

