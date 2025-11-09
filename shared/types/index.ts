// ========================================
// 기본 게임 타입
// ========================================

export type Position = {
  x: number; // 0-3 (가로 4칸)
  y: number; // 0-2 (세로 3칸)
};

export type PlayerId = string;

// ========================================
// 카드 타입
// ========================================

export enum CardType {
  // 이동 카드 (우선순위 1)
  MOVE_UP = 'MOVE_UP',
  MOVE_DOWN = 'MOVE_DOWN',
  MOVE_LEFT = 'MOVE_LEFT',
  MOVE_RIGHT = 'MOVE_RIGHT',

  // 방어 카드 (우선순위 2)
  DEFEND = 'DEFEND',

  // 에너지 회복 카드 (우선순위 3)
  ENERGY_RECOVERY = 'ENERGY_RECOVERY',

  // 공격 카드 (우선순위 3)
  ATTACK_CROSS = 'ATTACK_CROSS', // 십자 공격
  ATTACK_FORWARD = 'ATTACK_FORWARD', // 전방 공격
  ATTACK_AREA = 'ATTACK_AREA', // 광역 공격
  ATTACK_DIAGONAL = 'ATTACK_DIAGONAL', // 대각선 공격
}

export enum CardPriority {
  MOVE = 1,
  DEFEND = 2,
  ATTACK_ENERGY = 3,
}

export type CardDefinition = {
  type: CardType;
  name: string;
  priority: CardPriority;
  energyCost: number;
  description: string;
  // 공격 카드 전용
  damage?: number;
  attackPattern?: Position[]; // 상대적 위치 패턴
  // 에너지 회복 전용
  energyRecovery?: number;
  // 방어 카드 전용
  defenseAmount?: number;
};

// ========================================
// 캐릭터 타입
// ========================================

export type CharacterStats = {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
};

export type Character = {
  playerId: PlayerId;
  stats: CharacterStats;
  position: Position;
  deck: CardType[]; // 보유한 카드 타입들
  defenseActive: boolean; // 이번 턴 방어 중인지
  defenseAmount: number; // 방어 수치
};

// ========================================
// 게임 상태 타입
// ========================================

export enum GamePhase {
  WAITING = 'WAITING', // 대기 중
  PREPARATION = 'PREPARATION', // 카드 준비 페이즈
  BATTLE = 'BATTLE', // 전투 페이즈
  ENDED = 'ENDED', // 게임 종료
}

export enum GameResult {
  PLAYER1_WIN = 'PLAYER1_WIN',
  PLAYER2_WIN = 'PLAYER2_WIN',
  DRAW = 'DRAW',
}

export type CardSelection = [CardType, CardType, CardType]; // 3장 선택

export type GameState = {
  phase: GamePhase;
  round: number;
  player1: Character;
  player2: Character;
  player1Selection: CardSelection | null;
  player2Selection: CardSelection | null;
  player1Ready: boolean;
  player2Ready: boolean;
  result: GameResult | null;
};

// ========================================
// 전투 이벤트 타입
// ========================================

export enum BattleEventType {
  CARD_REVEAL = 'CARD_REVEAL', // 카드 공개
  MOVE = 'MOVE',
  DEFEND = 'DEFEND',
  ATTACK = 'ATTACK',
  ENERGY_RECOVERY = 'ENERGY_RECOVERY',
  DAMAGE_DEALT = 'DAMAGE_DEALT',
  GAME_END = 'GAME_END',
}

export type BattleEvent = {
  type: BattleEventType;
  playerId: PlayerId;
  data: any; // 이벤트별 데이터
  cardIndex?: number; // 어느 카드(0,1,2)에서 발생한 이벤트인지
};

// ========================================
// Socket.IO 이벤트 타입
// ========================================

export type ClientToServerEvents = {
  joinMatchmaking: () => void;
  selectCards: (cards: CardSelection) => void;
  ready: () => void;
};

export type ServerToClientEvents = {
  matchFound: (gameState: GameState) => void;
  gameStateUpdate: (gameState: GameState) => void;
  battleEvents: (events: BattleEvent[]) => void;
  error: (message: string) => void;
};
