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
    let lat: number, lng: number, timestamp: number, device: string, orientation: string;
    
    if (req.body.metadata) {
      // Format 1: JSON metadata object
      try {
        const metadata = JSON.parse(req.body.metadata);
        lat = metadata.lat;
        lng = metadata.lng;
        timestamp = metadata.timestamp;
        device = metadata.device || 'Unknown';
        orientation = metadata.orientation || 'portrait';
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
    } else {
      return errorResponse(res, 'PHOTO_002', 'Missing GPS coordinates (latitude/longitude)', 400);
    }

    // Validate GPS data
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
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

    logger.info(`📸 Processing photo ${photo._id} for user ${userId} at [${lat}, ${lng}]`);

    // Run AI prediction and Cloudinary upload in parallel
    const [aiPrediction, cloudinaryResult] = await Promise.all([
      // 1. AI Prediction
      AIService.predictFromFile(localFilePath).catch((error) => {
        logger.error(`AI prediction failed for photo ${photo._id}:`, error);
        return null; // Don't fail the entire upload if AI fails
      }),

      // 2. Cloudinary Upload with Watermark
      CloudinaryService.uploadWithWatermark(
        localFilePath,
        {
          lat,
          lng,
          timestamp,
        },
        {
          folder: 'doctorrice/photos',
          public_id: `photo_${userId}_${Date.now()}`,
        }
      ),
    ]);

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

    logger.info(`✅ Photo ${photo._id} processed successfully`);

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
