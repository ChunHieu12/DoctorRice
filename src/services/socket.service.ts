import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { io, Socket } from 'socket.io-client';

// Get socket URL from app.json
const getSocketUrl = (): string => {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'https://doctorrice-xdhp.onrender.com/api';
  const socketUrl = apiUrl.replace('/api', '');
  console.log('🔌 Socket URL:', socketUrl);
  return socketUrl;
};

const SOCKET_URL = getSocketUrl();

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect() {
    try {
      // ✅ If already connected, don't reconnect
      if (this.socket?.connected) {
        console.log('ℹ️  Socket already connected:', this.socket.id);
        return this.socket;
      }

      // Get auth token from SecureStore (same key as api.ts)
      const token = await SecureStore.getItemAsync('accessToken');
      
      if (!token) {
        console.log('❌ No auth token, cannot connect to socket');
        return;
      }

      // ✅ Only disconnect if socket exists but not connected
      if (this.socket && !this.socket.connected) {
        console.log('🔄 Reconnecting existing socket...');
        this.socket.connect();
        return this.socket;
      }

      // Create new socket connection
      console.log('🔌 Creating new socket connection...');
      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
      });

      // Connection event handlers
      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket?.id);
        this.reconnectAttempts = 0;
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.log('❌ Max reconnect attempts reached');
          this.disconnect();
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
      });

      return this.socket;
    } catch (error) {
      console.error('❌ Failed to connect socket:', error);
      return null;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Socket disconnected');
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // User presence
  emitOnline() {
    this.socket?.emit('user:online');
  }

  emitOffline() {
    this.socket?.emit('user:offline');
  }

  // Typing indicators
  emitTyping(conversationId: string, receiverId: string) {
    this.socket?.emit('conversation:typing', { conversationId, receiverId });
  }

  emitStopTyping(conversationId: string, receiverId: string) {
    this.socket?.emit('conversation:stop-typing', { conversationId, receiverId });
  }

  // Message events
  emitMessageSend(data: { conversationId: string; messageId: string; receiverId: string }) {
    this.socket?.emit('message:send', data);
  }

  emitMessageRead(data: { conversationId: string; messageId: string; senderId: string }) {
    this.socket?.emit('message:read', data);
  }

  // Conversation events
  emitConversationCreated(data: { conversationId: string; expertId: string }) {
    this.socket?.emit('conversation:created', data);
  }

  emitConversationCompleted(data: { conversationId: string; expertId: string; rating: number }) {
    this.socket?.emit('conversation:completed', data);
  }

  emitReopenRequested(data: { conversationId: string; expertId: string }) {
    this.socket?.emit('conversation:reopen-requested', data);
  }

  emitReopenApproved(data: { conversationId: string; farmerId: string }) {
    this.socket?.emit('conversation:reopen-approved', data);
  }

  // Event listeners
  onUserOnline(callback: (data: { userId: string; timestamp: Date }) => void) {
    this.socket?.on('user:online', callback);
  }

  onUserOffline(callback: (data: { userId: string; timestamp: Date }) => void) {
    this.socket?.on('user:offline', callback);
  }

  onTyping(callback: (data: { conversationId: string; userId: string; isTyping: boolean }) => void) {
    this.socket?.on('conversation:typing', callback);
  }

  onMessageReceived(callback: (data: { conversationId: string; messageId: string; senderId: string }) => void) {
    this.socket?.on('message:received', callback);
  }

  onMessageRead(callback: (data: { conversationId: string; messageId: string; readBy: string }) => void) {
    this.socket?.on('message:read', callback);
  }

  onConversationCreated(callback: (data: { conversationId: string; farmerId: string }) => void) {
    this.socket?.on('conversation:created', callback);
  }

  onConversationCompleted(callback: (data: { conversationId: string; rating: number }) => void) {
    this.socket?.on('conversation:completed', callback);
  }

  onReopenRequested(callback: (data: { conversationId: string; farmerId: string }) => void) {
    this.socket?.on('conversation:reopen-requested', callback);
  }

  onReopenApproved(callback: (data: { conversationId: string; expertId: string }) => void) {
    this.socket?.on('conversation:reopen-approved', callback);
  }

  // Remove listeners
  off(event: string, callback?: any) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }
}

export default new SocketService();

