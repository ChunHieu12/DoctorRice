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
        quality: 'auto:good',
        fetch_format: 'auto',
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

      // Generate watermark text (simple ASCII only for better compatibility)
      const date = timestamp
        ? new Date(timestamp).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        : new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      const time = timestamp
        ? new Date(timestamp).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' });
      
      // Simple watermark without special characters
      const watermarkText = `Lat: ${lat.toFixed(6)}  Lng: ${lng.toFixed(6)}  ${date} ${time}`;

      // Generate watermarked URL with Cloudinary transformations
      const watermarkedUrl = cloudinary.url(original.public_id, {
        transformation: [
          {
            // Add semi-transparent overlay background for text
            overlay: 'black',
            opacity: 40,
            width: 'iw',
            height: 60,
            gravity: 'south',
            y: 0,
            crop: 'scale',
          },
          {
            // Add watermark text overlay
            overlay: {
              font_family: 'Arial',
              font_size: 24,
              font_weight: 'bold',
              text: watermarkText,
            },
            gravity: 'south_west',
            x: 15,
            y: 15,
            color: '#FFFFFF',
          },
          {
            // Add "Bac si Lua" branding (top right)
            overlay: {
              font_family: 'Arial',
              font_size: 20,
              font_weight: 'bold',
              text: 'Bac si Lua',
            },
            gravity: 'south_east',
            x: 15,
            y: 15,
            color: '#4CAF50',
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

