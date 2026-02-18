import { Room, IRoom } from '../models/Room.model';
import { Card } from '../models/Card.model';
import { NotFoundError, BadRequestError } from '../utils/errors';
import logger from '../utils/logger';

export class GameService {
  /**
   * 양쪽 플레이어의 현재 카드 실행
   */
  async executeBothCards(roomId: string): Promise<IRoom> {
    const room = await Room.findOne({ roomId });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (room.status !== 'battle') {
      throw new BadRequestError('Not in battle phase');
    }

    if (room.players.length !== 2) {
      throw new BadRequestError('Need 2 players to execute cards');
    }

    const [player1, player2] = room.players;
    const cardIndex = room.currentCardIndex;

    if (cardIndex >= 3) {
      throw new BadRequestError('All cards have been executed');
    }

    logger.info(`Executing card ${cardIndex} for both players in room ${roomId}`);

    // 양쪽 카드 가져오기
    const card1Id = player1.selectedCards[cardIndex];
    const card2Id = player2.selectedCards[cardIndex];

    const [card1, card2] = await Promise.all([
      Card.findOne({ cardId: new RegExp(`^${card1Id}$`, 'i') }),
      Card.findOne({ cardId: new RegExp(`^${card2Id}$`, 'i') }),
    ]);

    if (!card1 || !card2) {
      throw new NotFoundError('One or both cards not found');
    }

    // 1단계: 이동 카드 먼저 실행 (동시에)
    if (card1.type === 'movement') {
      this.applyMovement(player1, card1);
      player1.energy += card1.energyCost;
    }
    if (card2.type === 'movement') {
      this.applyMovement(player2, card2);
      player2.energy += card2.energyCost;
    }

    // 2단계: 공격 카드 실행 (순서대로, 이동 후 위치 기준)
    if (card1.type === 'attack') {
      this.applyAttack(player1, player2, card1);
      player1.energy += card1.energyCost;
    }
    if (card2.type === 'attack') {
      this.applyAttack(player2, player1, card2);
      player2.energy += card2.energyCost;
    }

    // 3단계: 유틸리티 카드 실행
    if (card1.type === 'utility') {
      this.applyUtility(player1, card1);
      player1.energy += card1.energyCost;
    }
    if (card2.type === 'utility') {
      this.applyUtility(player2, card2);
      player2.energy += card2.energyCost;
    }

    // 에너지 범위 제한
    player1.energy = Math.max(0, Math.min(100, player1.energy));
    player2.energy = Math.max(0, Math.min(100, player2.energy));

    // 승자 확인
    const gameFinished = player1.health <= 0 || player2.health <= 0;

    if (gameFinished) {
      room.status = 'finished';
      if (player1.health <= 0 && player2.health <= 0) {
        room.winner = 'draw';
      } else if (player1.health <= 0) {
        room.winner = player2.playerId;
      } else {
        room.winner = player1.playerId;
      }
      logger.info(`Game finished in room ${roomId}. Winner: ${room.winner}`);
    } else {
      // 다음 카드로
      room.currentCardIndex += 1;
      
      // 모든 카드를 사용했으면 다음 라운드
      if (room.currentCardIndex >= 3) {
        room.status = 'card_select';
        room.currentRound += 1;
        room.currentCardIndex = 0;
        room.players.forEach((p) => {
          p.selectedCards = [];
          p.isReady = false;
        });
        logger.info(`Round ${room.currentRound} started in room ${roomId}`);
      }
    }

    await room.save();
    logger.info(`Cards executed. P1: ${player1.health}HP/${player1.energy}E, P2: ${player2.health}HP/${player2.energy}E`);
    return room;
  }

  /**
   * 카드 실행 (단일 플레이어용 - 기존 호환성 유지)
   */
  async executeCard(roomId: string, playerId: string): Promise<IRoom> {
    const room = await Room.findOne({ roomId });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (room.status !== 'battle') {
      throw new BadRequestError('Not in battle phase');
    }

    const playerIndex = room.players.findIndex((p) => p.playerId === playerId);
    if (playerIndex === -1) {
      throw new NotFoundError('Player not found in room');
    }

    const player = room.players[playerIndex];
    const opponentIndex = playerIndex === 0 ? 1 : 0;
    const opponent = room.players[opponentIndex];

    // 현재 카드 인덱스 가져오기
    const cardIndex = room.currentCardIndex;
    if (cardIndex >= player.selectedCards.length) {
      throw new BadRequestError('No more cards to execute');
    }

    // 카드 정보 가져오기
    const cardId = player.selectedCards[cardIndex];
    const card = await Card.findOne({ cardId: new RegExp(`^${cardId}$`, 'i') });

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    logger.info(`Executing card ${cardId} for player ${playerId} in room ${roomId}`);

    // 카드 타입에 따라 효과 적용
    switch (card.type) {
      case 'movement':
        this.applyMovement(player, card);
        break;
      case 'attack':
        this.applyAttack(player, opponent, card);
        break;
      case 'utility':
        this.applyUtility(player, card);
        break;
    }

    // 에너지 소모/회복
    player.energy += card.energyCost;
    player.energy = Math.max(0, Math.min(100, player.energy)); // 0-100 범위로 제한

    await room.save();
    logger.info(`Card executed. Player health: ${player.health}, energy: ${player.energy}`);
    return room;
  }

  /**
   * 다음 카드로 진행
   */
  async nextCard(roomId: string): Promise<IRoom> {
    const room = await Room.findOne({ roomId });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    room.currentCardIndex += 1;

    // 모든 카드를 사용했으면 다음 라운드 또는 게임 종료
    if (room.currentCardIndex >= 3) {
      // 승자 확인
      const player1 = room.players[0];
      const player2 = room.players[1];

      if (player1.health <= 0 || player2.health <= 0) {
        room.status = 'finished';
        if (player1.health <= 0 && player2.health <= 0) {
          room.winner = 'draw';
        } else if (player1.health <= 0) {
          room.winner = player2.playerId;
        } else {
          room.winner = player1.playerId;
        }
        logger.info(`Game finished in room ${roomId}. Winner: ${room.winner}`);
      } else {
        // 다음 라운드로 (카드 선택 단계로 복귀)
        room.status = 'card_select';
        room.currentRound += 1;
        room.currentCardIndex = 0;
        room.players.forEach((p) => {
          p.selectedCards = [];
          p.isReady = false;
        });
        logger.info(`Round ${room.currentRound} started in room ${roomId}`);
      }
    }

    await room.save();
    return room;
  }

  /**
   * 이동 카드 적용
   */
  private applyMovement(player: any, card: any): void {
    if (!card.movement) return;

    const newX = player.position.x + card.movement.x;
    const newY = player.position.y + card.movement.y;

    // 필드 범위 체크 (4x3)
    if (newX >= 0 && newX < 4 && newY >= 0 && newY < 3) {
      player.position.x = newX;
      player.position.y = newY;
      logger.info(`Player moved to (${newX}, ${newY})`);
    } else {
      logger.info(`Movement blocked: out of bounds (${newX}, ${newY})`);
    }
  }

  /**
   * 공격 카드 적용
   */
  private applyAttack(player: any, opponent: any, card: any): void {
    if (!card.damage || !card.pattern) return;

    // 공격 패턴 확인 (3x3)
    const dx = opponent.position.x - player.position.x;
    const dy = opponent.position.y - player.position.y;

    // 패턴은 플레이어를 중심으로 3x3 (중앙이 [1][1])
    const patternX = dx + 1;
    const patternY = dy + 1;

    // 범위 체크
    if (patternX >= 0 && patternX < 3 && patternY >= 0 && patternY < 3) {
      if (card.pattern[patternY][patternX] === 1) {
        // 방어력 적용 (유틸리티 카드로 설정된 defense 값)
        const defense = opponent.defense || 0;
        const finalDamage = Math.max(0, card.damage - defense);
        
        opponent.health -= finalDamage;
        opponent.defense = 0; // 방어막은 1회용
        
        logger.info(`Attack hit! Damage: ${finalDamage} (base: ${card.damage}, defense: ${defense})`);
      } else {
        logger.info(`Attack missed: opponent not in attack pattern`);
      }
    } else {
      logger.info(`Attack missed: opponent out of range`);
    }
  }

  /**
   * 유틸리티 카드 적용
   */
  private applyUtility(player: any, card: any): void {
    // 에너지는 이미 energyCost로 처리됨
    
    // 방어막
    if (card.defense) {
      player.defense = (player.defense || 0) + card.defense;
      logger.info(`Defense increased by ${card.defense}, total: ${player.defense}`);
    }

    // 힐링
    if (card.healing) {
      player.health += card.healing;
      player.health = Math.min(100, player.health); // 최대 100
      logger.info(`Healed ${card.healing}, health: ${player.health}`);
    }
  }
}

export const gameService = new GameService();
