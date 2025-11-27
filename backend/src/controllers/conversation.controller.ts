import { Request, Response } from 'express';
import { Conversation, IConversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { errorResponse, successResponse } from '../utils/responses';
import { upsertExpertReviewFromConversation } from '../services/expertReview.service';

/**
 * Get user conversations (with experts or farmers)
 */
export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { status } = req.query;

    if (!userId) {
      return errorResponse(res, 'AUTH_001', 'Unauthorized', 401);
    }

    // Get user to check role
    const user = await User.findById(userId);
    const isExpert = user?.roles.includes('expert');

    // Build query based on role with soft delete filter
    const query: any = isExpert 
      ? { expertId: userId, deletedByExpert: false } 
      : { userId, deletedByFarmer: false };
    
    const statusFilter = typeof status === 'string' ? status : undefined;
    if (statusFilter && ['completed', 'reopen_requested', 'expired'].includes(statusFilter)) {
      query.status = statusFilter;
    }

    // Find conversations and populate other user info
    const populateField = isExpert ? 'userId' : 'expertId';
    const conversations = await Conversation.find(query)
      .populate(populateField, 'displayName avatar expertise phone')
      .sort({ lastMessageAt: -1 });

    // Get last message and unread count for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findOne({ conversationId: conv._id })
          .sort({ createdAt: -1 })
          .limit(1);

        const unreadCount = isExpert ? conv.unreadCountExpert : conv.unreadCountFarmer;

        return {
          id: conv._id,
          [isExpert ? 'farmer' : 'expert']: (conv as any)[populateField],
          status: conv.status,
          unreadCount,
          rating: conv.rating,
          ratingComment: conv.ratingComment, // Include rating comment for expert to see
          completedAt: conv.completedAt,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            images: lastMessage.images,
            createdAt: lastMessage.createdAt,
          } : null,
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt,
        };
      })
    );

    let filteredConversations = conversationsWithDetails;

    if (statusFilter === 'pending') {
      filteredConversations = conversationsWithDetails.filter(
        (conv) => conv.unreadCount > 0
      );
    } else if (statusFilter === 'answered') {
      filteredConversations = conversationsWithDetails.filter(
        (conv) => conv.unreadCount === 0 && conv.status !== 'completed' && conv.status !== 'expired'
      );
    }

    return successResponse(res, {
      conversations: filteredConversations,
      total: filteredConversations.length,
    });
  } catch (error: any) {
    return errorResponse(res, 'SERVER_001', error.message || 'Failed to get conversations', 500);
  }
};

/**
 * Get or create conversation with an expert
 */
export const getOrCreateConversation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { expertId } = req.body;

    if (!userId) {
      return errorResponse(res, 'AUTH_001', 'Unauthorized', 401);
    }

    if (!expertId) {
      return errorResponse(res, 'CONV_001', 'Expert ID is required', 400);
    }

    // Verify expert exists
    const expert = await User.findById(expertId);
    if (!expert || !expert.roles.includes('expert')) {
      return errorResponse(res, 'CONV_002', 'Expert not found', 404);
    }

    // Only consider active conversation statuses
    const activeStatuses: Array<'pending' | 'answered' | 'reopen_requested'> = [
      'pending',
      'answered',
      'reopen_requested',
    ];

    // Check if there is an active conversation (ignore completed/expired ones)
    let conversation = await Conversation.findOne({
      userId,
      expertId,
      status: { $in: activeStatuses },
    })
      .populate('expertId', 'displayName avatar expertise')
      .sort({ updatedAt: -1 });

    // Create new conversation if doesn't exist
    if (!conversation) {
      conversation = await Conversation.create({
        userId,
        expertId,
        status: 'pending',
        lastMessageAt: new Date(),
      });

      // Populate expert info
      conversation = await Conversation.findById(conversation._id)
        .populate('expertId', 'displayName avatar expertise') as any;
    }

    // Ensure conversation exists after creation/retrieval
    if (!conversation) {
      return errorResponse(res, 'CONV_003', 'Failed to create/retrieve conversation', 500);
    }

    return successResponse(res, {
      conversation: {
        id: conversation._id,
        userId: conversation.userId,
        expertId: expert._id, // Return expert ID for socket emit
        expert: conversation.expertId, // Keep for backward compatibility
        status: conversation.status,
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt,
      },
    });
  } catch (error: any) {
    return errorResponse(res, 'SERVER_001', error.message || 'Failed to get/create conversation', 500);
  }
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { conversationId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!userId) {
      return errorResponse(res, 'AUTH_001', 'Unauthorized', 401);
    }

    // Verify conversation belongs to user (either as farmer or expert)
    console.log(`🔍 Looking for conversation: ${conversationId} for user: ${userId}`);
    
    const conversation = await Conversation.findOne({
      _id: conversationId,
      $or: [
        { userId: userId },
        { expertId: userId }
      ],
    });

    if (!conversation) {
      console.error(`❌ Conversation not found: ${conversationId} for user: ${userId}`);
      
      // Additional debug: check if conversation exists at all
      const anyConv = await Conversation.findById(conversationId);
      if (anyConv) {
        console.error(`⚠️ Conversation exists but user unauthorized. Conv userId: ${anyConv.userId}, expertId: ${anyConv.expertId}`);
      } else {
        console.error(`⚠️ Conversation ${conversationId} does not exist in database`);
      }
      
      return errorResponse(res, 'CONV_003', 'Conversation not found or unauthorized', 404);
    }
    
    console.log(`✅ Conversation found: ${conversationId}`);

    // Get messages with pagination
    const messages = await Message.find({ conversationId })
      .populate('senderId', 'displayName avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({ conversationId });

    return successResponse(res, {
      messages: messages.reverse().map(msg => ({
        id: msg._id,
        content: msg.content,
        images: msg.images,
        sender: msg.senderId,
        isRead: msg.isRead,
        createdAt: msg.createdAt,
      })),
      conversation: {
        id: conversation._id,
        userId: conversation.userId,
        expertId: conversation.expertId,
        status: conversation.status,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return errorResponse(res, 'SERVER_001', error.message || 'Failed to get messages', 500);
  }
};

/**
 * Send a message in conversation
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { conversationId } = req.params;
    const { content = '', images = [] } = req.body;

    if (!userId) {
      return errorResponse(res, 'AUTH_001', 'Unauthorized', 401);
    }

    if (!content && (!images || images.length === 0)) {
      return errorResponse(res, 'CONV_004', 'Message content or images required', 400);
    }

    if (images && images.length > 5) {
      return errorResponse(res, 'CONV_006', 'Maximum 5 images allowed', 400);
    }

    // Verify conversation belongs to user or user is expert in conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      $or: [{ userId }, { expertId: userId }],
    });

    if (!conversation) {
      return errorResponse(res, 'CONV_003', 'Conversation not found', 404);
    }

    if (conversation.status === 'completed' || conversation.status === 'expired') {
      return errorResponse(
        res,
        'CONV_010',
        'Conversation has been completed. Please start a new chat session.',
        400
      );
    }

    // Determine receiver
    const isSenderFarmer = conversation.userId.toString() === userId;
    const receiverId = isSenderFarmer ? conversation.expertId : conversation.userId;

    // Create message
    const message = await Message.create({
      conversationId,
      senderId: userId,
      receiverId,
      content,
      images: images || [],
      isRead: false,
    });

    // Update conversation
    conversation.lastMessageAt = new Date();
    conversation.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // Reset expiry to 48h
    
    // Increment unread count for receiver & adjust status buckets
    if (isSenderFarmer) {
      conversation.unreadCountExpert += 1;

      if (conversation.status === 'answered') {
        conversation.status = 'pending';
      }

      if (conversation.deletedByExpert) {
        conversation.deletedByExpert = false;
      }
    } else {
      conversation.unreadCountFarmer += 1;

      if (conversation.status === 'pending') {
        conversation.status = 'answered';
      }

      if (conversation.deletedByFarmer) {
        conversation.deletedByFarmer = false;
      }
    }
    
    await conversation.save();

    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'displayName avatar');

    return successResponse(res, {
      message: {
        id: populatedMessage!._id,
        content: populatedMessage!.content,
        images: populatedMessage!.images,
        sender: populatedMessage!.senderId,
        receiverId,
        isRead: populatedMessage!.isRead,
        createdAt: populatedMessage!.createdAt,
      },
    }, 201);
  } catch (error: any) {
    return errorResponse(res, 'SERVER_001', error.message || 'Failed to send message', 500);
  }
};

/**
 * Update conversation status
 */
export const updateConversationStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { conversationId } = req.params;
    const { status } = req.body;

    if (!userId) {
      return errorResponse(res, 'AUTH_001', 'Unauthorized', 401);
    }

    if (!status || !['pending', 'answered', 'completed'].includes(status)) {
      return errorResponse(res, 'CONV_005', 'Invalid status', 400);
    }

    // Find conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId,
    });

    if (!conversation) {
      return errorResponse(res, 'CONV_003', 'Conversation not found', 404);
    }

    conversation.status = status;
    await conversation.save();

    return successResponse(res, {
      message: 'Conversation status updated successfully',
      status: conversation.status,
    });
  } catch (error: any) {
    return errorResponse(res, 'SERVER_001', error.message || 'Failed to update status', 500);
  }
};

/**
 * Complete conversation with rating (farmer only)
 */
export const completeConversation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { conversationId } = req.params;
    const { rating, comment } = req.body;

    if (!userId) {
      return errorResponse(res, 'AUTH_001', 'Unauthorized', 401);
    }

    if (!rating || rating < 1 || rating > 5) {
      return errorResponse(res, 'CONV_007', 'Rating must be between 1 and 5', 400);
    }

    // Find conversation (farmer only can complete)
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId, // Only farmer (userId) can complete
    });

    if (!conversation) {
      return errorResponse(res, 'CONV_003', 'Conversation not found or unauthorized', 404);
    }

    // ✅ Prevent duplicate rating
    if (conversation.status === 'completed') {
      return errorResponse(res, 'CONV_008', 'Conversation already completed', 400);
    }

    // ✅ Only allow rating if expert has replied
    if (conversation.status !== 'answered') {
      return errorResponse(res, 'CONV_009', 'Cannot complete conversation before expert replies', 400);
    }

    // Update conversation
    conversation.status = 'completed';
    conversation.rating = rating;
    conversation.ratingComment = comment; // Store rating comment
    conversation.completedAt = new Date();
    await conversation.save();
    await upsertExpertReviewFromConversation(conversation as IConversation);

    console.log(`✅ Conversation ${conversationId} completed with rating ${rating}`);

    // Update expert rating using weighted average
    const expert = await User.findById(conversation.expertId);
    if (expert) {
      const currentTotal = expert.rating * expert.totalRatings; // Total sum of all previous ratings
      const newTotal = currentTotal + rating; // Add new rating
      const totalRatings = expert.totalRatings + 1;
      const newRating = Math.round((newTotal / totalRatings) * 10) / 10; // Round to 1 decimal (4.5, 4.7, etc.)
      
      expert.rating = newRating;
      expert.totalRatings = totalRatings;
      await expert.save();
      
      console.log(`✅ Expert ${expert.displayName} rating updated: ${newRating} (${totalRatings} ratings)`);
    }

    return successResponse(res, {
      message: 'Conversation completed successfully',
      conversation: {
        id: conversation._id,
        status: conversation.status,
        rating: conversation.rating,
        completedAt: conversation.completedAt,
      },
    });
  } catch (error: any) {
    return errorResponse(res, 'SERVER_001', error.message || 'Failed to complete conversation', 500);
  }
};

/**
 * Request to reopen completed conversation (farmer only)
 */
export const requestReopen = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { conversationId } = req.params;

    if (!userId) {
      return errorResponse(res, 'AUTH_001', 'Unauthorized', 401);
    }

    // Find conversation (farmer only can request reopen)
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId,
      status: 'completed',
    });

    if (!conversation) {
      return errorResponse(res, 'CONV_003', 'Conversation not found, unauthorized, or not completed', 404);
    }

    // Update conversation
    conversation.status = 'reopen_requested';
    conversation.reopenRequestedAt = new Date();
    conversation.reopenRequestedBy = userId as any;
    await conversation.save();

    return successResponse(res, {
      message: 'Reopen request sent successfully',
      conversation: {
        id: conversation._id,
        status: conversation.status,
        reopenRequestedAt: conversation.reopenRequestedAt,
      },
    });
  } catch (error: any) {
    return errorResponse(res, 'SERVER_001', error.message || 'Failed to request reopen', 500);
  }
};

/**
 * Approve reopen request (expert only)
 */
export const approveReopen = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { conversationId } = req.params;
    const { approved } = req.body;

    if (!userId) {
      return errorResponse(res, 'AUTH_001', 'Unauthorized', 401);
    }

    // Find conversation (expert only can approve)
    const conversation = await Conversation.findOne({
      _id: conversationId,
      expertId: userId,
      status: 'reopen_requested',
    });

    if (!conversation) {
      return errorResponse(res, 'CONV_003', 'Conversation not found, unauthorized, or no reopen request', 404);
    }

    if (approved) {
      // Reopen conversation
      conversation.status = 'pending';
      conversation.reopenRequestedAt = undefined;
      conversation.reopenRequestedBy = undefined;
      conversation.completedAt = undefined;
      conversation.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    } else {
      // Reject reopen - back to completed
      conversation.status = 'completed';
      conversation.reopenRequestedAt = undefined;
      conversation.reopenRequestedBy = undefined;
    }
    
    await conversation.save();

    return successResponse(res, {
      message: approved ? 'Reopen request approved' : 'Reopen request rejected',
      conversation: {
        id: conversation._id,
        status: conversation.status,
      },
    });
  } catch (error: any) {
    return errorResponse(res, 'SERVER_001', error.message || 'Failed to process reopen request', 500);
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { conversationId } = req.params;

    if (!userId) {
      return errorResponse(res, 'AUTH_001', 'Unauthorized', 401);
    }

    // Verify conversation belongs to user
    const conversation = await Conversation.findOne({
      _id: conversationId,
      $or: [{ userId }, { expertId: userId }],
    });

    if (!conversation) {
      return errorResponse(res, 'CONV_003', 'Conversation not found', 404);
    }

    // Mark all unread messages as read
    const updateResult = await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      { isRead: true }
    );
    
    console.log(`📖 Marked ${updateResult.modifiedCount} messages as read for conversation ${conversationId}`);

    // Reset unread count
    const isExpert = conversation.expertId?.toString() === userId.toString();
    const isFarmer = conversation.userId?.toString() === userId.toString();
    
    console.log(`👤 User role check - isExpert: ${isExpert}, isFarmer: ${isFarmer}`);
    console.log(`📊 Before reset - expertCount: ${conversation.unreadCountExpert}, farmerCount: ${conversation.unreadCountFarmer}`);
    
    if (isExpert) {
      conversation.unreadCountExpert = 0;
    } else if (isFarmer) {
      conversation.unreadCountFarmer = 0;
    }
    
    await conversation.save();
    
    console.log(`✅ After reset - expertCount: ${conversation.unreadCountExpert}, farmerCount: ${conversation.unreadCountFarmer}`);

    // Emit socket event to update badge in real-time
    try {
      const { getIO } = require('../socket/socket.server');
      const io = getIO();
      
      io.to(`user:${userId}`).emit('unread:update', {
        conversationId: conversation._id,
        reset: true,
      });
      
      console.log(`🔔 Unread reset emitted to user ${userId}`);
    } catch (error) {
      console.error('Failed to emit unread:update:', error);
    }

    return successResponse(res, {
      message: 'Messages marked as read',
      markedCount: updateResult.modifiedCount,
    });
  } catch (error: any) {
    return errorResponse(res, 'SERVER_001', error.message || 'Failed to mark messages as read', 500);
  }
};

/**
 * Get total unread count for user
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return errorResponse(res, 'AUTH_001', 'Unauthorized', 401);
    }

    // Get user to check role
    const user = await User.findById(userId);
    const isExpert = user?.roles.includes('expert');

    // Get conversations
    const query: any = isExpert ? { expertId: userId } : { userId };
    const conversations = await Conversation.find(query);

    // Sum unread counts
    const totalUnread = conversations.reduce((sum, conv) => {
      return sum + (isExpert ? conv.unreadCountExpert : conv.unreadCountFarmer);
    }, 0);

    return successResponse(res, {
      unreadCount: totalUnread,
    });
  } catch (error: any) {
    return errorResponse(res, 'SERVER_001', error.message || 'Failed to get unread count', 500);
  }
};

/**
 * Delete conversation (soft delete - only for current user)
 * Conversation is only hidden from the user who deleted it
 * Hard delete only happens when both parties delete it
 */
export const deleteConversation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { conversationId } = req.params;

    if (!userId) {
      return errorResponse(res, 'AUTH_001', 'Unauthorized', 401);
    }

    // Verify conversation belongs to user
    const conversation = await Conversation.findOne({
      _id: conversationId,
      $or: [{ userId }, { expertId: userId }],
    });

    if (!conversation) {
      return errorResponse(res, 'CONV_003', 'Conversation not found or unauthorized', 404);
    }

    // Determine if user is farmer or expert
    const isFarmer = conversation.userId.toString() === userId;
    
    // Soft delete: Mark as deleted for this user
    if (isFarmer) {
      conversation.deletedByFarmer = true;
    } else {
      conversation.deletedByExpert = true;
    }
    
    await conversation.save();

    // Hard delete if both parties have deleted it
    if (conversation.deletedByFarmer && conversation.deletedByExpert) {
      await upsertExpertReviewFromConversation(conversation as IConversation);
      await Message.deleteMany({ conversationId });
      await Conversation.findByIdAndDelete(conversationId);
      
      return successResponse(res, {
        message: 'Conversation permanently deleted',
        permanentlyDeleted: true,
      });
    }

    return successResponse(res, {
      message: 'Conversation deleted successfully',
      permanentlyDeleted: false,
    });
  } catch (error: any) {
    return errorResponse(res, 'SERVER_001', error.message || 'Failed to delete conversation', 500);
  }
};

