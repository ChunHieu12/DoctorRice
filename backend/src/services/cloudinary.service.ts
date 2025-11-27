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
      // Check if credentials are configured
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        const missing = [];
        if (!process.env.CLOUDINARY_CLOUD_NAME) missing.push('CLOUDINARY_CLOUD_NAME');
        if (!process.env.CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
        if (!process.env.CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
        
        logger.error(`❌ Missing Cloudinary credentials: ${missing.join(', ')}`);
        throw new Error(`Cloudinary not configured. Missing: ${missing.join(', ')}`);
      }

      logger.info(`📤 Uploading image to Cloudinary: ${filePath}`);
      logger.info(`☁️ Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}, Folder: ${options.folder || 'doctorrice/photos'}`);

      const result = await cloudinary.uploader.upload(filePath, {
        folder: options.folder || 'doctorrice/photos',
        public_id: options.public_id,
        overwrite: options.overwrite ?? false,
        resource_type: 'image',
        // Note: quality and fetch_format are transformation params, not upload params
        // They should only be used when generating URLs, not during upload
      });

      logger.info(`✅ Image uploaded: ${result.secure_url}`);
      return result;
    } catch (error: any) {
      logger.error('❌ Cloudinary upload error:', {
        message: error.message,
        code: error.error?.http_code,
        details: error.error?.message,
      });
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

      // Generate watermark text with Vietnam timezone
      const dateTime = timestamp
        ? new Date(timestamp)
        : new Date();
      
      // Format date/time with Asia/Ho_Chi_Minh timezone (UTC+7)
      const vietnamDate = dateTime.toLocaleDateString('vi-VN', { 
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-'); // Replace slashes with dashes
      
      const vietnamTime = dateTime.toLocaleTimeString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      // Simple coordinates text
      const coordsText = `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      const dateTimeText = `${vietnamDate} ${vietnamTime}`;

      // Generate watermarked URL - text at top-right
      const watermarkedUrl = cloudinary.url(original.public_id, {
        transformation: [
          {
            overlay: {
              font_family: 'Arial',
              font_size: 28,
              font_weight: 'bold',
              text_align: 'right',
              text: `${coordsText} | ${dateTimeText}`,
            },
            gravity: 'north_east', // Top-right corner
            x: 20,
            y: 60,
            color: 'white',
          },
          {
            overlay: {
              font_family: 'Arial',
              font_size: 22,
              font_weight: 'bold',
              text: 'Bac si Lua',
            },
            gravity: 'north_east', // Top-right corner
            x: 20,
            y: 20,
            color: 'rgb:4CAF50',
          },
          {
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
   * ✅ Simple upload without watermark (for chat images)
   * @param filePath - Local file path
   * @param options - Upload options
   * @returns Upload result with original and "watermarked" (same as original) URLs
   */
  static async uploadSimple(
    filePath: string,
    options: CloudinaryUploadOptions = {}
  ): Promise<{ original: UploadApiResponse; watermarked: string }> {
    try {
      logger.info(`📤 Simple upload (no watermark) to Cloudinary: ${filePath}`);
      
      // Upload original image
      const original = await this.uploadImage(filePath, options);
      
      // For chat images, just return original URL as "watermarked" too
      const optimizedUrl = cloudinary.url(original.public_id, {
        transformation: [
          {
            quality: 'auto:good',
            fetch_format: 'auto',
          },
        ],
      });
      
      logger.info(`✅ Simple upload complete: ${optimizedUrl}`);
      
      return {
        original,
        watermarked: optimizedUrl, // Same as original but optimized
      };
    } catch (error: any) {
      logger.error('Cloudinary simple upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
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

