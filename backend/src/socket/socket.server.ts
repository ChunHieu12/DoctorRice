import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-replace-in-production';

// Store active socket connections: userId -> socketId[]
const activeUsers = new Map<string, Set<string>>();

interface SocketData {
  userId: string;
  user: {
    _id: any;
    displayName: string;
    avatar?: string;
    roles: string[];
  };
}

export function initializeSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer<any, any, any, SocketData>(httpServer, {
    cors: {
      origin: '*', // Configure properly in production
      methods: ['GET', 'POST'],
    },
  });

  // Authentication middleware
  io.use(async (socket: Socket<any, any, any, SocketData>, next: (err?: Error) => void) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user info to socket
      socket.data.userId = (user._id as any).toString();
      socket.data.user = {
        _id: user._id,
        displayName: user.displayName,
        avatar: user.avatar,
        roles: user.roles,
      };

      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', async (socket: Socket<any, any, any, SocketData>) => {
    const userId = socket.data.userId;
    console.log(`✅ User connected: ${userId} (${socket.id})`);

    // Add to active users
    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
    }
    activeUsers.get(userId)!.add(socket.id);

    // Update user online status
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastActiveAt: new Date(),
      });

      // Broadcast online status to all clients
      io.emit('user:online', { userId, timestamp: new Date() });
    } catch (error) {
      console.error('Error updating online status:', error);
    }

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle typing indicator
    socket.on('conversation:typing', (data: { conversationId: string; receiverId: string }) => {
      socket.to(`user:${data.receiverId}`).emit('conversation:typing', {
        conversationId: data.conversationId,
        userId,
        isTyping: true,
      });
    });

    socket.on('conversation:stop-typing', (data: { conversationId: string; receiverId: string }) => {
      socket.to(`user:${data.receiverId}`).emit('conversation:typing', {
        conversationId: data.conversationId,
        userId,
        isTyping: false,
      });
    });

    // Handle message send (confirmation)
    socket.on('message:send', async (data: { conversationId: string; messageId: string; receiverId: string }) => {
      console.log(`📨 Message sent: ${data.messageId} to ${data.receiverId}`);
      
      try {
        // Fetch full message from database to send to receiver
        const { Message } = await import('../models/Message');
        const fullMessage = await Message.findById(data.messageId)
          .populate('senderId', 'displayName avatar')
          .lean();
        
        if (fullMessage) {
          // Send full message to receiver for realtime display
          io.to(`user:${data.receiverId}`).emit('message:receive', {
            conversationId: data.conversationId,
            message: {
              id: fullMessage._id,
              content: fullMessage.content,
              images: fullMessage.images,
              sender: fullMessage.senderId,
              isRead: fullMessage.isRead,
              createdAt: fullMessage.createdAt,
            },
          });
          console.log(`✅ Full message sent to ${data.receiverId}`);
        }
      } catch (error) {
        console.error('❌ Error fetching message for socket emit:', error);
      }

      // Emit unread count update to receiver for badge refresh
      io.to(`user:${data.receiverId}`).emit('unread:update', {
        conversationId: data.conversationId,
        increment: true,
      });
      
      console.log(`🔔 Unread count update emitted to ${data.receiverId}`);
    });

    // Handle message read
    socket.on('message:read', (data: { conversationId: string; messageId: string; senderId: string }) => {
      console.log(`👁️ Message read: ${data.messageId}`);
      
      // Notify sender that message was read
      io.to(`user:${data.senderId}`).emit('message:read', {
        conversationId: data.conversationId,
        messageId: data.messageId,
        readBy: userId,
      });
    });

    // Handle conversation events
    socket.on('conversation:created', (data: { conversationId: string; expertId: string }) => {
      console.log(`💬 Conversation created: ${data.conversationId}`);
      
      // Notify expert
      io.to(`user:${data.expertId}`).emit('conversation:created', {
        conversationId: data.conversationId,
        farmerId: userId,
      });
    });

    socket.on('conversation:completed', (data: { conversationId: string; expertId: string; rating: number }) => {
      console.log(`✅ Conversation completed: ${data.conversationId}, rating: ${data.rating}`);
      
      // Notify expert
      io.to(`user:${data.expertId}`).emit('conversation:completed', {
        conversationId: data.conversationId,
        rating: data.rating,
      });
    });

    socket.on('conversation:reopen-requested', (data: { conversationId: string; expertId: string }) => {
      console.log(`🔄 Reopen requested: ${data.conversationId}`);
      
      // Notify expert
      io.to(`user:${data.expertId}`).emit('conversation:reopen-requested', {
        conversationId: data.conversationId,
        farmerId: userId,
      });
    });

    socket.on('conversation:reopen-approved', (data: { conversationId: string; farmerId: string }) => {
      console.log(`✅ Reopen approved: ${data.conversationId}`);
      
      // Notify farmer
      io.to(`user:${data.farmerId}`).emit('conversation:reopen-approved', {
        conversationId: data.conversationId,
        expertId: userId,
      });
    });

    // Disconnect handler
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${userId} (${socket.id})`);

      // Remove from active users
      const userSockets = activeUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        
        // If no more sockets for this user, mark offline
        if (userSockets.size === 0) {
          activeUsers.delete(userId);

          try {
            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastActiveAt: new Date(),
            });

            // Broadcast offline status
            io.emit('user:offline', { userId, timestamp: new Date() });
          } catch (error) {
            console.error('Error updating offline status:', error);
          }
        }
      }
    });
  });

  console.log('🔌 Socket.io server initialized');

  return io;
}

// Helper function to get online users
export function getActiveUsers(): string[] {
  return Array.from(activeUsers.keys());
}

// Helper function to check if user is online
export function isUserOnline(userId: string): boolean {
  return activeUsers.has(userId);
}

