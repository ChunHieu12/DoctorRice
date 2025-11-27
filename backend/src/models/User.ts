import mongoose, { Document, Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - phone
 *         - displayName
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *         phone:
 *           type: string
 *           description: Phone number (primary identifier, required)
 *           example: "+84123456789"
 *         displayName:
 *           type: string
 *           description: User full name
 *           example: "Nguyen Van A"
 *         email:
 *           type: string
 *           description: Email address (optional, for future use)
 *         avatar:
 *           type: string
 *           description: Avatar URL
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *             enum: [user, admin]
 *           description: User roles
 *         isPhoneVerified:
 *           type: boolean
 *           description: Phone verification status
 *         isEmailVerified:
 *           type: boolean
 *           description: Email verification status (not used currently)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export interface IUser extends Document {
  email?: string; // Optional - for future use
  phone?: string; // Required in practice (unique identifier) - Format: 0xxxxxxxxx
  username?: string; // Username for display
  passwordHash?: string;
  displayName: string;
  avatar?: string;
  expertise?: string; // For expert users: their area of expertise
  experience?: string; // Kinh nghiệm nghề nghiệp (tổng quan)
  education?: string; // Học vấn (VD: "Tiến sĩ Nông nghiệp - Đại học Nông lâm TP.HCM")
  workHistory?: string; // Quá trình công tác (tổng quan)
  detailedWorkHistory?: Array<{
    position: string; // Chức vụ
    organization: string; // Tổ chức
    period: string; // Thời gian (VD: "2015-2020")
    description?: string; // Mô tả công việc
  }>; // Chi tiết quá trình công tác
  rating: number; // Average rating (0-5)
  totalRatings: number; // Total number of ratings received
  isOnline: boolean; // Socket.io presence status
  lastActiveAt: Date; // Last activity timestamp
  socialIds?: {
    google?: string;
    facebook?: string;
  };
  roles: ('user' | 'admin' | 'expert')[];
  isEmailVerified: boolean; // Not used currently
  isPhoneVerified: boolean; // Set to true after OTP verification
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
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
    expertise: {
      type: String,
    },
    experience: {
      type: String,
    },
    education: {
      type: String,
    },
    workHistory: {
      type: String,
    },
    detailedWorkHistory: [
      {
        position: { type: String, required: true },
        organization: { type: String, required: true },
        period: { type: String, required: true },
        description: { type: String },
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    socialIds: {
      google: String,
      facebook: String,
    },
    roles: {
      type: [String],
      enum: ['user', 'admin', 'expert'],
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
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
UserSchema.index({ 'socialIds.google': 1 }, { sparse: true });
UserSchema.index({ 'socialIds.facebook': 1 }, { sparse: true });

export const User = mongoose.model<IUser>('User', UserSchema);

