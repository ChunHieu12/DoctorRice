
import socketService from '@/services/socket.service';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

export const useSocket = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const hasConnected = useRef(false);

  useEffect(() => {
    if (user && !hasConnected.current) {
      // ✅ Only connect once when user is logged in
      console.log('🔌 Initializing socket connection for user:', user.id);
      hasConnected.current = true;
      connectSocket();
    } else if (!user && hasConnected.current) {
      // Disconnect when user logs out
      console.log('🔌 User logged out, disconnecting socket');
      socketService.disconnect();
      setIsConnected(false);
      hasConnected.current = false;
    }

    // ✅ Listen for socket connection state changes
    const socket = socketService.getSocket();
    if (socket) {
      const handleConnect = () => {
        console.log('🔌 Socket connected in hook');
        setIsConnected(true);
      };

      const handleDisconnect = () => {
        console.log('🔌 Socket disconnected in hook');
        setIsConnected(false);
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      // Set initial state
      setIsConnected(socket.connected);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      };
    }
  }, [user]);

  const connectSocket = async () => {
    try {
      await socketService.connect();
      const socket = socketService.getSocket();
      setIsConnected(socket?.connected || false);
    } catch (error) {
      console.error('Failed to connect socket:', error);
      setIsConnected(false);
    }
  };

  return {
    socket: socketService.getSocket(),
    isConnected,
    socketService,
  };
};

