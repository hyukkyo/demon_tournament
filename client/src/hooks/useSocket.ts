import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { socketService } from '../services/socket/socket';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('[useSocket] Initializing socket connection');
    const socketInstance = socketService.connect();
    setSocket(socketInstance);

    const handleConnect = () => {
      console.log('[useSocket] Socket connected:', socketInstance.id);
      setIsConnected(true);
    };
    const handleDisconnect = () => {
      console.log('[useSocket] Socket disconnected');
      setIsConnected(false);
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);

    // 이미 연결되어 있다면 상태 업데이트
    if (socketInstance.connected) {
      console.log('[useSocket] Socket already connected:', socketInstance.id);
      setIsConnected(true);
    }

    return () => {
      console.log('[useSocket] Cleaning up useSocket hook');
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      // 주의: socket 자체는 disconnect하지 않음 (singleton이므로)
    };
  }, []); // 빈 배열로 한 번만 실행

  return { socket, isConnected };
};
