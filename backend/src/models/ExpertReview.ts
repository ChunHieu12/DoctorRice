import mongoose, { Document, Schema } from 'mongoose';

export interface IExpertReview extends Document {
  conversationId: mongoose.Types.ObjectId;
  expertId: mongoose.Types.ObjectId;
  farmerId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExpertReviewSchema = new Schema<IExpertReview>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      unique: true,
      index: true,
    },
    expertId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      maxlength: 500,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

ExpertReviewSchema.index({ expertId: 1, completedAt: -1 });

export const ExpertReview = mongoose.model<IExpertReview>('ExpertReview', ExpertReviewSchema);


