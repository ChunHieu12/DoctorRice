import { Request, Response } from 'express';
import path from 'path';
import { Photo } from '../models/Photo';
import { WatermarkService } from '../services/watermark.service';
import { errorResponse, successResponse } from '../utils/responses';

/**
 * Upload and watermark photo
 */
export const uploadPhoto = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'PHOTO_002', 'No file uploaded', 400);
    }

    const { lat, lng, timestamp, device, orientation } = JSON.parse(
      req.body.metadata || '{}'
    );

    if (!lat || !lng || !timestamp) {
      return errorResponse(res, 'PHOTO_002', 'Missing GPS metadata', 400);
    }

    const userId = req.user!.userId;
    const originalPath = req.file.path;
    const filename = `watermarked_${Date.now()}_${req.file.filename}`;
    const watermarkedPath = path.join('uploads', filename);

    // Add watermark
    await WatermarkService.addWatermark(originalPath, watermarkedPath, {
      lat,
      lng,
      timestamp,
      device: device || 'Unknown',
    });

    // Create photo record
    const photo = await Photo.create({
      userId,
      originalUrl: `/uploads/${req.file.filename}`,
      watermarkedUrl: `/uploads/${filename}`,
      metadata: { lat, lng, timestamp, device, orientation: orientation || 'portrait' },
      fileSize: req.file.size,
      status: 'completed',
    });

    return successResponse(
      res,
      {
        photoId: photo._id,
        originalUrl: photo.originalUrl,
        watermarkedUrl: photo.watermarkedUrl,
        metadata: photo.metadata,
      },
      201
    );
  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse(res, 'PHOTO_004', 'Watermark processing failed', 500);
  }
};

/**
 * Get user photos
 */
export const getPhotos = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const photos = await Photo.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Photo.countDocuments({ userId });

    return successResponse(res, {
      photos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return errorResponse(res, 'SERVER_001', 'Failed to fetch photos', 500);
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

    await photo.deleteOne();

    return successResponse(res, { message: 'Photo deleted successfully' });
  } catch (error) {
    return errorResponse(res, 'SERVER_001', 'Failed to delete photo', 500);
  }
};

