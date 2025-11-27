/**
 * Field Model
 * Represents a rice field with GPS location and metadata
 */
import mongoose, { Document, Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Field:
 *       type: object
 *       required:
 *         - userId
 *         - name
 *         - gpsCenter
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *           description: Owner user ID
 *         name:
 *           type: string
 *           description: Field name
 *           example: "Ruộng Tân Định"
 *         gpsCenter:
 *           type: object
 *           properties:
 *             lat:
 *               type: number
 *               example: 10.8525093
 *             lng:
 *               type: number
 *               example: 106.6664848
 *         radius:
 *           type: number
 *           description: Monitoring radius in meters
 *           default: 500
 *         metadata:
 *           type: object
 *           properties:
 *             area:
 *               type: number
 *               description: Area in m²
 *             cropType:
 *               type: string
 *               description: Type of rice
 *               example: "IR50404"
 *             plantedDate:
 *               type: string
 *               format: date
 *         isActive:
 *           type: boolean
 *           default: true
 */

export interface IField extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  gpsCenter: {
    lat: number;
    lng: number;
  };
  radius: number; // meters
  metadata?: {
    area?: number; // m²
    cropType?: string;
    plantedDate?: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FieldSchema = new Schema<IField>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    gpsCenter: {
      lat: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      lng: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
    },
    radius: {
      type: Number,
      required: true,
      default: 500,
      min: 100,
      max: 5000,
    },
    metadata: {
      area: {
        type: Number,
        min: 0,
      },
      cropType: {
        type: String,
        trim: true,
        maxlength: 50,
      },
      plantedDate: {
        type: Date,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
FieldSchema.index({ userId: 1, isActive: 1 });
FieldSchema.index({ 'gpsCenter.lat': 1, 'gpsCenter.lng': 1 });

// Virtual: Check if field has IoT connection
FieldSchema.virtual('hasIoTConnection', {
  ref: 'IoTConnection',
  localField: '_id',
  foreignField: 'fieldId',
  justOne: true,
});

export const Field = mongoose.model<IField>('Field', FieldSchema);

