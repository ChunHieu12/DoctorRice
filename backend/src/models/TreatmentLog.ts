/**
 * TreatmentLog Model
 * Logs treatment information sent to IoT devices
 */
import mongoose, { Document, Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     TreatmentLog:
 *       type: object
 *       required:
 *         - userId
 *         - fieldId
 *         - photoId
 *         - deviceId
 *         - treatmentData
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         fieldId:
 *           type: string
 *         photoId:
 *           type: string
 *         deviceId:
 *           type: string
 *         treatmentData:
 *           type: object
 *           description: Structured treatment data
 *         firebasePath:
 *           type: string
 *           example: "/treatments/JETSON001/20251107T140000"
 *         status:
 *           type: string
 *           enum: [sent, acknowledged, failed]
 */

interface IPesticide {
  name: string;
  activeIngredient: string;
  dosage: string;
  mixing: string;
  timing: string;
  frequency: string;
  notes: string;
}

interface IFertilizer {
  name: string;
  type: string;
  dosage: string;
  mixing: string;
  timing: string;
  reason: string;
}

interface IWateringScheduleItem {
  date: string;
  time: string;
  action: string;
  targetLevel: string;
  duration: string;
  reason: string;
}

interface IScheduleItem {
  date: string;
  time: string;
  task: string;
  details: string;
}

interface ITreatmentData {
  disease: {
    name: string;
    nameEn: string;
    confidence: number;
    severity: string;
  };
  currentConditions: {
    temp: number;
    humidity: number;
    ph: number;
    soil: number;
    riskLevel: string;
  };
  pesticides: IPesticide[];
  fertilizers: IFertilizer[];
  wateringSchedule: IWateringScheduleItem[];
  schedule: IScheduleItem[];
}

export interface ITreatmentLog extends Document {
  userId: mongoose.Types.ObjectId;
  fieldId: mongoose.Types.ObjectId;
  photoId: mongoose.Types.ObjectId;
  deviceId: string;
  treatmentData: ITreatmentData;
  firebasePath: string;
  status: 'sent' | 'acknowledged' | 'failed';
  sentAt: Date;
  acknowledgedAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TreatmentLogSchema = new Schema<ITreatmentLog>(
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
    },
    photoId: {
      type: Schema.Types.ObjectId,
      ref: 'Photo',
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    treatmentData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    firebasePath: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['sent', 'acknowledged', 'failed'],
      default: 'sent',
      index: true,
    },
    sentAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    acknowledgedAt: {
      type: Date,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TreatmentLogSchema.index({ userId: 1, createdAt: -1 });
TreatmentLogSchema.index({ fieldId: 1, createdAt: -1 });
TreatmentLogSchema.index({ deviceId: 1, status: 1 });

export const TreatmentLog = mongoose.model<ITreatmentLog>('TreatmentLog', TreatmentLogSchema);

