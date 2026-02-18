import { Request, Response } from 'express';
import { Character } from '../models/Character.model';
import { Card } from '../models/Card.model';

export class GameController {
  /**
   * GET /api/characters - 모든 캐릭터 조회
   */
  async getCharacters(_req: Request, res: Response) {
    try {
      const characters = await Character.find({ isActive: true });

      return res.json({
        success: true,
        data: characters,
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
   * GET /api/cards - 모든 카드 조회
   */
  async getCards(_req: Request, res: Response) {
    try {
      const cards = await Card.find();

      return res.json({
        success: true,
        data: cards,
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
   * GET /api/cards/common - 공통 카드 조회
   */
  async getCommonCards(_req: Request, res: Response) {
    try {
      const cards = await Card.find({ isCommon: true });

      return res.json({
        success: true,
        data: cards,
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
   * GET /api/cards/attack - 공격 카드 조회
   */
  async getAttackCards(_req: Request, res: Response) {
    try {
      const cards = await Card.find({ type: 'attack', isCommon: false });

      return res.json({
        success: true,
        data: cards,
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
}

export const gameController = new GameController();
