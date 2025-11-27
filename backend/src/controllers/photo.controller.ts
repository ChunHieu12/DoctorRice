/**
 * Photo Controller
 * Handles photo upload, AI prediction, watermarking, and retrieval
 */
import { Request, Response } from 'express';
import { Photo } from '../models/Photo';
import { AIService } from '../services/ai.service';
import { CloudinaryService } from '../services/cloudinary.service';
import { logger } from '../utils/logger';
import { errorResponse, successResponse } from '../utils/responses';

/**
 * Upload and process photo (with AI prediction)
 * 
 * Flow:
 * 1. Receive image + metadata
 * 2. Upload to Cloudinary (original + watermarked)
 * 3. Call AI service for disease prediction
 * 4. Save to database with all info
 * 5. Cleanup local file
 * 6. Return result
 */
export const uploadPhoto = async (req: Request, res: Response) => {
  let localFilePath: string | null = null;

  try {
    logger.info('📤 Photo upload request received');
    logger.info('Request body keys:', Object.keys(req.body));
    logger.info('Has file:', !!req.file);
    
    // Validate file upload
    if (!req.file) {
      logger.error('No file in request');
      return errorResponse(res, 'PHOTO_002', 'No file uploaded', 400);
    }

    localFilePath = req.file.path;
    logger.info(`File received: ${req.file.originalname}, size: ${req.file.size} bytes`);

    // Parse metadata - support both JSON object and individual form fields
    // ✅ GPS metadata is OPTIONAL (for chat image uploads)
    let lat: number | undefined, lng: number | undefined, timestamp: number, device: string, orientation: string;
    let hasGPS = false;
    
    if (req.body.metadata) {
      // Format 1: JSON metadata object
      try {
        const metadata = JSON.parse(req.body.metadata);
        lat = metadata.lat;
        lng = metadata.lng;
        timestamp = metadata.timestamp;
        device = metadata.device || 'Unknown';
        orientation = metadata.orientation || 'portrait';
        hasGPS = !!(lat && lng);
      } catch (e) {
        return errorResponse(res, 'PHOTO_002', 'Invalid metadata format', 400);
      }
    } else if (req.body.latitude && req.body.longitude) {
      // Format 2: Individual form fields (from mobile app)
      lat = parseFloat(req.body.latitude);
      lng = parseFloat(req.body.longitude);
      timestamp = req.body.timestamp ? parseInt(req.body.timestamp) : Date.now();
      device = req.body.device || 'Unknown';
      orientation = req.body.orientation || 'portrait';
      hasGPS = !isNaN(lat) && !isNaN(lng);
    } else {
      // ✅ No GPS data - this is OK for chat images
      timestamp = Date.now();
      device = req.body.device || 'Unknown';
      orientation = req.body.orientation || 'portrait';
      logger.info('No GPS metadata provided - uploading as chat image');
    }

    // Validate GPS data if provided
    if (hasGPS && (isNaN(lat!) || isNaN(lng!) || lat! < -90 || lat! > 90 || lng! < -180 || lng! > 180)) {
      return errorResponse(res, 'PHOTO_002', 'Invalid GPS coordinates', 400);
    }

    const userId = req.user!.userId;

    // Create photo record (status: processing)
    const photo = await Photo.create({
      userId,
      originalUrl: '', // Will be updated after Cloudinary upload
      watermarkedUrl: '',
      metadata: {
        lat,
        lng,
        timestamp,
        device,
        orientation,
      },
      fileSize: req.file.size,
      status: 'processing',
    });

    logger.info(`📸 Processing photo ${photo._id} for user ${userId}${hasGPS ? ` at [${lat}, ${lng}]` : ' (no GPS)'}`);

    // Warm up AI service first only if GPS exists (for rice leaf detection)
    let aiPrediction = null;
    if (hasGPS) {
      const aiWakeStart = Date.now();
      const aiHealthy = await AIService.healthCheck().catch(() => false);
      const aiWakeTime = Date.now() - aiWakeStart;
      logger.info(`🤖 AI Service health check: ${aiHealthy ? 'Ready' : 'Sleeping'} (${aiWakeTime}ms)`);
    }

    // Run AI prediction and Cloudinary upload (skip AI if no GPS)
    const processingStart = Date.now();
    logger.info(`🔄 Starting ${hasGPS ? 'parallel processing: AI + Cloudinary' : 'simple Cloudinary upload'}`);
    
    let cloudinaryResult;
    
    if (hasGPS) {
      // Full processing: AI + Watermark
      logger.info(`🤖 AI Service URL: ${process.env.AI_SERVICE_URL || 'http://localhost:5000'}`);
      
      [aiPrediction, cloudinaryResult] = await Promise.all([
        // 1. AI Prediction
        AIService.predictFromFile(localFilePath).catch((error) => {
          logger.error(`❌ AI prediction failed for photo ${photo._id}:`, error);
          logger.error(`❌ AI error details:`, {
            message: error.message,
            code: error.code,
            response: error.response?.data,
          });
          return null; // Don't fail the entire upload if AI fails
        }),

        // 2. Cloudinary Upload with Watermark
        CloudinaryService.uploadWithWatermark(
          localFilePath,
          {
            lat: lat!,
            lng: lng!,
            timestamp,
          },
          {
            folder: 'doctorrice/photos',
            public_id: `photo_${userId}_${Date.now()}`,
          }
        ).catch((error) => {
          logger.error(`❌ Cloudinary upload failed for photo ${photo._id}:`, error);
          throw error; // Cloudinary is critical - must succeed
        }),
      ]);
    } else {
      // Simple upload for chat images (no AI, no watermark)
      cloudinaryResult = await CloudinaryService.uploadSimple(localFilePath, {
        folder: 'doctorrice/chat',
        public_id: `chat_${userId}_${Date.now()}`,
      }).catch((error) => {
        logger.error(`❌ Cloudinary upload failed for photo ${photo._id}:`, error);
        throw error;
      });
    }

    // Validate Cloudinary result
    if (!cloudinaryResult || !cloudinaryResult.original || !cloudinaryResult.watermarked) {
      logger.error('❌ Invalid Cloudinary result:', cloudinaryResult);
      throw new Error('Cloudinary upload failed - invalid result');
    }

    // Generate thumbnail URL
    const thumbnailUrl = CloudinaryService.generateThumbnailUrl(
      cloudinaryResult.original.public_id,
      300,
      300
    );

    // Update photo with results
    photo.originalUrl = cloudinaryResult.original.secure_url;
    photo.watermarkedUrl = cloudinaryResult.watermarked;
    photo.thumbnailUrl = thumbnailUrl;
    photo.cloudinaryPublicId = cloudinaryResult.original.public_id;

    if (aiPrediction) {
      photo.prediction = {
        class: aiPrediction.class,
        classVi: aiPrediction.classVi,
        confidence: aiPrediction.confidence,
        allPredictions: aiPrediction.allPredictions,
      };
      logger.info(`🤖 AI Prediction: ${aiPrediction.classVi} (${aiPrediction.confidence.toFixed(2)}%)`);
    } else {
      logger.warn(`⚠️ No AI prediction available for photo ${photo._id}`);
    }

    photo.status = 'completed';
    await photo.save();

    logger.info(`💾 Photo saved to database: ${photo._id}`);

    // Cleanup local file
    CloudinaryService.cleanupLocalFile(localFilePath);

    const processingDuration = Date.now() - processingStart;
    logger.info(`✅ Photo ${photo._id} processed successfully`);
    logger.info(`⏱️ Total processing time: ${(processingDuration / 1000).toFixed(1)}s`);

    // Return response
    return res.status(201).json({
      success: true,
      message: 'Photo uploaded and processed successfully',
      data: {
        photo: {
          _id: photo._id,
          userId: photo.userId,
        originalUrl: photo.originalUrl,
        watermarkedUrl: photo.watermarkedUrl,
          thumbnailUrl: photo.thumbnailUrl,
          cloudinaryPublicId: photo.cloudinaryPublicId,
        metadata: photo.metadata,
          prediction: photo.prediction,
          status: photo.status,
          fileSize: photo.fileSize,
          createdAt: photo.createdAt,
          updatedAt: photo.updatedAt,
        },
      },
    });
  } catch (error: any) {
    logger.error('Photo upload error:', error);

    // Cleanup local file on error
    if (localFilePath) {
      CloudinaryService.cleanupLocalFile(localFilePath);
    }

    return errorResponse(
      res,
      'PHOTO_004',
      `Photo processing failed: ${error.message}`,
      500
    );
  }
};

/**
 * Get user photos (list with pagination)
 */
export const getPhotos = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    // Build query
    const query: any = { userId };
    if (status && ['processing', 'completed', 'failed'].includes(status)) {
      query.status = status;
    }

    // Fetch photos with pagination
    const photos = await Photo.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-__v')
      .lean();

    const total = await Photo.countDocuments(query);

    return successResponse(res, {
      photos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    logger.error('Get photos error:', error);
    return errorResponse(res, 'SERVER_001', 'Failed to fetch photos', 500);
  }
};

/**
 * Get single photo by ID
 */
export const getPhotoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const photo = await Photo.findOne({ _id: id, userId }).select('-__v').lean();

    if (!photo) {
      return errorResponse(res, 'PHOTO_003', 'Photo not found', 404);
    }

    return successResponse(res, { photo });
  } catch (error: any) {
    logger.error('Get photo error:', error);
    return errorResponse(res, 'SERVER_001', 'Failed to fetch photo', 500);
  }
};

/**
 * Get photos for map view (all photos with coordinates)
 */
export const getPhotosForMap = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get all completed photos with thumbnails
    const photos = await Photo.find({
      userId,
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .select('_id thumbnailUrl watermarkedUrl metadata.lat metadata.lng prediction createdAt')
      .lean();

    // Format for map markers
    const markers = photos.map((photo) => ({
      id: photo._id,
      latitude: photo.metadata?.lat,
      longitude: photo.metadata?.lng,
      thumbnail: photo.thumbnailUrl,
      image: photo.watermarkedUrl,
      prediction: photo.prediction,
      createdAt: photo.createdAt,
    }));

    return successResponse(res, { markers, total: markers.length });
  } catch (error: any) {
    logger.error('Get map photos error:', error);
    return errorResponse(res, 'SERVER_001', 'Failed to fetch map photos', 500);
  }
};

/**
 * Delete photo
 */
export const deletePhoto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const photo = await Photo.findOne({ _id: id, userId });
    if (!photo) {
      return errorResponse(res, 'PHOTO_003', 'Photo not found', 404);
    }

    // Delete from Cloudinary if exists
    if (photo.cloudinaryPublicId) {
      try {
        await CloudinaryService.deleteImage(photo.cloudinaryPublicId);
      } catch (error) {
        logger.warn(`Failed to delete from Cloudinary: ${photo.cloudinaryPublicId}`);
      }
    }

    // Delete from database
    await photo.deleteOne();

    logger.info(`🗑️  Photo ${id} deleted by user ${userId}`);

    return successResponse(res, { message: 'Photo deleted successfully' });
  } catch (error: any) {
    logger.error('Delete photo error:', error);
    return errorResponse(res, 'SERVER_001', 'Failed to delete photo', 500);
  }
};

/**
 * Update treatment data for a photo
 * PUT /api/photos/:id/treatment
 */
export const updateTreatmentData = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { treatmentData } = req.body;

    if (!treatmentData) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Treatment data is required', 400);
    }

    // Validate treatment data structure
    if (!treatmentData.disease || !treatmentData.disease.name) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Treatment data must include disease information', 400);
    }

    // Find photo
    const photo = await Photo.findOne({ _id: id, userId });
    if (!photo) {
      return errorResponse(res, 'NOT_FOUND', 'Photo not found', 404);
    }

    // Update treatment data
    photo.treatmentData = treatmentData;
    await photo.save();

    logger.info(`✅ Treatment data updated for photo ${id} by user ${userId}`, {
      disease: treatmentData.disease.name,
      hasPesticides: treatmentData.pesticides?.length > 0,
      hasFertilizers: treatmentData.fertilizers?.length > 0,
    });

    return successResponse(res, {
      photo: {
        _id: photo._id,
        treatmentData: photo.treatmentData,
      },
      message: 'Treatment data updated successfully',
    });
  } catch (error: any) {
    logger.error('Update treatment data error:', error);
    return errorResponse(res, 'SERVER_001', 'Failed to update treatment data', 500);
  }
};

/**
 * Get user statistics
 */
export const getPhotoStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get counts by status and disease type
    const [
      totalPhotos,
      completedPhotos,
      processingPhotos,
      failedPhotos,
      diseaseStats,
    ] = await Promise.all([
      Photo.countDocuments({ userId }),
      Photo.countDocuments({ userId, status: 'completed' }),
      Photo.countDocuments({ userId, status: 'processing' }),
      Photo.countDocuments({ userId, status: 'failed' }),
      Photo.aggregate([
        { $match: { userId, status: 'completed', 'prediction.class': { $exists: true } } },
        { $group: { _id: '$prediction.class', count: { $sum: 1 } } },
      ]),
    ]);

    // Format disease stats
    const diseaseBreakdown: Record<string, number> = {
      bacterial_leaf_blight: 0,
      blast: 0,
      brown_spot: 0,
      healthy: 0,
    };

    diseaseStats.forEach((stat) => {
      diseaseBreakdown[stat._id] = stat.count;
    });

    return successResponse(res, {
      total: totalPhotos,
      completed: completedPhotos,
      processing: processingPhotos,
      failed: failedPhotos,
      diseases: diseaseBreakdown,
    });
  } catch (error: any) {
    logger.error('Get stats error:', error);
    return errorResponse(res, 'SERVER_001', 'Failed to fetch statistics', 500);
  }
};
