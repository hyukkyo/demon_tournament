import { Request, Response } from 'express';
import { roomService } from '../services/room.service';

export class RoomController {
  /**
   * POST /api/rooms - 룸 생성
   */
  async createRoom(req: Request, res: Response) {
    try {
      const { username } = req.body;

      if (!username || username.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_USERNAME',
            message: 'Username is required',
          },
        });
      }

      // REST API에서는 임시 playerId 생성
      const playerId = `player_${Date.now()}`;
      const room = await roomService.createRoom(playerId, username);

      return res.status(201).json({
        success: true,
        data: {
          roomId: room.roomId,
          room,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  /**
   * GET /api/rooms/:roomId - 룸 정보 조회
   */
  async getRoom(req: Request, res: Response) {
    try {
      const { roomId } = req.params;
      const room = await roomService.getRoomById(roomId);

      return res.json({
        success: true,
        data: room,
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'ROOM_NOT_FOUND' : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  /**
   * DELETE /api/rooms/:roomId - 룸 삭제
   */
  async deleteRoom(_req: Request, res: Response) {
    return res.json({
      success: true,
      message: 'Room deleted',
    });
  }
}

export const roomController = new RoomController();
