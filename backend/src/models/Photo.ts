import mongoose, { Document, Schema } from 'mongoose';

export interface IPhoto extends Document {
  userId: mongoose.Types.ObjectId;
  originalUrl: string;
  watermarkedUrl: string;
  thumbnailUrl?: string;
  cloudinaryPublicId?: string;
  metadata: {
    lat: number;
    lng: number;
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
      required: true,
    },
    watermarkedUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },
    cloudinaryPublicId: {
      type: String,
    },
    metadata: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
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

export const Photo = mongoose.model<IPhoto>('Photo', PhotoSchema);

