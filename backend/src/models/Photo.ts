import mongoose, { Document, Schema } from 'mongoose';

export interface IPhoto extends Document {
  userId: mongoose.Types.ObjectId;
  originalUrl: string;
  watermarkedUrl: string;
  thumbnailUrl?: string;
  metadata: {
    lat: number;
    lng: number;
    timestamp: number;
    device: string;
    orientation: 'portrait' | 'landscape';
  };
  status: 'processing' | 'completed' | 'failed';
  fileSize: number;
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
  },
  {
    timestamps: true,
  }
);

// Indexes
PhotoSchema.index({ userId: 1, createdAt: -1 });
PhotoSchema.index({ status: 1 });

export const Photo = mongoose.model<IPhoto>('Photo', PhotoSchema);

