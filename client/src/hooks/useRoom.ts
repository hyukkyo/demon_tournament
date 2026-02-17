import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from './useSocket';
import { useRoomStore } from '../store/roomStore';

interface SocketResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export const useRoom = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { setRoom, setLoading, setError } = useRoomStore();

  const createRoom = useCallback(
    async (username: string) => {
      if (!socket) {
        setError('Socket not connected');
        return;
      }

      setLoading(true);

      console.log('[useRoom] Creating room with username:', username);

      socket.emit(
        'room:create',
        { username },
        (response: SocketResponse<{ roomId: string; room: any }>) => {
          setLoading(false);

          console.log('[useRoom] room:create response:', response);

          if (response.success && response.data) {
            setRoom(response.data.room);
            navigate(`/lobby/${response.data.roomId}`);
          } else {
            setError(response.error?.message || 'Failed to create room');
          }
        }
      );
    },
    [socket, navigate, setRoom, setLoading, setError]
  );

  const joinRoom = useCallback(
    async (roomId: string, username: string) => {
      if (!socket) {
        setError('Socket not connected');
        return;
      }

      setLoading(true);

      console.log('[useRoom] Joining room:', roomId, 'with username:', username);

      socket.emit('room:join', { roomId, username }, (response: SocketResponse) => {
        setLoading(false);

        console.log('[useRoom] room:join response:', response);

        if (response.success && response.data) {
          setRoom(response.data);
          navigate(`/lobby/${roomId}`);
        } else {
          setError(response.error?.message || 'Failed to join room');
        }
      });
    },
    [socket, navigate, setRoom, setLoading, setError]
  );

  const leaveRoom = useCallback(() => {
    if (!socket) return;

    socket.emit('room:leave', (response: SocketResponse) => {
      if (response.success) {
        setRoom(null);
        navigate('/');
      }
    });
  }, [socket, navigate, setRoom]);

  return { createRoom, joinRoom, leaveRoom };
};
