/**
 * IoT Routes
 * Routes for IoT device management and treatment
 */
import express from 'express';
import multer from 'multer';
import * as iotController from '../controllers/iot.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import treatmentRoutes from './treatment.routes';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * @swagger
 * /api/iot/connect:
 *   post:
 *     summary: Connect IoT device to field
 *     tags: [IoT]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fieldId
 *               - connectionCode
 *             properties:
 *               fieldId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               connectionCode:
 *                 type: string
 *                 example: "JETSON001-X8K9M2"
 *     responses:
 *       201:
 *         description: Device connected successfully
 *       400:
 *         description: Invalid code or validation error
 *       409:
 *         description: Field already has connection
 */
router.post('/connect', authMiddleware, iotController.connectDevice);

/**
 * @swagger
 * /api/iot/connection/status:
 *   get:
 *     summary: Get IoT connection status for a field
 *     tags: [IoT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fieldId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Connection status
 */
router.get('/connection/status', authMiddleware, iotController.getConnectionStatus);

/**
 * @swagger
 * /api/iot/disconnect:
 *   delete:
 *     summary: Disconnect IoT device from field
 *     tags: [IoT]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fieldId
 *             properties:
 *               fieldId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device disconnected successfully
 */
router.delete('/disconnect', authMiddleware, iotController.disconnectDevice);

/**
 * @swagger
 * /api/iot/connections:
 *   get:
 *     summary: Get list of user's IoT connections
 *     tags: [IoT]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of connections
 */
router.get('/connections', authMiddleware, iotController.listConnections);

/**
 * @swagger
 * /api/iot/images:
 *   get:
 *     summary: Get IoT images for a field
 *     tags: [IoT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fieldId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *           default: 7
 *     responses:
 *       200:
 *         description: List of IoT images
 */
router.get('/images', authMiddleware, iotController.getIoTImages);

/**
 * @swagger
 * /api/iot/upload:
 *   post:
 *     summary: Upload photo from mobile app to Firebase IoT
 *     tags: [IoT]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - fieldId
 *               - gps
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               fieldId:
 *                 type: string
 *               gps:
 *                 type: string
 *                 description: JSON string of {lat, lng}
 *               source:
 *                 type: string
 *                 default: mobile-app
 *     responses:
 *       201:
 *         description: Photo uploaded successfully
 */
router.post('/upload', authMiddleware, upload.single('image'), iotController.uploadMobilePhoto);

/**
 * @swagger
 * /api/iot/analyze:
 *   post:
 *     summary: Analyze IoT image with AI
 *     tags: [IoT]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 example: "https://storage.googleapis.com/..."
 *               captureId:
 *                 type: string
 *                 example: "20251107T011142_811"
 *               gps:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *               sensors:
 *                 type: object
 *     responses:
 *       200:
 *         description: Analysis result
 */
router.post('/analyze', authMiddleware, iotController.analyzeIoTImage);

// Treatment routes
router.use('/treatment', treatmentRoutes);

export default router;

