/**
 * AI Service Client
 * Communicates with Python AI microservice for disease prediction
 */
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { logger } from '../utils/logger';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';
const AI_REQUEST_TIMEOUT = 30000; // 30 seconds

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
      logger.info(`Calling AI service for prediction: ${imagePath}`);
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

