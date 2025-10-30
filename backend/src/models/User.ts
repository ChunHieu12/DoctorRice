import mongoose, { Document, Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         displayName:
 *           type: string
 *         avatar:
 *           type: string
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *         isEmailVerified:
 *           type: boolean
 *         isPhoneVerified:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 */

export interface IUser extends Document {
  email?: string;
  phone?: string;
  passwordHash?: string;
  displayName: string;
  avatar?: string;
  socialIds?: {
    google?: string;
    facebook?: string;
  };
  roles: ('user' | 'admin')[];
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      select: false, // Don't include by default in queries
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
    },
    socialIds: {
      google: String,
      facebook: String,
    },
    roles: {
      type: [String],
      enum: ['user', 'admin'],
      default: ['user'],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ email: 1 }, { sparse: true });
UserSchema.index({ phone: 1 }, { sparse: true });
UserSchema.index({ 'socialIds.google': 1 }, { sparse: true });
UserSchema.index({ 'socialIds.facebook': 1 }, { sparse: true });

export const User = mongoose.model<IUser>('User', UserSchema);

