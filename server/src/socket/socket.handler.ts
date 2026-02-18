import { Server, Socket } from 'socket.io';
import { roomService } from '../services/room.service';
import { gameService } from '../services/game.service';
import logger from '../utils/logger';
import {
  SocketResponse,
  CreateRoomPayload,
  JoinRoomPayload,
} from '../types/socket.types';

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // 룸 생성
    socket.on('room:create', async (payload: CreateRoomPayload, callback) => {
      try {
        const { username } = payload;

        if (!username || username.trim().length === 0) {
          return callback({
            success: false,
            error: {
              code: 'INVALID_USERNAME',
              message: 'Username is required',
            },
          } as SocketResponse);
        }

        const room = await roomService.createRoom(socket.id, username);

        // 소켓을 룸에 추가
        socket.join(room.roomId);
        logger.info(`Socket ${socket.id} joined room ${room.roomId}`);

        callback({
          success: true,
          data: {
            roomId: room.roomId,
            room,
          },
        } as SocketResponse);
      } catch (error) {
        logger.error('Error creating room:', error);
        callback({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        } as SocketResponse);
      }
    });

    // 룸 참가
    socket.on('room:join', async (payload: JoinRoomPayload, callback) => {
      try {
        const { roomId, username } = payload;

        if (!roomId || !username) {
          return callback({
            success: false,
            error: {
              code: 'INVALID_PAYLOAD',
              message: 'Room ID and username are required',
            },
          } as SocketResponse);
        }

        const room = await roomService.joinRoom(roomId, socket.id, username);

        // 소켓을 룸에 추가
        socket.join(roomId);
        logger.info(`Socket ${socket.id} joined room ${roomId}`);

        // 콜백으로 응답
        callback({
          success: true,
          data: room,
        } as SocketResponse);

        // 룸의 다른 플레이어에게 알림
        logger.info(`Emitting room:player_joined to room ${roomId}`);
        socket.to(roomId).emit('room:player_joined', {
          player: room.players.find((p) => p.playerId === socket.id),
          room,
        });

        // 상태 변경 알림 (2명이 되면 character_select로)
        if (room.status === 'character_select') {
          logger.info(`Emitting room:status_changed to room ${roomId}, status: character_select`);
          io.to(roomId).emit('room:status_changed', { status: room.status, room });
        }
      } catch (error) {
        logger.error('Error joining room:', error);
        callback({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        } as SocketResponse);
      }
    });

    // 룸 떠나기
    socket.on('room:leave', async (callback) => {
      try {
        // 소켓이 속한 룸 찾기
        const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);

        if (rooms.length === 0) {
          return callback({
            success: true,
          } as SocketResponse);
        }

        const roomId = rooms[0];
        const room = await roomService.leaveRoom(roomId, socket.id);

        socket.leave(roomId);

        callback({
          success: true,
        } as SocketResponse);

        if (room) {
          // 룸의 다른 플레이어에게 알림
          socket.to(roomId).emit('room:player_left', { 
            playerId: socket.id,
            room 
          });
        }
      } catch (error) {
        logger.error('Error leaving room:', error);
        callback({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        } as SocketResponse);
      }
    });

    // 캐릭터 선택
    socket.on('game:select_character', async (payload: { characterId: string }, callback) => {
      try {
        const { characterId } = payload;

        // 소켓이 속한 룸 찾기
        const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
        if (rooms.length === 0) {
          return callback({
            success: false,
            error: {
              code: 'NO_ROOM',
              message: 'Not in a room',
            },
          } as SocketResponse);
        }

        const roomId = rooms[0];
        const room = await roomService.selectCharacter(roomId, socket.id, characterId);

        callback({
          success: true,
          data: room,
        } as SocketResponse);

        // 룸의 모든 플레이어에게 알림
        io.to(roomId).emit('game:character_selected', {
          playerId: socket.id,
          characterId,
          room,
        });

        // 모두 선택 완료 시 상태 변경 알림
        if (room.status === 'card_select') {
          logger.info(`All players selected characters in room ${roomId}, moving to card_select`);
          io.to(roomId).emit('room:status_changed', { status: room.status, room });
        }
      } catch (error) {
        logger.error('Error selecting character:', error);
        callback({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        } as SocketResponse);
      }
    });

    // 카드 선택
    socket.on('game:select_cards', async (payload: { cardIds: string[] }, callback) => {
      try {
        const { cardIds } = payload;

        // 소켓이 속한 룸 찾기
        const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
        if (rooms.length === 0) {
          return callback({
            success: false,
            error: {
              code: 'NO_ROOM',
              message: 'Not in a room',
            },
          } as SocketResponse);
        }

        const roomId = rooms[0];
        const room = await roomService.selectCards(roomId, socket.id, cardIds);

        callback({
          success: true,
          data: room,
        } as SocketResponse);

        // 룸의 모든 플레이어에게 알림
        io.to(roomId).emit('game:cards_selected', {
          playerId: socket.id,
          cardCount: cardIds.length,
          room,
        });

        // 모두 선택 완료 시 상태 변경 알림
        if (room.status === 'battle') {
          logger.info(`All players selected cards in room ${roomId}, moving to battle`);
          io.to(roomId).emit('room:status_changed', { status: room.status, room });
        }
      } catch (error) {
        logger.error('Error selecting cards:', error);
        callback({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        } as SocketResponse);
      }
    });

    // 카드 실행 (배틀 단계)
    socket.on('game:execute_card', async (callback) => {
      try {
        // 소켓이 속한 룸 찾기
        const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
        if (rooms.length === 0) {
          return callback({
            success: false,
            error: {
              code: 'NO_ROOM',
              message: 'Not in a room',
            },
          } as SocketResponse);
        }

        const roomId = rooms[0];
        const room = await gameService.executeCard(roomId, socket.id);

        callback({
          success: true,
          data: room,
        } as SocketResponse);

        // 룸의 모든 플레이어에게 게임 상태 업데이트
        io.to(roomId).emit('game:card_executed', {
          playerId: socket.id,
          room,
        });
      } catch (error) {
        logger.error('Error executing card:', error);
        callback({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        } as SocketResponse);
      }
    });

    // 양쪽 플레이어 카드 실행 (자동 진행)
    socket.on('game:execute_both_cards', async (callback) => {
      try {
        // 소켓이 속한 룸 찾기
        const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
        if (rooms.length === 0) {
          return callback({
            success: false,
            error: {
              code: 'NO_ROOM',
              message: 'Not in a room',
            },
          } as SocketResponse);
        }

        const roomId = rooms[0];
        const room = await gameService.executeBothCards(roomId);

        callback({
          success: true,
          data: room,
        } as SocketResponse);

        // 게임 상태 브로드캐스트
        if (room.status === 'finished') {
          io.to(roomId).emit('game:finished', {
            winner: room.winner,
            room,
          });
        } else if (room.status === 'card_select') {
          io.to(roomId).emit('game:round_finished', {
            room,
          });
        } else {
          io.to(roomId).emit('game:cards_executed', {
            cardIndex: room.currentCardIndex - 1,
            room,
          });
        }
      } catch (error) {
        logger.error('Error executing both cards:', error);
        callback({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        } as SocketResponse);
      }
    });

    // 다음 카드로 진행
    socket.on('game:next_card', async (callback) => {
      try {
        // 소켓이 속한 룸 찾기
        const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
        if (rooms.length === 0) {
          return callback({
            success: false,
            error: {
              code: 'NO_ROOM',
              message: 'Not in a room',
            },
          } as SocketResponse);
        }

        const roomId = rooms[0];
        const room = await gameService.nextCard(roomId);

        callback({
          success: true,
          data: room,
        } as SocketResponse);

        // 상태 변경 알림 (게임 종료 또는 다음 라운드)
        if (room.status === 'finished') {
          io.to(roomId).emit('game:finished', {
            winner: room.winner,
            room,
          });
        } else if (room.status === 'card_select') {
          io.to(roomId).emit('room:status_changed', {
            status: room.status,
            room,
          });
        } else {
          io.to(roomId).emit('game:next_card', { room });
        }
      } catch (error) {
        logger.error('Error moving to next card:', error);
        callback({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        } as SocketResponse);
      }
    });

    // 연결 해제
    socket.on('disconnect', async () => {
      logger.info(`Client disconnected: ${socket.id}`);

      // 소켓이 속한 룸에서 제거
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);

      for (const roomId of rooms) {
        try {
          const room = await roomService.leaveRoom(roomId, socket.id);
          if (room) {
            socket.to(roomId).emit('room:player_left', { 
              playerId: socket.id,
              room 
            });
          }
        } catch (error) {
          logger.error('Error handling disconnect:', error);
        }
      }
    });
  });
};
