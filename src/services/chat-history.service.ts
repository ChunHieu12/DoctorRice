/**
 * Chat History Service
 * Manage chat history - save conversations that can be continued later
 * User can manually archive/delete conversations
 * Each user has their own chat history stored separately
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from './gemini.service';

/**
 * Get storage key for user's conversations
 */
const getConversationsKey = (userId: string | null): string => {
  if (!userId) {
    // Fallback for guest users (shouldn't happen in production)
    return 'chat_conversations_guest';
  }
  return `chat_conversations_${userId}`;
};

export interface ChatConversation {
  id: string;
  title: string; // First message or custom title
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  isArchived: boolean;
}

/**
 * Get current user ID from auth
 */
const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { getAccessToken } = await import('./api');
    const token = await getAccessToken();
    if (!token) return null;
    
    // Decode JWT to get userId
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return null;
    
    const payload = JSON.parse(atob(tokenParts[1]));
    return payload.userId || payload.sub || null;
  } catch (error) {
    console.error('❌ Failed to get user ID:', error);
    return null;
  }
};

/**
 * Get all conversations (including archived) for current user
 */
const getAllConversations = async (userId?: string | null): Promise<ChatConversation[]> => {
  try {
    const currentUserId = userId !== undefined ? userId : await getCurrentUserId();
    const key = getConversationsKey(currentUserId);
    
    const conversationsStr = await AsyncStorage.getItem(key);
    if (!conversationsStr) {
      return [];
    }
    return JSON.parse(conversationsStr);
  } catch (error) {
    console.error('❌ Failed to get conversations:', error);
    return [];
  }
};

/**
 * Save conversations to storage for current user
 */
const saveConversations = async (conversations: ChatConversation[], userId?: string | null): Promise<void> => {
  try {
    const currentUserId = userId !== undefined ? userId : await getCurrentUserId();
    const key = getConversationsKey(currentUserId);
    
    await AsyncStorage.setItem(key, JSON.stringify(conversations));
  } catch (error) {
    console.error('❌ Failed to save conversations:', error);
  }
};

/**
 * Get active (non-archived) conversations for current user
 */
export const getActiveConversations = async (userId?: string | null): Promise<ChatConversation[]> => {
  const all = await getAllConversations(userId);
  return all.filter(conv => !conv.isArchived);
};

/**
 * Get current/last active conversation for current user
 */
export const getCurrentConversation = async (userId?: string | null): Promise<ChatConversation | null> => {
  const active = await getActiveConversations(userId);
  return active.length > 0 ? active[active.length - 1] : null;
};

/**
 * Create new conversation for current user
 */
export const createNewConversation = async (title?: string, userId?: string | null): Promise<ChatConversation> => {
  const conversations = await getAllConversations(userId);
  const newConv: ChatConversation = {
    id: `conv_${Date.now()}`,
    title: title || 'Cuộc trò chuyện mới',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isArchived: false,
  };
  
  conversations.push(newConv);
  await saveConversations(conversations, userId);
  console.log('✅ New conversation created:', newConv.id);
  return newConv;
};

/**
 * Add message to current conversation
 */
export const addMessageToConversation = async (
  conversationId: string,
  message: ChatMessage,
  userId?: string | null
): Promise<void> => {
  try {
    const conversations = await getAllConversations(userId);
    const conv = conversations.find(c => c.id === conversationId);
    
    if (!conv) {
      console.error('❌ Conversation not found:', conversationId);
      return;
    }
    
    conv.messages.push(message);
    conv.updatedAt = Date.now();
    
    // Update title with first user message if still default
    if (conv.title === 'Cuộc trò chuyện mới' && message.role === 'user' && message.content) {
      conv.title = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
    }
    
    await saveConversations(conversations, userId);
    console.log('💾 Message saved to conversation:', conversationId);
  } catch (error) {
    console.error('❌ Failed to add message:', error);
  }
};

/**
 * Get conversation by ID for current user
 */
export const getConversationById = async (conversationId: string, userId?: string | null): Promise<ChatConversation | null> => {
  const conversations = await getAllConversations(userId);
  return conversations.find(c => c.id === conversationId) || null;
};

/**
 * Rename conversation
 */
export const renameConversation = async (conversationId: string, newTitle: string, userId?: string | null): Promise<void> => {
  try {
    const conversations = await getAllConversations(userId);
    const conv = conversations.find(c => c.id === conversationId);
    
    if (conv) {
      conv.title = newTitle.trim();
      conv.updatedAt = Date.now();
      await saveConversations(conversations, userId);
      console.log('✏️ Conversation renamed:', conversationId, newTitle);
    }
  } catch (error) {
    console.error('❌ Failed to rename conversation:', error);
  }
};

/**
 * Archive conversation (soft delete - can be unarchived later)
 */
export const archiveConversation = async (conversationId: string, userId?: string | null): Promise<void> => {
  try {
    const conversations = await getAllConversations(userId);
    const conv = conversations.find(c => c.id === conversationId);
    
    if (conv) {
      conv.isArchived = true;
      conv.updatedAt = Date.now();
      await saveConversations(conversations, userId);
      console.log('📦 Conversation archived:', conversationId);
    }
  } catch (error) {
    console.error('❌ Failed to archive conversation:', error);
  }
};

/**
 * Unarchive conversation
 */
export const unarchiveConversation = async (conversationId: string, userId?: string | null): Promise<void> => {
  try {
    const conversations = await getAllConversations(userId);
    const conv = conversations.find(c => c.id === conversationId);
    
    if (conv) {
      conv.isArchived = false;
      conv.updatedAt = Date.now();
      await saveConversations(conversations, userId);
      console.log('📤 Conversation unarchived:', conversationId);
    }
  } catch (error) {
    console.error('❌ Failed to unarchive conversation:', error);
  }
};

/**
 * Delete conversation permanently
 */
export const deleteConversation = async (conversationId: string, userId?: string | null): Promise<void> => {
  try {
    const conversations = await getAllConversations(userId);
    const filtered = conversations.filter(c => c.id !== conversationId);
    await saveConversations(filtered, userId);
    console.log('🗑️ Conversation deleted:', conversationId);
  } catch (error) {
    console.error('❌ Failed to delete conversation:', error);
  }
};

/**
 * Clear all conversations for current user
 */
export const clearAllConversations = async (userId?: string | null): Promise<void> => {
  try {
    const currentUserId = userId !== undefined ? userId : await getCurrentUserId();
    const key = getConversationsKey(currentUserId);
    await AsyncStorage.removeItem(key);
    console.log('🗑️ All conversations cleared for user:', currentUserId);
  } catch (error) {
    console.error('❌ Failed to clear all conversations:', error);
  }
};

// DEPRECATED: Keep for backward compatibility
export const getChatHistory = async (userId?: string | null): Promise<ChatMessage[]> => {
  const conv = await getCurrentConversation(userId);
  return conv ? conv.messages : [];
};

export const clearChatHistory = async (userId?: string | null): Promise<void> => {
  const conv = await getCurrentConversation(userId);
  if (conv) {
    await archiveConversation(conv.id, userId);
  }
};

