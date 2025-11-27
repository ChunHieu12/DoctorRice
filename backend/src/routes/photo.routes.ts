/**
 * @swagger
 * tags:
 *   name: Photos
 *   description: Photo management with AI disease detection and GPS watermarking
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
    deletePhoto,
    getPhotoById,
    getPhotos,
    getPhotosForMap,
    getPhotoStats,
    updateTreatmentData,
    uploadPhoto,
} from '../controllers/photo.controller';
import { auth } from '../middleware/auth.middleware';

const router = Router();

// Multer configuration
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `photo-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG/PNG/WebP images are allowed'));
  },
});

/**
 * @swagger
 * /api/photos/upload:
 *   post:
 *     summary: Upload photo with AI disease detection and GPS watermarking
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - photo
 *               - metadata
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Rice leaf image (JPEG/PNG, max 10MB)
 *               metadata:
 *                 type: string
 *                 description: JSON string with GPS and device info
 *                 example: '{"lat":10.8231,"lng":106.6297,"timestamp":1698765432000,"device":"iOS 17.0","orientation":"portrait"}'
 *     responses:
 *       201:
 *         description: Photo uploaded and processed successfully
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
 *                     photoId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     originalUrl:
 *                       type: string
 *                       example: "https://res.cloudinary.com/..."
 *                     watermarkedUrl:
 *                       type: string
 *                       example: "https://res.cloudinary.com/..."
 *                     thumbnailUrl:
 *                       type: string
 *                       example: "https://res.cloudinary.com/..."
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         lat:
 *                           type: number
 *                           example: 10.8231
 *                         lng:
 *                           type: number
 *                           example: 106.6297
 *                         timestamp:
 *                           type: number
 *                           example: 1698765432000
 *                         device:
 *                           type: string
 *                           example: "iOS 17.0"
 *                         orientation:
 *                           type: string
 *                           example: "portrait"
 *                     prediction:
 *                       type: object
 *                       properties:
 *                         class:
 *                           type: string
 *                           example: "blast"
 *                           enum: [bacterial_leaf_blight, blast, brown_spot, healthy]
 *                         classVi:
 *                           type: string
 *                           example: "Bệnh đạo ôn"
 *                         confidence:
 *                           type: number
 *                           example: 99.4
 *                         allPredictions:
 *                           type: object
 *                           example: {"bacterial_leaf_blight":0.2,"blast":99.4,"brown_spot":0.3,"healthy":0.1}
 *                     status:
 *                       type: string
 *                       example: "completed"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request (missing file or metadata)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Processing failed
 */
router.post('/upload', auth, upload.single('photo'), uploadPhoto);

/**
 * @swagger
 * /api/photos:
 *   get:
 *     summary: Get user's photos with pagination
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [processing, completed, failed]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of photos
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
 *                     photos:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 */
router.get('/', auth, getPhotos);

/**
 * @swagger
 * /api/photos/stats:
 *   get:
 *     summary: Get user's photo statistics
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Photo statistics
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
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     completed:
 *                       type: integer
 *                       example: 95
 *                     processing:
 *                       type: integer
 *                       example: 3
 *                     failed:
 *                       type: integer
 *                       example: 2
 *                     diseases:
 *                       type: object
 *                       properties:
 *                         bacterial_leaf_blight:
 *                           type: integer
 *                           example: 20
 *                         blast:
 *                           type: integer
 *                           example: 15
 *                         brown_spot:
 *                           type: integer
 *                           example: 10
 *                         healthy:
 *                           type: integer
 *                           example: 50
 */
router.get('/stats', auth, getPhotoStats);

/**
 * @swagger
 * /api/photos/map:
 *   get:
 *     summary: Get photos for map view (with coordinates)
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Map markers data
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
 *                     markers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           latitude:
 *                             type: number
 *                           longitude:
 *                             type: number
 *                           thumbnail:
 *                             type: string
 *                           image:
 *                             type: string
 *                           prediction:
 *                             type: object
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: integer
 */
router.get('/map', auth, getPhotosForMap);

/**
 * @swagger
 * /api/photos/{id}:
 *   get:
 *     summary: Get single photo by ID
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Photo ID
 *     responses:
 *       200:
 *         description: Photo details
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
 *                     photo:
 *                       type: object
 *       404:
 *         description: Photo not found
 *   delete:
 *     summary: Delete photo
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Photo ID
 *     responses:
 *       200:
 *         description: Photo deleted successfully
 *       404:
 *         description: Photo not found
 */
router.get('/:id', auth, getPhotoById);
router.delete('/:id', auth, deletePhoto);

/**
 * @swagger
 * /api/photos/{id}/treatment:
 *   put:
 *     summary: Update treatment data for a photo
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Photo ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - treatmentData
 *             properties:
 *               treatmentData:
 *                 type: object
 *                 description: Structured treatment data from chatbot AI
 *     responses:
 *       200:
 *         description: Treatment data updated successfully
 *       400:
 *         description: Invalid treatment data
 *       404:
 *         description: Photo not found
 */
router.put('/:id/treatment', auth, updateTreatmentData);

export default router;

