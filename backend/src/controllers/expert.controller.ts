import { Request, Response } from "express";
import { Types } from "mongoose";
import { Conversation } from "../models/Conversation";
import { ExpertReview } from "../models/ExpertReview";
import { User } from "../models/User";
import { ensureExpertReviewSnapshots } from "../services/expertReview.service";
import { errorResponse, successResponse } from "../utils/responses";

const getIdString = (value: unknown): string =>
  value instanceof Types.ObjectId ? value.toHexString() : String(value);

const ensureObjectId = (value: unknown): Types.ObjectId =>
  value instanceof Types.ObjectId ? value : new Types.ObjectId(String(value));

/**
 * Get list of expert users with filters
 */
export const getExperts = async (req: Request, res: Response) => {
  try {
    const { search, online, expertise } = req.query;

    // Build query
    const query: any = {
      roles: "expert", // Only users with expert role
    };

    // Search by name
    if (search && typeof search === "string") {
      query.displayName = { $regex: search, $options: "i" };
    }

    // Filter by expertise
    if (expertise && typeof expertise === "string") {
      query.expertise = { $regex: expertise, $options: "i" };
    }

    // Filter by online status
    if (online === "true") {
      query.$or = [
        { isOnline: true },
        // Consider online if active within last 5 minutes
        { lastActiveAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } },
      ];
    }

    const experts = await User.find(query)
      .select(
        "displayName avatar expertise education experience rating totalRatings isOnline lastActiveAt createdAt"
      )
      .sort({ isOnline: -1, rating: -1 }); // Online first, then by rating

    const expertIds = experts.map((expert) => expert._id as Types.ObjectId);
    let commentCountMap: Record<string, number> = {};

    if (expertIds.length > 0) {
      await ensureExpertReviewSnapshots(expertIds);

      const commentStats = await ExpertReview.aggregate([
        {
          $match: {
            expertId: { $in: expertIds },
            comment: {
              $exists: true,
              $type: "string",
              $not: { $regex: "^\\s*$" },
            },
          },
        },
        {
          $group: {
            _id: "$expertId",
            reviewCount: { $sum: 1 },
          },
        },
      ]);

      commentCountMap = commentStats.reduce(
        (acc: Record<string, number>, stat) => {
          acc[getIdString(stat._id)] = stat.reviewCount;
          return acc;
        },
        {}
      );
    }

    return successResponse(res, {
      experts: experts.map((expert) => ({
        _id: getIdString(expert._id),
        displayName: expert.displayName,
        avatar: expert.avatar,
        expertise: expert.expertise,
        education: expert.education, // ✅ Added education
        experience: expert.experience,
        rating: expert.rating,
        totalRatings: expert.totalRatings,
        commentCount: commentCountMap[getIdString(expert._id)] || 0,
        // Only use isOnline field (managed by Socket.io connection)
        isOnline: expert.isOnline === true,
        lastActiveAt: expert.lastActiveAt,
      })),
    });
  } catch (error: any) {
    return errorResponse(
      res,
      "SERVER_001",
      error.message || "Failed to fetch experts",
      500
    );
  }
};

/**
 * Get expert detail with suggestions
 */
export const getExpertDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const expert = await User.findById(id).select(
      "displayName avatar expertise experience education workHistory detailedWorkHistory rating totalRatings isOnline lastActiveAt createdAt roles"
    );

    if (!expert || !expert.roles?.includes("expert")) {
      return errorResponse(res, "EXPERT_001", "Expert not found", 404);
    }

    console.log("👨‍⚕️ Expert found:", {
      name: expert.displayName,
      hasEducation: !!expert.education,
      hasDetailedWorkHistory: !!expert.detailedWorkHistory,
      detailedWorkHistoryLength: expert.detailedWorkHistory?.length || 0,
    });

    const expertObjectId = ensureObjectId(expert._id);
    const expertIdString = expertObjectId.toHexString();

    await ensureExpertReviewSnapshots([expertObjectId]);

    // Get conversation count with this expert (for stats)
    const conversationCount = await Conversation.countDocuments({
      expertId: expertObjectId,
    });
    const completedCount = await Conversation.countDocuments({
      expertId: expertObjectId,
      status: "completed",
    });

    const reviewMatchQuery = {
      expertId: expertObjectId,
    } as const;

    const commentMatchQuery = {
      ...reviewMatchQuery,
      comment: {
        $exists: true,
        $type: "string",
        $not: { $regex: "^\\s*$" },
      },
    } as const;

    const [reviewCount, reviewDocs] = await Promise.all([
      ExpertReview.countDocuments(commentMatchQuery),
      ExpertReview.find(reviewMatchQuery)
        .populate("farmerId", "displayName avatar")
        .sort({ completedAt: -1, createdAt: -1 })
        .limit(20)
        .select("rating comment completedAt createdAt farmerId"),
    ]);

    // Get suggestions: other experts (online first, high rating, same expertise)
    const suggestions = await User.find({
      _id: { $ne: expertObjectId }, // Exclude current expert
      roles: "expert",
    })
      .select("displayName avatar expertise rating isOnline lastActiveAt")
      .sort({ isOnline: -1, rating: -1 }) // Online first, then rating
      .limit(5);

    return successResponse(res, {
      expert: {
        _id: expertIdString,
        displayName: expert.displayName,
        avatar: expert.avatar,
        expertise: expert.expertise,
        education: expert.education, // ✅ Added education
        experience: expert.experience,
        workHistory: expert.workHistory,
        detailedWorkHistory: expert.detailedWorkHistory, // ✅ Added detailedWorkHistory
        rating: expert.rating,
        totalRatings: expert.totalRatings,
        commentCount: reviewCount,
        // Only use isOnline field (managed by Socket.io connection)
        isOnline: expert.isOnline === true,
        lastActiveAt: expert.lastActiveAt,
        stats: {
          totalConversations: conversationCount,
          completedConversations: completedCount,
        },
        reviews: reviewDocs.map((review: any) => ({
          rating: review.rating,
          comment: review.comment,
          completedAt: review.completedAt,
          createdAt: review.createdAt,
          farmer: review.farmerId
            ? {
                _id: getIdString(review.farmerId._id),
                displayName: review.farmerId.displayName,
                avatar: review.farmerId.avatar,
              }
            : undefined,
        })),
      },
      suggestions: suggestions.map((s) => ({
        _id: getIdString(s._id),
        displayName: s.displayName,
        avatar: s.avatar,
        expertise: s.expertise,
        rating: s.rating,
        isOnline: s.isOnline === true,
      })),
    });
  } catch (error: any) {
    return errorResponse(
      res,
      "SERVER_001",
      error.message || "Failed to fetch expert detail",
      500
    );
  }
};

/**
 * Get farmers list (for experts)
 */
export const getFarmers = async (req: Request, res: Response) => {
  try {
    const expertId = (req as any).user?.userId;

    if (!expertId) {
      return errorResponse(res, "AUTH_001", "Unauthorized", 401);
    }

    // Get all conversations for this expert
    const conversations = await Conversation.find({ expertId })
      .populate("userId", "displayName avatar phone")
      .sort({ lastMessageAt: -1 });

    // Extract unique farmers
    const farmersMap = new Map();
    conversations.forEach((conv: any) => {
      if (conv.userId && !farmersMap.has(conv.userId._id.toString())) {
        farmersMap.set(conv.userId._id.toString(), {
          _id: conv.userId._id,
          displayName: conv.userId.displayName,
          avatar: conv.userId.avatar,
          phone: conv.userId.phone,
          lastConversation: conv.lastMessageAt,
        });
      }
    });

    const farmers = Array.from(farmersMap.values());

    return successResponse(res, { farmers });
  } catch (error: any) {
    return errorResponse(
      res,
      "SERVER_001",
      error.message || "Failed to fetch farmers",
      500
    );
  }
};
