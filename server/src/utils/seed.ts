import { Character } from '../models/Character.model';
import { Card } from '../models/Card.model';
import logger from '../utils/logger';

/**
 * 데이터베이스에 초기 캐릭터 및 카드 데이터 삽입
 */
export const seedDatabase = async () => {
  try {
    // 기존 데이터 확인
    const characterCount = await Character.countDocuments();
    const cardCount = await Card.countDocuments();

    if (characterCount > 0 && cardCount > 0) {
      logger.info(`Database already seeded. ${characterCount} characters, ${cardCount} cards exist.`);
      return;
    }

    logger.info('Seeding database...');

    // 기존 데이터 삭제 (깔끔하게 시작)
    await Character.deleteMany({});
    await Card.deleteMany({});

    // 공통 카드 생성
    const commonCards = await Card.insertMany([
      // 이동 카드
      {
        cardId: 'MOVE_UP',
        name: '위로 이동',
        type: 'movement',
        energyCost: 0,
        movement: { x: 0, y: -1 },
        pattern: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
        description: '위로 1칸 이동합니다.',
        isCommon: true,
      },
      {
        cardId: 'MOVE_DOWN',
        name: '아래로 이동',
        type: 'movement',
        energyCost: 0,
        movement: { x: 0, y: 1 },
        pattern: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
        description: '아래로 1칸 이동합니다.',
        isCommon: true,
      },
      {
        cardId: 'MOVE_LEFT',
        name: '왼쪽으로 이동',
        type: 'movement',
        energyCost: 0,
        movement: { x: -1, y: 0 },
        pattern: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
        description: '왼쪽으로 1칸 이동합니다.',
        isCommon: true,
      },
      {
        cardId: 'MOVE_RIGHT',
        name: '오른쪽으로 이동',
        type: 'movement',
        energyCost: 0,
        movement: { x: 1, y: 0 },
        pattern: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
        description: '오른쪽으로 1칸 이동합니다.',
        isCommon: true,
      },
      // 유틸리티 카드
      {
        cardId: 'ENERGY_RESTORE',
        name: '에너지 회복',
        type: 'utility',
        energyCost: -15,
        pattern: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
        description: '에너지를 15 회복합니다.',
        isCommon: true,
      },
      {
        cardId: 'SHIELD',
        name: '방어막',
        type: 'utility',
        energyCost: 0,
        defense: 15,
        pattern: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
        description: '다음 공격의 데미지를 15 감소시킵니다.',
        isCommon: true,
      },
    ]);

    // 공격 카드 생성 (캐릭터별)
    const attackCards = await Card.insertMany([
      {
        cardId: 'ATK_AREA_3X3',
        name: '광역 공격',
        type: 'attack',
        energyCost: 30,
        damage: 10,
        pattern: [[1, 1, 1], [1, 0, 1], [1, 1, 1]],
        description: '주변 3x3 범위에 10의 데미지를 입힙니다.',
        isCommon: false,
      },
      {
        cardId: 'ATK_DIAGONAL',
        name: '대각선 공격',
        type: 'attack',
        energyCost: 20,
        damage: 20,
        pattern: [[1, 0, 1], [0, 0, 0], [1, 0, 1]],
        description: '대각선 방향에 20의 데미지를 입힙니다.',
        isCommon: false,
      },
      {
        cardId: 'ATK_CROSS',
        name: '십자 공격',
        type: 'attack',
        energyCost: 20,
        damage: 20,
        pattern: [[0, 1, 0], [1, 0, 1], [0, 1, 0]],
        description: '십자 방향에 20의 데미지를 입힙니다.',
        isCommon: false,
      },
      {
        cardId: 'ATK_HORIZONTAL',
        name: '가로 공격',
        type: 'attack',
        energyCost: 15,
        damage: 15,
        pattern: [[0, 0, 0], [1, 0, 1], [0, 0, 0]],
        description: '좌우 방향에 15의 데미지를 입힙니다.',
        isCommon: false,
      },
      {
        cardId: 'ATK_VERTICAL',
        name: '세로 공격',
        type: 'attack',
        energyCost: 15,
        damage: 15,
        pattern: [[0, 1, 0], [0, 0, 0], [0, 1, 0]],
        description: '상하 방향에 15의 데미지를 입힙니다.',
        isCommon: false,
      },
      {
        cardId: 'ATK_FORWARD',
        name: '직선 강타',
        type: 'attack',
        energyCost: 25,
        damage: 35,
        pattern: [[0, 1, 0], [0, 0, 0], [0, 0, 0]],
        description: '정면에 35의 강력한 데미지를 입힙니다.',
        isCommon: false,
      },
    ]);

    // 캐릭터 생성
    const characters = await Character.insertMany([
      {
        characterId: 'WARRIOR',
        name: '전사',
        description: '균형잡힌 공격과 방어를 가진 캐릭터',
        baseHealth: 100,
        baseEnergy: 100,
        attackCards: ['ATK_AREA_3X3', 'ATK_CROSS', 'ATK_HORIZONTAL', 'ATK_FORWARD'],
        isActive: true,
      },
      {
        characterId: 'MAGE',
        name: '마법사',
        description: '강력한 광역 공격에 특화된 캐릭터',
        baseHealth: 100,
        baseEnergy: 100,
        attackCards: ['ATK_AREA_3X3', 'ATK_DIAGONAL', 'ATK_CROSS', 'ATK_VERTICAL'],
        isActive: true,
      },
      {
        characterId: 'ASSASSIN',
        name: '암살자',
        description: '빠르고 치명적인 단일 공격에 특화된 캐릭터',
        baseHealth: 100,
        baseEnergy: 100,
        attackCards: ['ATK_FORWARD', 'ATK_DIAGONAL', 'ATK_HORIZONTAL', 'ATK_VERTICAL'],
        isActive: true,
      },
    ]);

    logger.info(`Database seeded successfully: ${characters.length} characters, ${commonCards.length + attackCards.length} cards`);
  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  }
};
