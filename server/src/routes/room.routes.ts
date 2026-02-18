import { Router } from 'express';
import { roomController } from '../controllers/room.controller';

const router = Router();

// 룸 생성
router.post('/rooms', (req, res) => roomController.createRoom(req, res));

// 룸 조회
router.get('/rooms/:roomId', (req, res) => roomController.getRoom(req, res));

// 룸 삭제
router.delete('/rooms/:roomId', (req, res) => roomController.deleteRoom(req, res));

export default router;
