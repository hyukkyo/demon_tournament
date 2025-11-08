import {
  CardType,
  CardPriority,
  CardDefinition,
  Position,
} from '../../../../shared/types';

// 카드별 상세 정의
export const CARD_DEFINITIONS: Record<CardType, CardDefinition> = {
  // ========================================
  // 이동 카드 (우선순위 1, 에너지 0)
  // ========================================
  [CardType.MOVE_UP]: {
    type: CardType.MOVE_UP,
    name: '위로 이동',
    priority: CardPriority.MOVE,
    energyCost: 0,
    description: '캐릭터를 위로 1칸 이동',
  },
  [CardType.MOVE_DOWN]: {
    type: CardType.MOVE_DOWN,
    name: '아래로 이동',
    priority: CardPriority.MOVE,
    energyCost: 0,
    description: '캐릭터를 아래로 1칸 이동',
  },
  [CardType.MOVE_LEFT]: {
    type: CardType.MOVE_LEFT,
    name: '왼쪽으로 이동',
    priority: CardPriority.MOVE,
    energyCost: 0,
    description: '캐릭터를 왼쪽으로 1칸 이동',
  },
  [CardType.MOVE_RIGHT]: {
    type: CardType.MOVE_RIGHT,
    name: '오른쪽으로 이동',
    priority: CardPriority.MOVE,
    energyCost: 0,
    description: '캐릭터를 오른쪽으로 1칸 이동',
  },

  // ========================================
  // 방어 카드 (우선순위 2)
  // ========================================
  [CardType.DEFEND]: {
    type: CardType.DEFEND,
    name: '방어',
    priority: CardPriority.DEFEND,
    energyCost: 10,
    defenseAmount: 15,
    description: '이번 턴에 받는 데미지를 15 감소',
  },

  // ========================================
  // 에너지 회복 카드 (우선순위 3)
  // ========================================
  [CardType.ENERGY_RECOVERY]: {
    type: CardType.ENERGY_RECOVERY,
    name: '에너지 회복',
    priority: CardPriority.ATTACK_ENERGY,
    energyCost: 0,
    energyRecovery: 30,
    description: '에너지를 30 회복 (최대 100)',
  },

  // ========================================
  // 공격 카드 (우선순위 3)
  // ========================================
  [CardType.ATTACK_CROSS]: {
    type: CardType.ATTACK_CROSS,
    name: '십자 공격',
    priority: CardPriority.ATTACK_ENERGY,
    energyCost: 20,
    damage: 30,
    // 자신 중심으로 상하좌우 1칸
    attackPattern: [
      { x: 0, y: -1 }, // 위
      { x: 0, y: 1 }, // 아래
      { x: -1, y: 0 }, // 왼쪽
      { x: 1, y: 0 }, // 오른쪽
    ],
    description: '상하좌우 1칸 공격, 위력 30, 에너지 20',
  },
  [CardType.ATTACK_FORWARD]: {
    type: CardType.ATTACK_FORWARD,
    name: '전방 공격',
    priority: CardPriority.ATTACK_ENERGY,
    energyCost: 15,
    damage: 25,
    // 앞쪽 3칸 (좌우 포함)
    attackPattern: [
      { x: 1, y: -1 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ],
    description: '앞쪽 3칸 공격, 위력 25, 에너지 15',
  },
  [CardType.ATTACK_AREA]: {
    type: CardType.ATTACK_AREA,
    name: '광역 공격',
    priority: CardPriority.ATTACK_ENERGY,
    energyCost: 40,
    damage: 20,
    // 3x3 전체
    attackPattern: [
      { x: -1, y: -1 },
      { x: 0, y: -1 },
      { x: 1, y: -1 },
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    description: '3x3 전체 공격, 위력 20, 에너지 40',
  },
  [CardType.ATTACK_DIAGONAL]: {
    type: CardType.ATTACK_DIAGONAL,
    name: '대각선 공격',
    priority: CardPriority.ATTACK_ENERGY,
    energyCost: 25,
    damage: 28,
    // 대각선 4방향
    attackPattern: [
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: -1, y: 1 },
      { x: 1, y: 1 },
    ],
    description: '대각선 4방향 공격, 위력 28, 에너지 25',
  },
};

// 기본 덱 구성 (공통 카드 6장 + 고유 공격 카드 4장)
export const DEFAULT_DECK: CardType[] = [
  CardType.MOVE_UP,
  CardType.MOVE_DOWN,
  CardType.MOVE_LEFT,
  CardType.MOVE_RIGHT,
  CardType.DEFEND,
  CardType.ENERGY_RECOVERY,
  CardType.ATTACK_CROSS,
  CardType.ATTACK_FORWARD,
  CardType.ATTACK_AREA,
  CardType.ATTACK_DIAGONAL,
];

// 카드 정의 조회 헬퍼 함수
export function getCardDefinition(cardType: CardType): CardDefinition {
  return CARD_DEFINITIONS[cardType];
}

// 카드 사용 가능 여부 검증
export function canUseCard(
  cardType: CardType,
  currentEnergy: number,
  usedCards: CardType[]
): { canUse: boolean; reason?: string } {
  const card = getCardDefinition(cardType);

  // 중복 사용 체크
  if (usedCards.includes(cardType)) {
    return { canUse: false, reason: '이미 사용한 카드입니다' };
  }

  // 에너지 체크
  if (currentEnergy < card.energyCost) {
    return { canUse: false, reason: '에너지가 부족합니다' };
  }

  return { canUse: true };
}
