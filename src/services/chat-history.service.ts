/**
 * Chat History Service
 * Manage chat history with 24-hour auto-clear
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from './gemini.service';

const CHAT_HISTORY_KEY = 'chat_history';
const CHAT_TIMESTAMP_KEY = 'chat_timestamp';
const EXPIRY_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Save chat message to history
 */
export const saveChatMessage = async (message: ChatMessage): Promise<void> => {
  try {
    const history = await getChatHistory();
    history.push(message);
    
    await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
    
    // Update timestamp if this is the first message
    if (history.length === 1) {
      await AsyncStorage.setItem(CHAT_TIMESTAMP_KEY, Date.now().toString());
    }
    
    console.log('💾 Chat message saved');
  } catch (error) {
    console.error('❌ Failed to save chat message:', error);
  }
};

/**
 * Get chat history (auto-clear if expired)
 */
export const getChatHistory = async (): Promise<ChatMessage[]> => {
  try {
    const timestampStr = await AsyncStorage.getItem(CHAT_TIMESTAMP_KEY);
    
    // Check if history is expired
    if (timestampStr) {
      const timestamp = parseInt(timestampStr, 10);
      const isExpired = Date.now() - timestamp > EXPIRY_DURATION;
      
      if (isExpired) {
        console.log('🗑️ Chat history expired (>24h), clearing...');
        await clearChatHistory();
        return [];
      }
    }
    
    const historyStr = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    
    if (!historyStr) {
      return [];
    }
    
    const history: ChatMessage[] = JSON.parse(historyStr);
    return history;
    
  } catch (error) {
    console.error('❌ Failed to get chat history:', error);
    return [];
  }
};

/**
 * Clear chat history
 */
export const clearChatHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([CHAT_HISTORY_KEY, CHAT_TIMESTAMP_KEY]);
    console.log('🗑️ Chat history cleared');
  } catch (error) {
    console.error('❌ Failed to clear chat history:', error);
  }
};

/**
 * Get time remaining before auto-clear (in hours)
 */
export const getTimeRemaining = async (): Promise<number> => {
  try {
    const timestampStr = await AsyncStorage.getItem(CHAT_TIMESTAMP_KEY);
    
    if (!timestampStr) {
      return 24; // No history yet
    }
    
    const timestamp = parseInt(timestampStr, 10);
    const elapsed = Date.now() - timestamp;
    const remaining = EXPIRY_DURATION - elapsed;
    
    return Math.max(0, Math.round(remaining / (60 * 60 * 1000))); // Convert to hours
    
  } catch (error) {
    console.error('❌ Failed to get time remaining:', error);
    return 24;
  }
};

