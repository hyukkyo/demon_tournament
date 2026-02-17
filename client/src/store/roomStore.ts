import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Room } from '../types';

interface RoomState {
  room: Room | null;
  isLoading: boolean;
  error: string | null;

  setRoom: (room: Room) => void;
  updateRoomStatus: (status: Room['status']) => void;
  clearRoom: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRoomStore = create<RoomState>()(
  devtools(
    (set) => ({
      room: null,
      isLoading: false,
      error: null,

      setRoom: (room) => set({ room, error: null }),

      updateRoomStatus: (status) =>
        set((state) => ({
          room: state.room ? { ...state.room, status } : null,
        })),

      clearRoom: () => set({ room: null, error: null }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isLoading: false }),
    }),
    { name: 'RoomStore' }
  )
);
