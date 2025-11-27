import mongoose, { Document, Schema } from 'mongoose';

/**
 * Conversation model for user-expert chats
 */
export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId; // Farmer/User (Nhà nông)
  expertId: mongoose.Types.ObjectId; // Expert (Chuyên gia)
  status: 'pending' | 'answered' | 'completed' | 'reopen_requested' | 'expired';
  lastMessageAt: Date;
  unreadCountFarmer: number; // Unread count for farmer
  unreadCountExpert: number; // Unread count for expert
  rating?: number; // Rating from farmer (1-5) after completion
  ratingComment?: string; // Optional comment with the rating
  completedAt?: Date; // When conversation was marked as completed
  expiresAt: Date; // Auto-expire after 48 hours of inactivity
  reopenRequestedAt?: Date; // When reopen was requested
  reopenRequestedBy?: mongoose.Types.ObjectId; // Who requested reopen (usually farmer)
  deletedByFarmer: boolean; // Soft delete flag for farmer
  deletedByExpert: boolean; // Soft delete flag for expert
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expertId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'answered', 'completed', 'reopen_requested', 'expired'],
      default: 'pending',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unreadCountFarmer: {
      type: Number,
      default: 0,
    },
    unreadCountExpert: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    ratingComment: {
      type: String,
      maxlength: 500, // Limit comment length
    },
    completedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
    },
    reopenRequestedAt: {
      type: Date,
    },
    reopenRequestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedByFarmer: {
      type: Boolean,
      default: false,
    },
    deletedByExpert: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for finding conversations between user and expert
ConversationSchema.index({ userId: 1, expertId: 1 });
ConversationSchema.index({ status: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);

