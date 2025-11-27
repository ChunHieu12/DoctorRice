/**
 * Admin IoT Controller
 * Manage IoT connection codes (admin only)
 */
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { IoTConnectionCode } from '../models/IoTConnectionCode';
import { generateCode } from '../scripts/generateIoTCodes';
import { logger } from '../utils/logger';
import { errorResponse, successResponse } from '../utils/responses';

/**
 * Generate new IoT connection codes
 * POST /api/admin/iot-codes/generate
 */
export const generateCodes = async (req: Request, res: Response) => {
  try {
    const { deviceId, quantity } = req.body;
    
    // Validate
    if (!deviceId || !quantity) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Device ID and quantity are required', 400);
    }
    
    if (quantity < 1 || quantity > 500) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Quantity must be between 1 and 500', 400);
    }
    
    logger.info(`📋 Admin generating ${quantity} codes for ${deviceId}`);
    
    const codes: string[] = [];
    
    for (let i = 0; i < quantity; i++) {
      try {
        let code = generateCode(deviceId.toUpperCase());
        
        // Ensure uniqueness
        let attempts = 0;
        while (await IoTConnectionCode.findOne({ code }) && attempts < 10) {
          code = generateCode(deviceId.toUpperCase());
          attempts++;
        }
        
        const codeHash = await bcrypt.hash(code, 10);
        
        await IoTConnectionCode.create({
          deviceId: deviceId.toUpperCase(),
          code,
          codeHash,
          isUsed: false,
        });
        
        codes.push(code);
      } catch (error: any) {
        logger.error(`Error generating code ${i + 1}:`, error.message);
      }
    }
    
    logger.info(`✅ Generated ${codes.length} codes for ${deviceId}`);
    
    return successResponse(res, {
      codes,
      count: codes.length,
      deviceId: deviceId.toUpperCase(),
      message: 'Codes generated successfully',
    }, 201);
    
  } catch (error: any) {
    logger.error('❌ Generate codes error:', error);
    return errorResponse(res, 'SERVER_ERROR', error.message, 500);
  }
};

/**
 * List IoT connection codes
 * GET /api/admin/iot-codes/list
 */
export const listCodes = async (req: Request, res: Response) => {
  try {
    const { deviceId, isUsed, limit = 50, page = 1 } = req.query;
    
    const query: any = {};
    
    if (deviceId) {
      query.deviceId = (deviceId as string).toUpperCase();
    }
    
    if (isUsed !== undefined) {
      query.isUsed = isUsed === 'true';
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [codes, total] = await Promise.all([
      IoTConnectionCode.find(query)
        .select('+code') // Include code field
        .populate('usedBy', 'displayName phone')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(skip),
      IoTConnectionCode.countDocuments(query),
    ]);
    
    return successResponse(res, {
      codes: codes.map(c => ({
        _id: c._id,
        deviceId: c.deviceId,
        code: c.code,
        isUsed: c.isUsed,
        usedBy: c.usedBy,
        usedAt: c.usedAt,
        createdAt: c.createdAt,
      })),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
    
  } catch (error: any) {
    logger.error('❌ List codes error:', error);
    return errorResponse(res, 'SERVER_ERROR', error.message, 500);
  }
};

/**
 * Export IoT connection codes as CSV
 * GET /api/admin/iot-codes/export
 */
export const exportCodes = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.query;
    
    const query: any = {};
    if (deviceId) {
      query.deviceId = (deviceId as string).toUpperCase();
    }
    
    const codes = await IoTConnectionCode.find(query)
      .select('+code')
      .populate('usedBy', 'displayName phone')
      .sort({ createdAt: -1 });
    
    // Build CSV
    const csvHeaders = [
      'Device ID',
      'Connection Code',
      'Status',
      'Created Date',
      'Used By',
      'Used Date',
    ];
    
    const csvRows = codes.map(code => {
      const status = code.isUsed ? 'Used' : 'Available';
      const createdDate = new Date(code.createdAt).toLocaleString('vi-VN');
      const usedBy = code.isUsed && code.usedBy ? 
        `${(code.usedBy as any).displayName} (${(code.usedBy as any).phone})` : 
        'NULL';
      const usedDate = code.usedAt ? new Date(code.usedAt).toLocaleString('vi-VN') : 'NULL';
      
      return [
        code.deviceId,
        code.code,
        status,
        createdDate,
        usedBy,
        usedDate,
      ];
    });
    
    const csv = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(',')),
    ].join('\n');
    
    // Send as downloadable file
    const filename = `iot-codes-${deviceId || 'all'}-${Date.now()}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    logger.info(`📥 Exported ${codes.length} codes to CSV`);
    
    return res.send(csv);
    
  } catch (error: any) {
    logger.error('❌ Export codes error:', error);
    return errorResponse(res, 'SERVER_ERROR', error.message, 500);
  }
};

/**
 * Get code statistics
 * GET /api/admin/iot-codes/stats
 */
export const getCodeStats = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.query;
    
    const query: any = {};
    if (deviceId) {
      query.deviceId = (deviceId as string).toUpperCase();
    }
    
    const [total, used, available] = await Promise.all([
      IoTConnectionCode.countDocuments(query),
      IoTConnectionCode.countDocuments({ ...query, isUsed: true }),
      IoTConnectionCode.countDocuments({ ...query, isUsed: false }),
    ]);
    
    // Get device breakdown
    const deviceBreakdown = await IoTConnectionCode.aggregate([
      { $group: {
        _id: '$deviceId',
        total: { $sum: 1 },
        used: { $sum: { $cond: ['$isUsed', 1, 0] } },
      }},
      { $sort: { _id: 1 } },
    ]);
    
    return successResponse(res, {
      total,
      used,
      available,
      usageRate: total > 0 ? ((used / total) * 100).toFixed(2) + '%' : '0%',
      devices: deviceBreakdown.map(d => ({
        deviceId: d._id,
        total: d.total,
        used: d.used,
        available: d.total - d.used,
      })),
    });
    
  } catch (error: any) {
    logger.error('❌ Get stats error:', error);
    return errorResponse(res, 'SERVER_ERROR', error.message, 500);
  }
};

