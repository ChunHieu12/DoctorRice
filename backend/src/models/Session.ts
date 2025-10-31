import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  refreshToken: string;
  deviceInfo?: string;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
    deviceInfo: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for auto-cleanup of expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model<ISession>('Session', SessionSchema);

