import api from './api';

export interface Expert {
  _id: string;
  displayName: string;
  avatar?: string;
  expertise?: string;
  experience?: string;
  education?: string;
  workHistory?: string;
  detailedWorkHistory?: Array<{
    position: string;
    organization: string;
    period: string;
    description?: string;
  }>;
  rating: number;
  totalRatings: number;
  commentCount?: number;
  isOnline: boolean;
  lastActiveAt: string;
}

export interface ExpertReview {
  rating: number;
  comment?: string;
  completedAt?: string;
  createdAt?: string;
  farmer?: {
    _id: string;
    displayName: string;
    avatar?: string;
  };
}

export interface ExpertDetail extends Expert {
  stats?: {
    totalConversations: number;
    completedConversations: number;
  };
  reviews?: ExpertReview[];
}

export interface ConversationSummary {
  id: string;
  expert?: Expert;
  farmer?: {
    _id: string;
    displayName: string;
    avatar?: string;
    phone?: string;
  };
  status: 'pending' | 'answered' | 'completed' | 'reopen_requested' | 'expired';
  unreadCount: number;
  rating?: number;
  ratingComment?: string; // Rating comment from farmer
  completedAt?: string; // When conversation was completed
  lastMessage?: {
    content: string;
    images: string[];
    createdAt: string;
  };
  lastMessageAt: string;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  images: string[];
  sender: {
    _id: string;
    displayName: string;
    avatar?: string;
  };
  isRead: boolean;
  createdAt: string;
}

/**
 * Get list of experts
 */
export const getExperts = async (params?: {
  search?: string;
  online?: boolean;
  expertise?: string;
}): Promise<Expert[]> => {
  try {
    const response = await api.get<{ experts: Expert[] }>('/experts', { params });
    
    // Response structure: { data: { success: true, data: { experts: [...] } } }
    const apiData = (response as any).data;
    
    if (!apiData || !apiData.success || !apiData.data) {
      console.warn('⚠️ Experts API response invalid');
      return [];
    }
    
    return apiData.data.experts || [];
  } catch (error: any) {
    console.error('❌ Failed to fetch experts:', error.message);
    return [];
  }
};

/**
 * Get expert detail with suggestions
 */
export const getExpertDetail = async (expertId: string): Promise<{
  expert: ExpertDetail;
  suggestions: Expert[];
}> => {
  const response = await api.get<{ expert: ExpertDetail; suggestions: Expert[] }>(
    `/experts/${expertId}`
  );
  
  const apiData = (response as any).data;
  
  if (!apiData || !apiData.success || !apiData.data) {
    throw new Error(apiData?.error?.message || 'Failed to fetch expert detail');
  }
  
  console.log('📡 Expert detail API response:', {
    expertName: apiData.data.expert?.displayName,
    hasEducation: !!apiData.data.expert?.education,
    hasDetailedWorkHistory: !!apiData.data.expert?.detailedWorkHistory,
    detailedWorkHistoryCount: apiData.data.expert?.detailedWorkHistory?.length || 0,
  });
  
  return apiData.data;
};

/**
 * Get user conversations (farmer or expert)
 */
export const getConversations = async (status?: string): Promise<ConversationSummary[]> => {
  const response = await api.get<{ conversations: ConversationSummary[] }>('/conversations', {
    params: status ? { status } : undefined,
  });
  
  const apiData = (response as any).data;
  
  if (!apiData || !apiData.success || !apiData.data) {
    throw new Error(apiData?.error?.message || 'Failed to fetch conversations');
  }
  
  return apiData.data.conversations;
};

/**
 * Create or get conversation with expert
 */
export const createConversation = async (expertId: string): Promise<any> => {
  try {
    console.log('📤 Creating conversation with expertId:', expertId);
    
    const response = await api.post<{ conversation: any }>(
      '/conversations/create',
      { expertId }
    );
    
    const apiData = (response as any).data;
    
    console.log('📥 Create conversation response:', JSON.stringify(apiData, null, 2));
    
    if (!apiData || !apiData.success || !apiData.data) {
      console.error('❌ Invalid API response structure:', apiData);
      throw new Error(apiData?.error?.message || 'Failed to create conversation');
    }
    
    const conversation = apiData.data.conversation;
    console.log('✅ Conversation created:', conversation);
    
    return conversation;
  } catch (error: any) {
    console.error('❌ Create conversation failed:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (
  conversationId: string,
  page: number = 1,
  limit: number = 50
): Promise<any> => {
  try {
    console.log('📤 Getting messages for conversation:', conversationId);
    
    const response = await api.get<{
      messages: Message[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/conversations/${conversationId}/messages`, {
      params: { page, limit },
    });
    
    const apiData = (response as any).data;
    
    console.log('📥 Get messages response structure:', {
      hasData: !!apiData?.data,
      hasConversation: !!apiData?.data?.conversation,
      conversationFields: apiData?.data?.conversation ? Object.keys(apiData.data.conversation) : [],
    });
    
    if (!apiData || !apiData.success || !apiData.data) {
      console.error('❌ Invalid API response:', apiData);
      throw new Error(apiData?.error?.message || 'Failed to fetch messages');
    }
    
    return apiData.data;
  } catch (error: any) {
    console.error('❌ Get messages failed:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Send message in conversation
 */
export const sendMessage = async (
  conversationId: string,
  data: { content: string; images?: string[] }
): Promise<Message> => {
  const response = await api.post<{ message: Message }>(
    `/conversations/${conversationId}/messages`,
    data
  );
  
  const apiData = (response as any).data;
  
  if (!apiData || !apiData.success || !apiData.data) {
    throw new Error(apiData?.error?.message || 'Failed to send message');
  }
  
  return apiData.data.message;
};

/**
 * Complete conversation with rating
 */
export const completeConversation = async (
  conversationId: string,
  rating: number,
  comment?: string
): Promise<void> => {
  const response = await api.post(`/conversations/${conversationId}/complete`, { rating, comment });
  
  const apiData = (response as any).data;
  
  if (!apiData || !apiData.success) {
    throw new Error(apiData?.error?.message || 'Failed to complete conversation');
  }
};

/**
 * Request to reopen conversation
 */
export const requestReopen = async (conversationId: string): Promise<void> => {
  const response = await api.post(`/conversations/${conversationId}/reopen-request`);
  
  const apiData = (response as any).data;
  
  if (!apiData || !apiData.success) {
    throw new Error(apiData?.error?.message || 'Failed to request reopen');
  }
};

/**
 * Approve/reject reopen request (expert only)
 */
export const approveReopen = async (
  conversationId: string,
  approved: boolean
): Promise<void> => {
  const response = await api.post(`/conversations/${conversationId}/reopen-approve`, { approved });
  
  const apiData = (response as any).data;
  
  if (!apiData || !apiData.success) {
    throw new Error(apiData?.error?.message || 'Failed to process reopen request');
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (conversationId: string): Promise<void> => {
  const response = await api.post(`/conversations/${conversationId}/mark-read`);
  
  const apiData = (response as any).data;
  
  if (!apiData || !apiData.success) {
    throw new Error(apiData?.error?.message || 'Failed to mark messages as read');
  }
};

/**
 * Get unread count
 */
export const getUnreadCount = async (): Promise<number> => {
  try {
    const response = await api.get<{ unreadCount: number }>('/conversations/unread-count');
    
    // Response structure from axios: { data: { success: true, data: { unreadCount: 0 } } }
    const apiData = (response as any).data;
    
    if (!apiData || !apiData.success || !apiData.data) {
      return 0;
    }
    
    return apiData.data.unreadCount || 0;
  } catch (error: any) {
    console.error('❌ Failed to fetch unread count:', error.message);
    return 0;
  }
};

/**
 * Delete conversation
 */
export const deleteConversation = async (conversationId: string): Promise<void> => {
  const response = await api.delete(`/conversations/${conversationId}`);
  
  const apiData = (response as any).data;
  
  if (!apiData || !apiData.success) {
    throw new Error(apiData?.error?.message || 'Failed to delete conversation');
  }
};
