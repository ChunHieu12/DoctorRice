/**
 * IoTConnection Model
 * Represents connection between a field and IoT device
 */
import mongoose, { Document, Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     IoTConnection:
 *       type: object
 *       required:
 *         - userId
 *         - fieldId
 *         - deviceId
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *           description: Owner user ID
 *         fieldId:
 *           type: string
 *           description: Connected field ID
 *         deviceId:
 *           type: string
 *           description: IoT device ID
 *           example: "JETSON001"
 *         connectionCode:
 *           type: string
 *           description: Hashed connection code
 *         firebaseDbUrl:
 *           type: string
 *           description: Firebase Realtime Database URL
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           default: active
 *         connectedAt:
 *           type: string
 *           format: date-time
 *         lastSyncAt:
 *           type: string
 *           format: date-time
 */

export interface IIoTConnection extends Document {
  userId: mongoose.Types.ObjectId;
  fieldId: mongoose.Types.ObjectId;
  deviceId: string;
  connectionCode: string; // hashed
  firebaseDbUrl: string;
  status: 'active' | 'inactive';
  connectedAt: Date;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IoTConnectionSchema = new Schema<IIoTConnection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fieldId: {
      type: Schema.Types.ObjectId,
      ref: 'Field',
      required: true,
      index: true,
      unique: true, // One field can only have one IoT connection
    },
    deviceId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    connectionCode: {
      type: String,
      required: true,
      select: false, // Don't include by default
    },
    firebaseDbUrl: {
      type: String,
      required: true,
      default: 'https://rice-813b5-default-rtdb.firebaseio.com',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    connectedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastSyncAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
IoTConnectionSchema.index({ userId: 1, status: 1 });
IoTConnectionSchema.index({ deviceId: 1, status: 1 });
IoTConnectionSchema.index({ fieldId: 1 }, { unique: true });

// Method: Update last sync time
IoTConnectionSchema.methods.updateLastSync = function () {
  this.lastSyncAt = new Date();
  return this.save();
};

export const IoTConnection = mongoose.model<IIoTConnection>('IoTConnection', IoTConnectionSchema);

