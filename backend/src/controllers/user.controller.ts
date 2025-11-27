import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { User } from '../models/User';
import { CloudinaryService } from '../services/cloudinary.service';
import { validatePassword } from '../utils/passwordValidator';
import { isValidVietnamesePhone, normalizePhone } from '../utils/phoneNormalizer';
import { errorResponse, successResponse } from '../utils/responses';

/**
 * Get current user profile
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return errorResponse(res, 'AUTH_001', 'Unauthorized', 401);
    }

    const user = await User.findById(userId).select('-passwordHash');
    
    if (!user) {
      return errorResponse(res, 'USER_001', 'User not found', 404);
    }

    return successResponse(res, {
      user: {
        _id: user._id,
        id: user._id,
        phone: user.phone,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        roles: user.roles,
        expertise: user.expertise,
        provider: user.email ? 'email' : 'phone', // Determine from available fields
        isPhoneVerified: user.isPhoneVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    return errorResponse(res, 'SERVER_001', error.message || 'Failed to get profile', 500);
  }
};

/**
 * Update user profile (name, phone)
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { displayName, phone } = req.body;

    if (!userId) {
      return errorResponse(res, 'AUTH_001', 'Unauthorized', 401);
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return errorResponse(res, 'USER_001', 'User not found', 404);
    }

    // Update displayName if provided
    if (displayName) {
      user.displayName = displayName;
    }

    // Update phone if provided
    if (phone) {
      const normalizedPhone = normalizePhone(phone);
      
      if (!isValidVietnamesePhone(normalizedPhone)) {
        return errorResponse(res, 'USER_002', 'Invalid phone number format', 400);
      }

      // Check if phone is already taken by another user
      const existingUser = await User.findOne({ 
        phone: normalizedPhone,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return errorResponse(res, 'USER_003', 'Phone number already exists', 409);
      }

      user.phone = normalizedPhone;
      // Mark phone as not verified since it changed
      user.isPhoneVerified = false;
    }

    await user.save();

    return successResponse(res, {
      user: {
        id: user._id,
        phone: user.phone,
        displayName: user.displayName,
        avatar: user.avatar,
        isPhoneVerified: user.isPhoneVerified,
      },
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    return errorResponse(res, 'SERVER_001', error.message || 'Failed to update profile', 500);
  }
};

/**
 * Upload/update avatar
 */
export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return errorResponse(res, 'AUTH_001', 'Unauthorized', 401);
    }

    if (!req.file) {
      return errorResponse(res, 'USER_004', 'No image file provided', 400);
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return errorResponse(res, 'USER_001', 'User not found', 404);
    }

    // Delete old avatar from Cloudinary if exists
    if (user.avatar) {
      try {
        // Extract public ID from URL if it's a Cloudinary URL
        const publicIdMatch = user.avatar.match(/\/([^/]+)\.[^.]+$/);
        if (publicIdMatch) {
          await CloudinaryService.deleteImage(publicIdMatch[1]);
        }
      } catch (error) {
        console.error('⚠️ Failed to delete old avatar (non-critical):', error);
      }
    }

    // Upload new avatar to Cloudinary
    const result = await CloudinaryService.uploadImage(req.file.path, {
      folder: 'doctorrice/avatars',
    });

    // Generate optimized avatar URL (400x400, cropped)
    const avatarUrl = CloudinaryService.generateThumbnailUrl(result.public_id, 400, 400);

    // Update user avatar URL
    user.avatar = avatarUrl;
    await user.save();

    return successResponse(res, {
      avatar: user.avatar,
      message: 'Avatar uploaded successfully',
    });
  } catch (error: any) {
    return errorResponse(res, 'SERVER_001', error.message || 'Failed to upload avatar', 500);
  }
};

/**
 * Change password
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return errorResponse(res, 'AUTH_001', 'Unauthorized', 401);
    }

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'USER_005', 'Current password and new password are required', 400);
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return errorResponse(
        res,
        'USER_006',
        passwordValidation.errors.join('; '),
        400
      );
    }

    // Find user with password
    const user = await User.findById(userId).select('+passwordHash');
    
    if (!user) {
      return errorResponse(res, 'USER_001', 'User not found', 404);
    }

    if (!user.passwordHash) {
      return errorResponse(res, 'USER_007', 'User does not have a password set', 400);
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return errorResponse(res, 'USER_008', 'Current password is incorrect', 401);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    user.passwordHash = passwordHash;
    await user.save();

    return successResponse(res, {
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    return errorResponse(res, 'SERVER_001', error.message || 'Failed to change password', 500);
  }
};

/**
 * Get list of all experts
 */
export const getExperts = async (req: Request, res: Response) => {
  try {
    const experts = await User.find({ roles: 'expert' })
      .select('displayName avatar expertise phone createdAt')
      .sort({ createdAt: -1 });

    return successResponse(res, {
      experts: experts.map(expert => ({
        id: expert._id,
        displayName: expert.displayName,
        avatar: expert.avatar,
        expertise: expert.expertise,
      })),
      total: experts.length,
    });
  } catch (error: any) {
    return errorResponse(res, 'SERVER_001', error.message || 'Failed to get experts', 500);
  }
};

