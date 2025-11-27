/**
 * Field Controller
 * Manage rice fields with GPS geofencing
 */
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { Field } from '../models/Field';
import { IoTConnection } from '../models/IoTConnection';
import { IoTConnectionCode } from '../models/IoTConnectionCode';
import { isValidGPS } from '../utils/gps.utils';
import { logger } from '../utils/logger';
import { errorResponse, successResponse } from '../utils/responses';

/**
 * Create new field
 * POST /api/fields/create
 */
export const createField = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, gpsCenter, radius, metadata } = req.body;
    
    // Validate required fields
    if (!name || !gpsCenter || !gpsCenter.lat || !gpsCenter.lng) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Name and GPS center are required', 400);
    }
    
    // Validate GPS
    if (!isValidGPS(gpsCenter.lat, gpsCenter.lng)) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Invalid GPS coordinates', 400);
    }
    
    // Validate radius
    const fieldRadius = radius || 500;
    if (fieldRadius < 100 || fieldRadius > 5000) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Radius must be between 100 and 5000 meters', 400);
    }
    
    // Create field
    const field = await Field.create({
      userId,
      name: name.trim(),
      gpsCenter: {
        lat: gpsCenter.lat,
        lng: gpsCenter.lng,
      },
      radius: fieldRadius,
      metadata: metadata || {},
      isActive: true,
    });
    
    // Auto-generate IoT connection code for this field
    const generatedCode = `FIELD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    
    // Hash the code for security
    const codeHash = await bcrypt.hash(generatedCode, 10);
    
    const iotCode = await IoTConnectionCode.create({
      code: generatedCode,
      codeHash: codeHash, // Required hash
      deviceId: 'ANY', // Allow any device to use this code
      fieldId: field._id, // Link to this field
      isUsed: false,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    });
    
    logger.info(`✅ Field created: ${field.name} by user ${userId} with code: ${generatedCode}`);
    
    // Return field object with IoT code
    return successResponse(
      res,
      {
        _id: field._id,
        name: field.name,
        gpsCenter: field.gpsCenter,
        radius: field.radius,
        metadata: field.metadata,
        isActive: field.isActive,
        createdAt: field.createdAt,
        updatedAt: field.updatedAt,
        iotConnectionCode: generatedCode, // Include generated code
      },
      201
    );
  } catch (error: any) {
    logger.error('❌ Create field error:', error);
    return errorResponse(res, 'SERVER_ERROR', error.message, 500);
  }
};

/**
 * Get list of user's fields
 * GET /api/fields/list
 */
export const listFields = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { includeInactive } = req.query;
    
    const query: any = { userId };
    if (!includeInactive) {
      query.isActive = true;
    }
    
    const fields = await Field.find(query).sort({ createdAt: -1 });
    
    // Check IoT connections
    const fieldsWithIoT = await Promise.all(
      fields.map(async (field) => {
        const iotConnection = await IoTConnection.findOne({
          fieldId: field._id,
          status: 'active',
        }).select('deviceId connectedAt lastSyncAt');
        
        return {
          _id: field._id,
          name: field.name,
          gpsCenter: field.gpsCenter,
          radius: field.radius,
          metadata: field.metadata,
          isActive: field.isActive,
          hasIoTConnection: !!iotConnection,
          iotConnection: iotConnection
            ? {
                deviceId: iotConnection.deviceId,
                connectedAt: iotConnection.connectedAt,
                lastSyncAt: iotConnection.lastSyncAt,
              }
            : null,
          createdAt: field.createdAt,
          updatedAt: field.updatedAt,
        };
      })
    );
    
    // Return fields array directly (frontend expects Field[])
    return successResponse(res, fieldsWithIoT);
  } catch (error: any) {
    logger.error('❌ List fields error:', error);
    return errorResponse(res, 'SERVER_ERROR', error.message, 500);
  }
};

/**
 * Get field details
 * GET /api/fields/:id
 */
export const getField = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    
    const field = await Field.findOne({ _id: id, userId });
    
    if (!field) {
      return errorResponse(res, 'NOT_FOUND', 'Field not found', 404);
    }
    
    // Get IoT connection if exists
    const iotConnection = await IoTConnection.findOne({
      fieldId: field._id,
      status: 'active',
    });
    
    // Return field directly (not wrapped in "field" property)
    return successResponse(res, {
      _id: field._id,
      name: field.name,
      gpsCenter: field.gpsCenter,
      radius: field.radius,
      metadata: field.metadata,
      isActive: field.isActive,
      hasIoTConnection: !!iotConnection,
      iotConnection: iotConnection
        ? {
            deviceId: iotConnection.deviceId,
            connectedAt: iotConnection.connectedAt,
            lastSyncAt: iotConnection.lastSyncAt,
          }
        : null,
      createdAt: field.createdAt,
      updatedAt: field.updatedAt,
    });
  } catch (error: any) {
    logger.error('❌ Get field error:', error);
    return errorResponse(res, 'SERVER_ERROR', error.message, 500);
  }
};

/**
 * Update field
 * PUT /api/fields/:id
 */
export const updateField = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { name, gpsCenter, radius, metadata } = req.body;
    
    const field = await Field.findOne({ _id: id, userId });
    
    if (!field) {
      return errorResponse(res, 'NOT_FOUND', 'Field not found', 404);
    }
    
    // Update name
    if (name) {
      field.name = name.trim();
    }
    
    // Update GPS center
    if (gpsCenter) {
      if (!isValidGPS(gpsCenter.lat, gpsCenter.lng)) {
        return errorResponse(res, 'VALIDATION_ERROR', 'Invalid GPS coordinates', 400);
      }
      field.gpsCenter = gpsCenter;
    }
    
    // Update radius
    if (radius !== undefined) {
      if (radius < 100 || radius > 5000) {
        return errorResponse(res, 'VALIDATION_ERROR', 'Radius must be between 100 and 5000 meters', 400);
      }
      field.radius = radius;
    }
    
    // Update metadata
    if (metadata) {
      field.metadata = { ...field.metadata, ...metadata };
    }
    
    await field.save();
    
    logger.info(`✅ Field updated: ${field.name}`);
    
    // Return field directly (not wrapped in "field" property)
    return successResponse(res, {
      _id: field._id,
      name: field.name,
      gpsCenter: field.gpsCenter,
      radius: field.radius,
      metadata: field.metadata,
      isActive: field.isActive,
      createdAt: field.createdAt,
      updatedAt: field.updatedAt,
    });
  } catch (error: any) {
    logger.error('❌ Update field error:', error);
    return errorResponse(res, 'SERVER_ERROR', error.message, 500);
  }
};

/**
 * Delete field (soft delete)
 * DELETE /api/fields/:id
 */
export const deleteField = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    
    const field = await Field.findOne({ _id: id, userId });
    
    if (!field) {
      return errorResponse(res, 'NOT_FOUND', 'Field not found', 404);
    }
    
    // Check if field has active IoT connection
    const hasIoT = await IoTConnection.findOne({
      fieldId: field._id,
      status: 'active',
    });
    
    if (hasIoT) {
      return errorResponse(res, 'CONFLICT', 'Cannot delete field with active IoT connection. Please disconnect first.', 409);
    }
    
    // Soft delete
    field.isActive = false;
    await field.save();
    
    logger.info(`✅ Field deleted: ${field.name}`);
    
    return successResponse(res, { message: 'Field deleted successfully' });
  } catch (error: any) {
    logger.error('❌ Delete field error:', error);
    return errorResponse(res, 'SERVER_ERROR', error.message, 500);
  }
};

/**
 * Get IoT connection code for a field
 * GET /api/fields/:id/iot-code
 */
export const getFieldIoTCode = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    
    // Verify field belongs to user
    const field = await Field.findOne({ _id: id, userId });
    
    if (!field) {
      return errorResponse(res, 'NOT_FOUND', 'Field not found', 404);
    }
    
    // Get the IoT connection code for this field (not used yet)
    // Note: code field has select:false in schema, need to explicitly select it
    logger.info(`🔍 Searching for IoT code:`, {
      fieldId: field._id,
      fieldName: field.name,
      userId,
    });
    
    const iotCode = await IoTConnectionCode.findOne({
      fieldId: field._id,
      isUsed: false,
    })
      .select('+code') // Override select:false to get plain code
      .sort({ createdAt: -1 }); // Get latest unused code
    
    if (!iotCode) {
      // Debug: check if any codes exist for this field (regardless of isUsed)
      const anyCode = await IoTConnectionCode.findOne({ fieldId: field._id });
      logger.warn(`⚠️ No unused IoT code found for field ${field.name}`, {
        fieldId: field._id,
        hasAnyCode: !!anyCode,
        anyCodeDetails: anyCode ? {
          isUsed: anyCode.isUsed,
          deviceId: anyCode.deviceId,
          createdAt: anyCode.createdAt,
        } : null,
      });
      return errorResponse(res, 'NOT_FOUND', 'No IoT code found for this field', 404);
    }
    
    logger.info(`✅ Found IoT code for field ${field.name}:`, {
      codeId: iotCode._id,
      deviceId: iotCode.deviceId,
      isUsed: iotCode.isUsed,
      createdAt: iotCode.createdAt,
    });
    
    return successResponse(res, {
      code: iotCode.code,
      createdAt: iotCode.createdAt,
      expiresAt: iotCode.expiresAt,
    });
  } catch (error: any) {
    logger.error('❌ Get field IoT code error:', error);
    return errorResponse(res, 'SERVER_ERROR', error.message, 500);
  }
};

