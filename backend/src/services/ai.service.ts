/**
 * AI Service Client
 * Communicates with Python AI microservice for disease prediction
 */
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { logger } from '../utils/logger';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';
const AI_REQUEST_TIMEOUT = 120000; // 120 seconds (for Render free tier cold start + processing)

export interface AIPredictionResult {
  class: string; // 'bacterial_leaf_blight' | 'blast' | 'brown_spot' | 'healthy'
  classVi: string; // Vietnamese label
  confidence: number; // 0-100
  allPredictions: Record<string, number>;
}

/**
 * AI Service class
 */
export class AIService {
  /**
   * Check if AI service is healthy
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/health`, {
        timeout: 5000,
      });
      return response.data.model_loaded === true;
    } catch (error) {
      logger.error('AI service health check failed:', error);
      return false;
    }
  }

  /**
   * Predict rice leaf disease from image file
   * @param imagePath - Local path to image file
   * @returns Prediction result
   */
  static async predictFromFile(imagePath: string): Promise<AIPredictionResult> {
    try {
      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      // Create form data
      const formData = new FormData();
      formData.append('image', fs.createReadStream(imagePath));

      // Call AI service
      const aiCallStart = Date.now();
      logger.info(`🔄 Calling AI service for prediction: ${imagePath}`);
      logger.info(`🌐 AI Service URL: ${AI_SERVICE_URL}`);
      
      const response = await axios.post(`${AI_SERVICE_URL}/predict`, formData, {
        headers: formData.getHeaders(),
        timeout: AI_REQUEST_TIMEOUT,
      });

      const aiCallDuration = Date.now() - aiCallStart;
      logger.info(`⏱️ AI service response time: ${(aiCallDuration / 1000).toFixed(1)}s`);

      if (!response.data.success) {
        throw new Error('AI prediction failed');
      }

      const prediction = response.data.prediction as AIPredictionResult;
      logger.info(
        `✅ AI Prediction: ${prediction.classVi} (${prediction.confidence.toFixed(2)}%)`
      );

      return prediction;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        logger.error('AI service error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });

        if (error.code === 'ECONNREFUSED') {
          throw new Error('AI service is not available. Please check if the service is running.');
        }

        if (error.response?.status === 400) {
          throw new Error(error.response.data.error || 'Invalid image file');
        }

        if (error.response?.status === 500) {
          throw new Error('AI prediction failed. Please try again.');
        }
      }

      throw new Error(`AI prediction error: ${error.message}`);
    }
  }

  /**
   * Predict from image buffer (in-memory)
   * @param imageBuffer - Image data buffer
   * @param filename - Original filename
   * @returns Prediction result
   */
  static async predictFromBuffer(
    imageBuffer: Buffer,
    filename: string = 'image.jpg'
  ): Promise<AIPredictionResult> {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('image', imageBuffer, {
        filename,
        contentType: 'image/jpeg',
      });

      // Call AI service
      logger.info('Calling AI service for prediction (from buffer)');
      const response = await axios.post(`${AI_SERVICE_URL}/predict`, formData, {
        headers: formData.getHeaders(),
        timeout: AI_REQUEST_TIMEOUT,
      });

      if (!response.data.success) {
        throw new Error('AI prediction failed');
      }

      const prediction = response.data.prediction as AIPredictionResult;
      logger.info(
        `✅ AI Prediction: ${prediction.classVi} (${prediction.confidence.toFixed(2)}%)`
      );

      return prediction;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        logger.error('AI service error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      }

      throw new Error(`AI prediction error: ${error.message}`);
    }
  }

  /**
   * Predict from image URL (for IoT images)
   * @param imageUrl - Firebase Storage or other public image URL
   * @returns Prediction result
   */
  static async predictFromUrl(imageUrl: string): Promise<AIPredictionResult> {
    try {
      logger.info(`🔄 Downloading image from Firebase Storage...`);
      logger.info(`Full URL: ${imageUrl}`);
      
      // Download image from URL with proper headers
      const downloadStart = Date.now();
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30s timeout for download
        headers: {
          'User-Agent': 'DoctorRice-Backend/1.0',
          'Accept': 'image/jpeg,image/png,image/*',
        },
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 300,
      });
      
      const downloadDuration = Date.now() - downloadStart;
      logger.info(`⏱️ Image download time: ${(downloadDuration / 1000).toFixed(1)}s`);
      
      // Verify we got image data
      if (!imageResponse.data || imageResponse.data.length === 0) {
        throw new Error('Empty image data received from URL');
      }
      
      // Convert to buffer
      const imageBuffer = Buffer.from(imageResponse.data);
      logger.info(`📦 Image buffer size: ${(imageBuffer.length / 1024).toFixed(1)} KB`);
      
      // Verify buffer is valid image (check magic numbers)
      const magicNumber = imageBuffer.slice(0, 4).toString('hex');
      const isValidImage = 
        magicNumber.startsWith('ffd8ff') || // JPEG
        magicNumber.startsWith('89504e47'); // PNG
      
      if (!isValidImage) {
        logger.error(`Invalid image format. Magic number: ${magicNumber}`);
        throw new Error('Downloaded data is not a valid image format');
      }
      
      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const filenameWithQuery = urlParts[urlParts.length - 1];
      const filename = filenameWithQuery.split('?')[0] || 'iot-image.jpg';
      
      logger.info(`📄 Extracted filename: ${filename}`);
      
      // Use existing predictFromBuffer method
      return await this.predictFromBuffer(imageBuffer, filename);
      
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        logger.error('❌ Failed to download image from URL:', {
          url: imageUrl,
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          code: error.code,
          responseData: error.response?.data?.toString('utf-8').substring(0, 200),
        });
        
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new Error('Cannot reach image URL. Please check the URL is accessible.');
        }
        
        if (error.response?.status === 400) {
          throw new Error('Bad request to Firebase Storage. The URL may be invalid or expired.');
        }
        
        if (error.response?.status === 404) {
          throw new Error('Image not found at the provided URL.');
        }
        
        if (error.response?.status === 403) {
          throw new Error('Access denied to image URL. Please check permissions.');
        }
      }
      
      throw new Error(`Failed to predict from URL: ${error.message}`);
    }
  }

  /**
   * Get health status with retry
   */
  static async waitForService(maxRetries: number = 3, delayMs: number = 2000): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      const isHealthy = await this.healthCheck();
      if (isHealthy) {
        return true;
      }

      logger.warn(`AI service not ready, retrying in ${delayMs}ms... (${i + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    return false;
  }
}

