/**
 * IoTConnectionCode Model
 * Stores generated connection codes for IoT devices
 */
import mongoose, { Document, Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     IoTConnectionCode:
 *       type: object
 *       required:
 *         - deviceId
 *         - code
 *         - codeHash
 *       properties:
 *         _id:
 *           type: string
 *         deviceId:
 *           type: string
 *           description: IoT device ID
 *           example: "JETSON001"
 *         code:
 *           type: string
 *           description: Plain connection code (for admin export only)
 *           example: "JETSON001-X8K9M2"
 *         codeHash:
 *           type: string
 *           description: Bcrypt hash of the code
 *         isUsed:
 *           type: boolean
 *           default: false
 *         usedBy:
 *           type: string
 *           description: User ID who used this code
 *         usedAt:
 *           type: string
 *           format: date-time
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Optional expiration date
 */

export interface IIoTConnectionCode extends Document {
  deviceId: string;
  code: string; // Plain text (for export)
  codeHash: string; // Bcrypt hash (for verification)
  fieldId?: mongoose.Types.ObjectId; // Optional: link to specific field
  isUsed: boolean;
  usedBy?: mongoose.Types.ObjectId;
  usedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IoTConnectionCodeSchema = new Schema<IIoTConnectionCode>(
  {
    deviceId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      select: false, // Don't include by default (security)
    },
    codeHash: {
      type: String,
      required: true,
      select: false, // Don't include by default
    },
    fieldId: {
      type: Schema.Types.ObjectId,
      ref: 'Field',
      index: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    usedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    usedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
IoTConnectionCodeSchema.index({ deviceId: 1, isUsed: 1 });
IoTConnectionCodeSchema.index({ code: 1 }, { unique: true });
IoTConnectionCodeSchema.index({ expiresAt: 1 }, { sparse: true });

// Virtual: Check if expired
IoTConnectionCodeSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Method: Mark as used
IoTConnectionCodeSchema.methods.markAsUsed = function (userId: mongoose.Types.ObjectId) {
  this.isUsed = true;
  this.usedBy = userId;
  this.usedAt = new Date();
  return this.save();
};

export const IoTConnectionCode = mongoose.model<IIoTConnectionCode>(
  'IoTConnectionCode',
  IoTConnectionCodeSchema
);

