import { Router } from 'express';
import { gameController } from '../controllers/game.controller';

const router = Router();

router.get('/characters', gameController.getCharacters.bind(gameController));
router.get('/cards', gameController.getCards.bind(gameController));
router.get('/cards/common', gameController.getCommonCards.bind(gameController));
router.get('/cards/attack', gameController.getAttackCards.bind(gameController));

export default router;
