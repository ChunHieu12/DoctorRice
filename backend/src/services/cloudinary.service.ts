/**
 * Cloudinary Service
 * Upload images and add GPS watermark using Cloudinary
 */
import { UploadApiResponse } from 'cloudinary';
import fs from 'fs';
import { cloudinary } from '../config/cloudinary';
import { logger } from '../utils/logger';

export interface CloudinaryUploadOptions {
  folder?: string;
  public_id?: string;
  overwrite?: boolean;
}

export interface WatermarkOptions {
  lat: number;
  lng: number;
  timestamp?: number;
}

/**
 * Cloudinary Service class
 */
export class CloudinaryService {
  /**
   * Upload image to Cloudinary
   * @param filePath - Local file path
   * @param options - Upload options
   * @returns Upload result with URL
   */
  static async uploadImage(
    filePath: string,
    options: CloudinaryUploadOptions = {}
  ): Promise<UploadApiResponse> {
    try {
      logger.info(`Uploading image to Cloudinary: ${filePath}`);

      const result = await cloudinary.uploader.upload(filePath, {
        folder: options.folder || 'doctorrice/photos',
        public_id: options.public_id,
        overwrite: options.overwrite ?? false,
        resource_type: 'image',
        quality: 'auto:good',
        fetch_format: 'auto',
      });

      logger.info(`✅ Image uploaded: ${result.secure_url}`);
      return result;
    } catch (error: any) {
      logger.error('Cloudinary upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Upload image and add GPS watermark
   * @param filePath - Local file path
   * @param watermarkOptions - GPS coordinates
   * @param uploadOptions - Upload options
   * @returns Upload result with watermarked URL
   */
  static async uploadWithWatermark(
    filePath: string,
    watermarkOptions: WatermarkOptions,
    uploadOptions: CloudinaryUploadOptions = {}
  ): Promise<{ original: UploadApiResponse; watermarked: string }> {
    try {
      const { lat, lng, timestamp } = watermarkOptions;

      // Upload original image first
      const original = await this.uploadImage(filePath, uploadOptions);

      // Generate watermark text
      const date = timestamp
        ? new Date(timestamp).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        : new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      const coordinates = `${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E`;
      const watermarkText = `📍 ${coordinates} | ${date} | Bác sĩ Lúa`;

      // Generate watermarked URL with Cloudinary transformations
      const watermarkedUrl = cloudinary.url(original.public_id, {
        transformation: [
          {
            // Add watermark text overlay
            overlay: {
              font_family: 'Arial',
              font_size: 28,
              font_weight: 'bold',
              text: watermarkText,
            },
            gravity: 'south_west',
            x: 20,
            y: 20,
            color: '#FFFFFF',
          },
          {
            // Add shadow/stroke for better visibility
            effect: 'shadow:50',
          },
          {
            // Quality and format
            quality: 'auto:good',
            fetch_format: 'auto',
          },
        ],
      });

      logger.info(`✅ Watermarked URL generated: ${watermarkedUrl}`);

      return {
        original,
        watermarked: watermarkedUrl,
      };
    } catch (error: any) {
      logger.error('Cloudinary watermark error:', error);
      throw new Error(`Failed to add watermark: ${error.message}`);
    }
  }

  /**
   * Delete image from Cloudinary
   * @param publicId - Cloudinary public ID
   */
  static async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      logger.info(`✅ Image deleted: ${publicId}`);
    } catch (error: any) {
      logger.error('Cloudinary delete error:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Generate thumbnail URL from public ID
   * @param publicId - Cloudinary public ID
   * @param width - Thumbnail width
   * @param height - Thumbnail height
   * @returns Thumbnail URL
   */
  static generateThumbnailUrl(
    publicId: string,
    width: number = 200,
    height: number = 200
  ): string {
    return cloudinary.url(publicId, {
      transformation: [
        {
          width,
          height,
          crop: 'fill',
          gravity: 'auto',
        },
        {
          quality: 'auto:good',
          fetch_format: 'auto',
        },
      ],
    });
  }

  /**
   * Cleanup local file after upload
   * @param filePath - Local file path to delete
   */
  static cleanupLocalFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`🗑️  Local file cleaned up: ${filePath}`);
      }
    } catch (error: any) {
      logger.error('File cleanup error:', error);
      // Don't throw - cleanup is not critical
    }
  }
}

