/**
 * Treatment Controller
 * Send treatment information to IoT devices
 */
import { Request, Response } from 'express';
import { Field } from '../models/Field';
import { IoTConnection } from '../models/IoTConnection';
import { Photo } from '../models/Photo';
import { TreatmentLog } from '../models/TreatmentLog';
import { firebaseIoTService } from '../services/firebase-iot.service';
import { logger } from '../utils/logger';
import { errorResponse, successResponse } from '../utils/responses';

/**
 * Send treatment to IoT device
 * POST /api/iot/treatment/send
 */
export const sendTreatment = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { photoId, fieldId } = req.body;
    
    if (!photoId || !fieldId) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Photo ID and Field ID are required', 400);
    }
    
    // Get photo
    const photo = await Photo.findOne({ _id: photoId, userId });
    if (!photo || !photo.treatmentData) {
      return errorResponse(res, 'NOT_FOUND', 'Photo or treatment data not found', 404);
    }
    
    // Get field
    const field = await Field.findOne({ _id: fieldId, userId });
    if (!field) {
      return errorResponse(res, 'NOT_FOUND', 'Field not found', 404);
    }
    
    // Get IoT connection
    const connection = await IoTConnection.findOne({ fieldId, status: 'active' });
    if (!connection) {
      return errorResponse(res, 'NOT_FOUND', 'No active IoT connection for this field', 404);
    }
    
    // Prepare Firebase data
    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare photo data for Firebase formatting
    const photoData = {
      imageUrl: photo.originalUrl,
      gps: {
        lat: photo.metadata?.lat || 0,
        lng: photo.metadata?.lng || 0,
      },
    };
    
    // Write to Firebase executions
    const firebasePaths = await firebaseIoTService.writeTreatment(
      sessionId,
      photo.treatmentData!,
      photoData
    );
    
    const firebasePath = firebasePaths.join(', ');
    
    // Log treatment
    const log = await TreatmentLog.create({
      userId,
      fieldId,
      photoId,
      deviceId: connection.deviceId,
      treatmentData: photo.treatmentData,
      firebasePath,
      status: 'sent',
      sentAt: new Date(),
    });
    
    logger.info(`✅ Treatment sent to ${connection.deviceId} for field ${field.name}`);
    
    return successResponse(
      res,
      {
        treatmentLog: {
          _id: log._id,
          firebasePath,
          sentAt: log.sentAt,
        },
        message: 'Đã gửi thông tin điều trị thành công!',
      },
      201
    );
  } catch (error: any) {
    logger.error('❌ Send treatment error:', error);
    return errorResponse(res, 'SERVER_ERROR', error.message, 500);
  }
};

/**
 * Get treatment history
 * GET /api/iot/treatment/history
 */
export const getTreatmentHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { fieldId, limit = 20 } = req.query;
    
    const query: any = { userId };
    if (fieldId) {
      query.fieldId = fieldId;
    }
    
    const treatments = await TreatmentLog.find(query)
      .populate('fieldId', 'name')
      .populate('photoId', 'prediction')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    
    return successResponse(res, {
      treatments: treatments.map(t => ({
        _id: t._id,
        disease: t.treatmentData.disease.name,
        field: t.fieldId,
        deviceId: t.deviceId,
        status: t.status,
        sentAt: t.sentAt,
        firebasePath: t.firebasePath,
      })),
      total: treatments.length,
    });
  } catch (error: any) {
    logger.error('❌ Get treatment history error:', error);
    return errorResponse(res, 'SERVER_ERROR', error.message, 500);
  }
};

