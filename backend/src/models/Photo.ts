import mongoose, { Document, Schema } from 'mongoose';

export interface IPhoto extends Document {
  userId: mongoose.Types.ObjectId;
  originalUrl: string;
  watermarkedUrl: string;
  thumbnailUrl?: string;
  cloudinaryPublicId?: string;
  
  // ⭐ NEW: Source type
  source: 'upload' | 'iot';
  
  metadata: {
    lat?: number; // ✅ Optional for chat images
    lng?: number; // ✅ Optional for chat images
    timestamp: number;
    device: string;
    orientation: 'portrait' | 'landscape';
    address?: string;
  };
  
  prediction?: {
    class: string; // 'bacterial_leaf_blight' | 'blast' | 'brown_spot' | 'healthy'
    classVi: string; // Vietnamese label
    confidence: number; // 0-100
    allPredictions?: Record<string, number>;
  };
  
  // ⭐ NEW: IoT metadata
  iotMetadata?: {
    deviceId: string;
    fieldId: mongoose.Types.ObjectId;
    captureId: string;
    firebaseUrl: string;
    sensors: {
      temp: number;
      humidity: number;
      ph: number;
      soil: number;
      lux: number;
      wind: number;
    };
    sensorTimestamp: string;
  };
  
  // ⭐ NEW: Weather context
  weatherContext?: {
    current: {
      temp: number;
      humidity: number;
      description: string;
    };
    forecast: Array<{
      date: string;
      temp: number;
      humidity: number;
      rain: number;
      description: string;
    }>;
  };
  
  // ⭐ NEW: AI analysis
  aiAnalysis?: {
    shouldShowSendButton: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    alerts: string[];
  };
  
  // ⭐ NEW: Treatment data (structured for IoT)
  treatmentData?: {
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
    pesticides: Array<{
      name: string;
      activeIngredient: string;
      dosage: string;
      mixing: string;
      timing: string;
      frequency: string;
      notes: string;
    }>;
    fertilizers: Array<{
      name: string;
      type: string;
      dosage: string;
      mixing: string;
      timing: string;
      reason: string;
    }>;
    wateringSchedule: Array<{
      date: string;
      time: string;
      action: string;
      targetLevel: string;
      duration: string;
      reason: string;
    }>;
    schedule: Array<{
      date: string;
      time: string;
      task: string;
      details: string;
    }>;
  };
  
  status: 'processing' | 'completed' | 'failed';
  fileSize: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PhotoSchema = new Schema<IPhoto>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalUrl: {
      type: String,
      required: false, // Will be set after Cloudinary upload
      default: '',
    },
    watermarkedUrl: {
      type: String,
      required: false, // Will be set after Cloudinary upload
      default: '',
    },
    thumbnailUrl: {
      type: String,
    },
    cloudinaryPublicId: {
      type: String,
    },
    source: {
      type: String,
      enum: ['upload', 'iot'],
      default: 'upload',
      index: true,
    },
    metadata: {
      lat: {
        type: Number,
        required: false, // ✅ Optional for chat images
      },
      lng: {
        type: Number,
        required: false, // ✅ Optional for chat images
      },
      timestamp: {
        type: Number,
        required: true,
      },
      device: {
        type: String,
        required: true,
      },
      orientation: {
        type: String,
        enum: ['portrait', 'landscape'],
        default: 'portrait',
      },
      address: {
        type: String,
      },
    },
    prediction: {
      class: {
        type: String,
        enum: ['bacterial_leaf_blight', 'blast', 'brown_spot', 'healthy'],
      },
      classVi: {
        type: String,
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100,
      },
      allPredictions: {
        type: Map,
        of: Number,
      },
    },
    iotMetadata: {
      deviceId: String,
      fieldId: {
        type: Schema.Types.ObjectId,
        ref: 'Field',
      },
      captureId: String,
      firebaseUrl: String,
      sensors: {
        temp: Number,
        humidity: Number,
        ph: Number,
        soil: Number,
        lux: Number,
        wind: Number,
      },
      sensorTimestamp: String,
    },
    weatherContext: {
      current: {
        temp: Number,
        humidity: Number,
        description: String,
      },
      forecast: [
        {
          date: String,
          temp: Number,
          humidity: Number,
          rain: Number,
          description: String,
        },
      ],
    },
    aiAnalysis: {
      shouldShowSendButton: Boolean,
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
      },
      alerts: [String],
    },
    treatmentData: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
    },
    fileSize: {
      type: Number,
      required: true,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PhotoSchema.index({ userId: 1, createdAt: -1 });
PhotoSchema.index({ status: 1 });
PhotoSchema.index({ source: 1 });
PhotoSchema.index({ 'iotMetadata.fieldId': 1 });

export const Photo = mongoose.model<IPhoto>('Photo', PhotoSchema);

