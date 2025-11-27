import { Types } from 'mongoose';
import { Conversation, IConversation } from '../models/Conversation';
import { ExpertReview } from '../models/ExpertReview';

const backfilledExperts = new Set<string>();

const normalizeReviewPayload = (conversation: IConversation) => ({
  conversationId: conversation._id,
  expertId: conversation.expertId,
  farmerId: conversation.userId,
  rating: conversation.rating!,
  comment: conversation.ratingComment,
  completedAt: conversation.completedAt || conversation.updatedAt || new Date(),
});

export const upsertExpertReviewFromConversation = async (conversation: IConversation) => {
  if (!conversation.rating) {
    return;
  }

  try {
    await ExpertReview.findOneAndUpdate(
      { conversationId: conversation._id },
      normalizeReviewPayload(conversation),
      {
        upsert: true,
        setDefaultsOnInsert: true,
        new: true,
      }
    );
  } catch (error) {
    console.error('Failed to upsert expert review from conversation', {
      conversationId: conversation._id,
      error,
    });
  }
};

export const ensureExpertReviewSnapshots = async (expertIds: Types.ObjectId[]) => {
  const idsToProcess = expertIds
    .map((id) => id.toString())
    .filter((id) => !backfilledExperts.has(id));

  if (!idsToProcess.length) {
    return;
  }

  try {
    const conversations = await Conversation.find({
      expertId: { $in: idsToProcess.map((id) => new Types.ObjectId(id)) },
      status: 'completed',
      rating: { $exists: true },
    })
      .select('_id expertId userId rating ratingComment completedAt updatedAt');

    if (conversations.length === 0) {
      idsToProcess.forEach((id) => backfilledExperts.add(id));
      return;
    }

    for (const conv of conversations) {
      await upsertExpertReviewFromConversation(conv as unknown as IConversation);
    }

    idsToProcess.forEach((id) => backfilledExperts.add(id));
  } catch (error) {
    console.error('Failed to backfill expert reviews', { expertIds: idsToProcess, error });
  }
};


