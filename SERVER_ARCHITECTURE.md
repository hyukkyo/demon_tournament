# 서버 아키텍처 상세 문서

## 목차
1. [아키텍처 개요](#아키텍처-개요)
2. [디렉토리 구조](#디렉토리-구조)
3. [핵심 모듈 상세](#핵심-모듈-상세)
4. [게임 로직 흐름](#게임-로직-흐름)
5. [Socket.IO 이벤트](#socketio-이벤트)

---

## 아키텍처 개요

### 설계 원칙

**서버 중심 로직 (Server-Authoritative)**
- 모든 게임 규칙의 판정과 계산은 서버에서만 수행
- 클라이언트는 UI 표시와 입력 전송만 담당
- 이유: 클라이언트 측 위변조 방지, 게임 공정성 확보

### 레이어 구조

```
┌─────────────────────────────────────┐
│   Socket.IO Handler Layer          │  ← 클라이언트 통신
│   (socket/gameHandler.ts)          │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│   Service Layer                     │  ← 비즈니스 로직
│   - MatchmakingService              │
│   - GameRoom                        │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│   Game Logic Layer                  │  ← 게임 엔진
│   - GameEngine                      │
│   - BattleField                     │
│   - Cards                           │
└─────────────────────────────────────┘
```

---

## 디렉토리 구조

```
server/src/
├── game/                       # 게임 로직 (순수 TypeScript)
│   ├── models/                 # 데이터 모델
│   │   ├── cards.ts           # 카드 정의 및 헬퍼 함수
│   │   └── BattleField.ts     # 전투 필드 관리
│   └── engine/                 # 게임 엔진
│       └── GameEngine.ts      # 전투 시뮬레이션 엔진
│
├── services/                   # 비즈니스 로직
│   ├── GameRoom.ts            # 게임 룸 (1 게임 = 1 룸)
│   └── MatchmakingService.ts  # 매칭 시스템
│
├── socket/                     # Socket.IO 관련
│   └── gameHandler.ts         # 이벤트 핸들러
│
└── index.ts                    # 서버 엔트리포인트
```

---

## 핵심 모듈 상세

### 1. index.ts (서버 엔트리포인트)

```typescript
import express from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { setupGameHandlers } from './socket/gameHandler'
import { MatchmakingService } from './services/MatchmakingService'

const app = express()
const server = http.createServer(app)
const io = new SocketIOServer(server, {
  cors: { origin: '*' }  // CORS 허용 (개발 환경)
})

// 전역 매칭 서비스 (싱글톤)
export const matchmakingService = new MatchmakingService()

// Socket.IO 연결 처리
io.on('connection', (socket) => {
  console.log('플레이어 연결:', socket.id)

  // 게임 이벤트 핸들러 등록
  setupGameHandlers(io, socket)

  socket.on('disconnect', () => {
    console.log('플레이어 연결 해제:', socket.id)
  })
})

server.listen(3000, () => {
  console.log('서버 실행: http://localhost:3000')
})
```

**역할:**
- Express 서버 생성
- Socket.IO 서버 초기화
- CORS 설정
- 매칭 서비스 싱글톤 생성
- Socket 연결 관리

---

### 2. game/models/cards.ts (카드 정의)

```typescript
import { CardType, CardDefinition, CardPriority, Position } from '../../../shared/types'

// 모든 카드 정의
export const CARD_DEFINITIONS: Record<CardType, CardDefinition> = {
  // 이동 카드 (에너지 0)
  [CardType.MOVE_UP]: {
    type: CardType.MOVE_UP,
    name: '위로 이동',
    priority: CardPriority.MOVE,
    energyCost: 0,
    description: '한 칸 위로 이동',
  },
  // ... 나머지 이동 카드 (DOWN, LEFT, RIGHT)

  // 방어 카드 (에너지 10)
  [CardType.DEFEND]: {
    type: CardType.DEFEND,
    name: '방어',
    priority: CardPriority.DEFEND,
    energyCost: 10,
    description: '이번 턴 데미지 15 감소',
    defenseAmount: 15,
  },

  // 에너지 회복 카드 (에너지 0)
  [CardType.ENERGY_RECOVERY]: {
    type: CardType.ENERGY_RECOVERY,
    name: '에너지 회복',
    priority: CardPriority.ATTACK_ENERGY,
    energyCost: 0,
    description: '에너지 30 회복',
    energyRecovery: 30,
  },

  // 공격 카드들
  [CardType.ATTACK_CROSS]: {
    type: CardType.ATTACK_CROSS,
    name: '십자 공격',
    priority: CardPriority.ATTACK_ENERGY,
    energyCost: 20,
    description: '상하좌우 1칸 공격',
    damage: 30,
    attackPattern: [
      { x: 0, y: -1 },  // 위
      { x: 0, y: 1 },   // 아래
      { x: -1, y: 0 },  // 왼쪽
      { x: 1, y: 0 },   // 오른쪽
    ],
  },

  [CardType.ATTACK_FORWARD]: {
    type: CardType.ATTACK_FORWARD,
    name: '전방 공격',
    priority: CardPriority.ATTACK_ENERGY,
    energyCost: 15,
    description: '앞쪽 3칸 공격',
    damage: 25,
    attackPattern: [
      { x: 1, y: -1 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ],
  },

  [CardType.ATTACK_AREA]: {
    type: CardType.ATTACK_AREA,
    name: '광역 공격',
    priority: CardPriority.ATTACK_ENERGY,
    energyCost: 40,
    description: '주변 8칸 전체 공격',
    damage: 20,
    attackPattern: [
      { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
      { x: -1, y: 0 },                    { x: 1, y: 0 },
      { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 },
    ],
  },

  [CardType.ATTACK_DIAGONAL]: {
    type: CardType.ATTACK_DIAGONAL,
    name: '대각선 공격',
    priority: CardPriority.ATTACK_ENERGY,
    energyCost: 25,
    description: '대각선 4방향 공격',
    damage: 28,
    attackPattern: [
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: -1, y: 1 },
      { x: 1, y: 1 },
    ],
  },
}

// 헬퍼 함수
export function getCardDefinition(cardType: CardType): CardDefinition {
  return CARD_DEFINITIONS[cardType]
}
```

**역할:**
- 10가지 카드 타입 정의
- 각 카드의 속성 (비용, 데미지, 우선순위 등) 관리
- 공격 카드의 공격 패턴 정의

**공격 패턴 좌표계:**
- 공격자 기준 상대 좌표
- Player1: 왼쪽(0,1) → 오른쪽 공격 = `{ x: 1, y: 0 }`
- Player2: 오른쪽(3,1) → 왼쪽 공격 = `{ x: -1, y: 0 }`

---

### 3. game/models/BattleField.ts (전투 필드)

```typescript
import { Position } from '../../../shared/types'

export class BattleField {
  static readonly WIDTH = 4   // 가로 4칸
  static readonly HEIGHT = 3  // 세로 3칸

  // 위치가 필드 범위 내인지 검증
  static isValidPosition(pos: Position): boolean {
    return (
      pos.x >= 0 &&
      pos.x < this.WIDTH &&
      pos.y >= 0 &&
      pos.y < this.HEIGHT
    )
  }

  // 두 위치가 같은지 비교
  static isSamePosition(pos1: Position, pos2: Position): boolean {
    return pos1.x === pos2.x && pos1.y === pos2.y
  }

  // 초기 플레이어 위치 반환
  static getInitialPosition(isPlayer1: boolean): Position {
    return isPlayer1
      ? { x: 0, y: 1 }  // Player1: 왼쪽 중앙
      : { x: 3, y: 1 }  // Player2: 오른쪽 중앙
  }
}
```

**역할:**
- 필드 크기 정의 (4x3)
- 위치 유효성 검증
- 초기 플레이어 배치

**좌표계:**
```
     x: 0   1   2   3
y: 0  ┌───┬───┬───┬───┐
y: 1  │P1 │   │   │P2 │  ← 초기 위치
y: 2  └───┴───┴───┴───┘
```

---

### 4. game/engine/GameEngine.ts (게임 엔진)

게임의 핵심 로직을 담당합니다.

#### 주요 메서드:

##### `validateCardSelection(player, cards)`
카드 선택의 유효성을 검증합니다.

```typescript
validateCardSelection(player: Character, cards: CardSelection): {
  valid: boolean
  reason?: string
} {
  // 1. 에너지 체크
  let totalCost = 0
  for (const cardType of cards) {
    const def = getCardDefinition(cardType)
    totalCost += def.energyCost

    if (totalCost > player.stats.energy) {
      return { valid: false, reason: '에너지 부족' }
    }
  }

  // 2. 중복 체크
  const usedCards = new Set<CardType>()
  for (const cardType of cards) {
    if (usedCards.has(cardType)) {
      return { valid: false, reason: '같은 카드 중복 선택 불가' }
    }
    usedCards.add(cardType)
  }

  return { valid: true }
}
```

---

##### `simulateBattle(gameState)`
전투 시뮬레이션을 실행합니다.

```typescript
simulateBattle(gameState: GameState): {
  events: BattleEvent[]
  newState: GameState
} {
  const events: BattleEvent[] = []
  const newState = JSON.parse(JSON.stringify(gameState))  // Deep copy

  // 3장의 카드를 순서대로 처리
  for (let i = 0; i < 3; i++) {
    const card1 = newState.player1Selection[i]
    const card2 = newState.player2Selection[i]

    // 방어 초기화 (매 카드마다)
    newState.player1.defenseActive = false
    newState.player1.defenseAmount = 0
    newState.player2.defenseActive = false
    newState.player2.defenseAmount = 0

    // 카드 우선순위별로 처리
    const roundEvents = this.processCardsByPriority(newState, card1, card2)
    events.push(...roundEvents)

    // 승패 판정
    const result = this.checkGameEnd(newState)
    if (result) {
      newState.result = result
      newState.phase = GamePhase.ENDED
      events.push({
        type: BattleEventType.GAME_END,
        playerId: '',
        data: { result },
      })
      break  // 게임 종료
    }
  }

  return { events, newState }
}
```

**흐름:**
1. 게임 상태 복사 (원본 보존)
2. 카드 3장 순차 처리
3. 각 카드마다:
   - 방어 초기화
   - 우선순위별 처리
   - 승패 판정
4. 결과 반환

---

##### `processCardsByPriority(state, card1, card2)`
카드를 우선순위에 따라 처리합니다.

```typescript
processCardsByPriority(
  state: GameState,
  card1: CardType,
  card2: CardType
): BattleEvent[] {
  const events: BattleEvent[] = []
  const def1 = getCardDefinition(card1)
  const def2 = getCardDefinition(card2)

  // 우선순위로 정렬
  const actions = [
    { playerId: state.player1.playerId, card: card1, priority: def1.priority },
    { playerId: state.player2.playerId, card: card2, priority: def2.priority },
  ].sort((a, b) => a.priority - b.priority)

  // 같은 우선순위끼리 그룹화하여 처리
  let currentPriority = actions[0].priority
  let sameGroupActions = []

  for (const action of actions) {
    if (action.priority === currentPriority) {
      sameGroupActions.push(action)
    } else {
      // 이전 우선순위 그룹 처리
      events.push(...this.processActionGroup(state, sameGroupActions))
      sameGroupActions = [action]
      currentPriority = action.priority
    }
  }

  // 마지막 그룹 처리
  if (sameGroupActions.length > 0) {
    events.push(...this.processActionGroup(state, sameGroupActions))
  }

  return events
}
```

**우선순위 처리 예시:**

```
입력: Player1 = MOVE_UP (우선순위 1)
     Player2 = ATTACK_CROSS (우선순위 3)

처리 순서:
1. [우선순위 1] Player1 이동
2. [우선순위 3] Player2 공격
```

```
입력: Player1 = ATTACK_CROSS (우선순위 3)
     Player2 = ATTACK_FORWARD (우선순위 3)

처리 순서:
1. [우선순위 3] Player1, Player2 동시 공격
   → 서로 데미지를 입음
```

---

##### `processActionGroup(state, actions)`
같은 우선순위의 액션들을 동시에 처리합니다.

```typescript
processActionGroup(
  state: GameState,
  actions: Array<{ playerId: string, card: CardType, priority: number }>
): BattleEvent[] {
  const events: BattleEvent[] = []

  for (const action of actions) {
    const player = this.getPlayer(state, action.playerId)
    const cardDef = getCardDefinition(action.card)

    // 에너지 소모
    player.stats.energy -= cardDef.energyCost

    // 카드 타입별 처리
    switch (cardDef.priority) {
      case CardPriority.MOVE:
        events.push(...this.processMove(state, player, action.card))
        break

      case CardPriority.DEFEND:
        events.push(...this.processDefend(state, player))
        break

      case CardPriority.ATTACK_ENERGY:
        if (cardDef.damage) {
          events.push(...this.processAttack(state, player, cardDef))
        } else if (cardDef.energyRecovery) {
          events.push(...this.processEnergyRecovery(state, player, cardDef))
        }
        break
    }
  }

  return events
}
```

---

##### 개별 카드 처리 메서드

**이동:**
```typescript
processMove(
  state: GameState,
  player: Character,
  cardType: CardType
): BattleEvent[] {
  let direction = ''
  let newPos = { ...player.position }

  switch (cardType) {
    case CardType.MOVE_UP:
      newPos.y -= 1
      direction = 'up'
      break
    case CardType.MOVE_DOWN:
      newPos.y += 1
      direction = 'down'
      break
    case CardType.MOVE_LEFT:
      newPos.x -= 1
      direction = 'left'
      break
    case CardType.MOVE_RIGHT:
      newPos.x += 1
      direction = 'right'
      break
  }

  // 범위 체크
  if (BattleField.isValidPosition(newPos)) {
    player.position = newPos
    return [{
      type: BattleEventType.MOVE,
      playerId: player.playerId,
      data: { direction, newPosition: newPos },
    }]
  }

  return []  // 이동 불가
}
```

**방어:**
```typescript
processDefend(state: GameState, player: Character): BattleEvent[] {
  player.defenseActive = true
  player.defenseAmount = 15

  return [{
    type: BattleEventType.DEFEND,
    playerId: player.playerId,
    data: { amount: 15 },
  }]
}
```

**공격:**
```typescript
processAttack(
  state: GameState,
  attacker: Character,
  cardDef: CardDefinition
): BattleEvent[] {
  const events: BattleEvent[] = []
  const target = this.getOpponent(state, attacker)

  // 공격 패턴 계산
  for (const pattern of cardDef.attackPattern!) {
    const absolutePos = {
      x: attacker.position.x + pattern.x,
      y: attacker.position.y + pattern.y,
    }

    // 적중 판정
    if (BattleField.isSamePosition(absolutePos, target.position)) {
      // HIT!
      events.push({
        type: BattleEventType.ATTACK,
        playerId: attacker.playerId,
        data: {
          cardType: cardDef.type,
          hit: true,
          targetPosition: target.position,
        },
      })

      // 데미지 계산
      let damage = cardDef.damage!
      if (target.defenseActive) {
        damage = Math.max(0, damage - target.defenseAmount)
      }

      target.stats.hp -= damage

      events.push({
        type: BattleEventType.DAMAGE_DEALT,
        playerId: target.playerId,
        data: {
          damage,
          newHp: target.stats.hp,
        },
      })

      return events
    }
  }

  // MISS
  events.push({
    type: BattleEventType.ATTACK,
    playerId: attacker.playerId,
    data: {
      cardType: cardDef.type,
      hit: false,
    },
  })

  return events
}
```

**에너지 회복:**
```typescript
processEnergyRecovery(
  state: GameState,
  player: Character,
  cardDef: CardDefinition
): BattleEvent[] {
  const amount = cardDef.energyRecovery!
  player.stats.energy = Math.min(
    player.stats.maxEnergy,
    player.stats.energy + amount
  )

  return [{
    type: BattleEventType.ENERGY_RECOVERY,
    playerId: player.playerId,
    data: {
      amount,
      newEnergy: player.stats.energy,
    },
  }]
}
```

---

##### `checkGameEnd(state)`
승패를 판정합니다.

```typescript
checkGameEnd(state: GameState): GameResult | null {
  const p1Dead = state.player1.stats.hp <= 0
  const p2Dead = state.player2.stats.hp <= 0

  if (p1Dead && p2Dead) {
    return GameResult.DRAW  // 무승부
  } else if (p1Dead) {
    return GameResult.PLAYER2_WIN
  } else if (p2Dead) {
    return GameResult.PLAYER1_WIN
  }

  return null  // 게임 진행 중
}
```

---

### 5. services/GameRoom.ts (게임 룸)

하나의 게임 세션을 관리합니다.

```typescript
export class GameRoom {
  private gameState: GameState
  private gameEngine: GameEngine

  constructor(player1Id: string, player2Id: string) {
    this.gameEngine = new GameEngine()

    // 초기 게임 상태 생성
    this.gameState = {
      phase: GamePhase.PREPARATION,
      round: 1,
      player1: this.createCharacter(player1Id, true),
      player2: this.createCharacter(player2Id, false),
      player1Selection: null,
      player2Selection: null,
      player1Ready: false,
      player2Ready: false,
      result: null,
    }
  }

  private createCharacter(playerId: string, isPlayer1: boolean): Character {
    return {
      playerId,
      stats: {
        hp: 100,
        maxHp: 100,
        energy: 100,
        maxEnergy: 100,
      },
      position: BattleField.getInitialPosition(isPlayer1),
      deck: [
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
      ],
      defenseActive: false,
      defenseAmount: 0,
    }
  }

  getState(): GameState {
    return this.gameState
  }

  selectCards(
    playerId: string,
    cards: CardSelection
  ): { success: boolean; reason?: string } {
    const isPlayer1 = playerId === this.gameState.player1.playerId
    const player = isPlayer1 ? this.gameState.player1 : this.gameState.player2

    // 유효성 검증
    const validation = this.gameEngine.validateCardSelection(player, cards)
    if (!validation.valid) {
      return { success: false, reason: validation.reason }
    }

    // 카드 선택 저장
    if (isPlayer1) {
      this.gameState.player1Selection = cards
      this.gameState.player1Ready = true
    } else {
      this.gameState.player2Selection = cards
      this.gameState.player2Ready = true
    }

    return { success: true }
  }

  canStartBattle(): boolean {
    return (
      this.gameState.player1Ready &&
      this.gameState.player2Ready &&
      this.gameState.phase === GamePhase.PREPARATION
    )
  }

  startBattle(): {
    events: BattleEvent[]
    newState: GameState
  } {
    this.gameState.phase = GamePhase.BATTLE

    const result = this.gameEngine.simulateBattle(this.gameState)
    this.gameState = result.newState

    return result
  }
}
```

**역할:**
- 게임 상태 관리
- 캐릭터 초기화
- 카드 선택 처리 (유효성 검증 포함)
- 전투 시작 조건 확인
- 게임 엔진 호출

---

### 6. services/MatchmakingService.ts (매칭 서비스)

플레이어 매칭을 관리합니다.

```typescript
export class MatchmakingService {
  private waitingPlayers: string[] = []
  private gameRooms: Map<string, GameRoom> = new Map()

  addPlayer(socketId: string): {
    matched: boolean
    opponentId?: string
    gameRoom?: GameRoom
  } {
    this.waitingPlayers.push(socketId)
    console.log(`[Matchmaking] ${socketId} 대기 중... (${this.waitingPlayers.length}명)`)

    // 2명 이상이면 매칭
    if (this.waitingPlayers.length >= 2) {
      const player1 = this.waitingPlayers.shift()!
      const player2 = this.waitingPlayers.shift()!

      console.log(`[Matchmaking] 매칭 성공: ${player1} vs ${player2}`)

      // 게임 룸 생성
      const gameRoom = new GameRoom(player1, player2)
      this.gameRooms.set(player1, gameRoom)
      this.gameRooms.set(player2, gameRoom)

      return {
        matched: true,
        opponentId: player2,
        gameRoom,
      }
    }

    return { matched: false }
  }

  getGameRoom(socketId: string): GameRoom | undefined {
    return this.gameRooms.get(socketId)
  }

  removePlayer(socketId: string): void {
    // 대기 큐에서 제거
    const index = this.waitingPlayers.indexOf(socketId)
    if (index > -1) {
      this.waitingPlayers.splice(index, 1)
    }

    // 게임 룸에서 제거
    this.gameRooms.delete(socketId)
  }
}
```

**역할:**
- 대기 큐 관리
- 2명 매칭 시 게임 룸 생성
- 플레이어-게임 룸 매핑 관리
- 플레이어 제거 처리

**매칭 흐름:**
```
Player1 → addPlayer()
  ↓
대기 큐에 추가 (1명)
  ↓
Player2 → addPlayer()
  ↓
대기 큐에 추가 (2명)
  ↓
매칭 성공!
  ↓
GameRoom 생성
  ↓
양쪽에 매칭 결과 전송
```

---

### 7. socket/gameHandler.ts (Socket.IO 핸들러)

클라이언트와의 통신을 처리합니다.

```typescript
import { Server, Socket } from 'socket.io'
import { matchmakingService } from '../index'
import { CardSelection } from '../../shared/types'

export function setupGameHandlers(io: Server, socket: Socket) {
  // 매칭 시작
  socket.on('joinMatchmaking', () => {
    console.log(`[${socket.id}] 매칭 시작`)

    const result = matchmakingService.addPlayer(socket.id)

    if (result.matched && result.gameRoom) {
      const player1Id = socket.id
      const player2Id = result.opponentId!

      // 양쪽에 매칭 성공 알림
      io.to(player1Id).emit('matchFound', result.gameRoom.getState())
      io.to(player2Id).emit('matchFound', result.gameRoom.getState())

      console.log(`[Matchmaking] ${player1Id} vs ${player2Id} 게임 시작`)
    }
  })

  // 카드 선택
  socket.on('selectCards', (cards: CardSelection) => {
    console.log(`[${socket.id}] 카드 선택:`, cards)

    const gameRoom = matchmakingService.getGameRoom(socket.id)
    if (!gameRoom) {
      socket.emit('error', '게임을 찾을 수 없습니다')
      return
    }

    // 카드 선택 처리
    const result = gameRoom.selectCards(socket.id, cards)
    if (!result.success) {
      socket.emit('error', result.reason || '카드 선택 실패')
      return
    }

    const gameState = gameRoom.getState()

    // 양쪽에 상태 업데이트 전송
    io.to(gameState.player1.playerId).emit('gameStateUpdate', gameState)
    io.to(gameState.player2.playerId).emit('gameStateUpdate', gameState)

    // 양쪽 모두 준비되면 전투 시작
    if (gameRoom.canStartBattle()) {
      console.log(`[${socket.id}] 전투 시작!`)

      const battleResult = gameRoom.startBattle()

      // 양쪽에 전투 이벤트 전송
      io.to(gameState.player1.playerId).emit('battleEvents', battleResult.events)
      io.to(gameState.player2.playerId).emit('battleEvents', battleResult.events)

      // 양쪽에 최종 상태 전송
      io.to(gameState.player1.playerId).emit('gameStateUpdate', battleResult.newState)
      io.to(gameState.player2.playerId).emit('gameStateUpdate', battleResult.newState)
    }
  })

  // 연결 해제
  socket.on('disconnect', () => {
    console.log(`[${socket.id}] 연결 해제`)
    matchmakingService.removePlayer(socket.id)
  })
}
```

**이벤트:**
1. `joinMatchmaking`: 매칭 요청
2. `selectCards`: 카드 선택
3. `disconnect`: 연결 해제

**전송 이벤트:**
1. `matchFound`: 매칭 성공
2. `gameStateUpdate`: 게임 상태 업데이트
3. `battleEvents`: 전투 이벤트
4. `error`: 에러 메시지

---

## 게임 로직 흐름

### 전체 시퀀스 다이어그램

```
클라이언트1    클라이언트2    서버              매칭서비스        게임룸          게임엔진
    │              │           │                    │              │               │
    │──joinMatchmaking─────────>│                   │              │               │
    │              │           │──addPlayer(1)───>│              │               │
    │              │           │<─waiting──────────│              │               │
    │              │           │                    │              │               │
    │              │──joinMatchmaking──>│           │              │               │
    │              │           │──addPlayer(2)───>│              │               │
    │              │           │<─matched, room────│              │               │
    │              │           │                    │              │               │
    │<─matchFound──────────────│                   │              │               │
    │              │<─matchFound───────│           │              │               │
    │              │           │                    │              │               │
    │──selectCards([A,B,C])──>│                   │              │               │
    │              │           │──────────selectCards(1, [A,B,C])─>│              │
    │              │           │                    │              │──validate──>│
    │              │           │                    │              │<─valid───────│
    │<─gameStateUpdate─────────│<──────────────────────getState()──│              │
    │              │<─gameStateUpdate──│           │              │               │
    │              │           │                    │              │               │
    │              │──selectCards([X,Y,Z])────────>│              │               │
    │              │           │──────────selectCards(2, [X,Y,Z])─>│              │
    │              │           │                    │              │──validate──>│
    │              │           │                    │              │<─valid───────│
    │<─gameStateUpdate─────────│<──────────────────────getState()──│              │
    │              │<─gameStateUpdate──│           │              │               │
    │              │           │                    │              │               │
    │              │           │──────────────────────startBattle()─>│            │
    │              │           │                    │              │─simulateBattle()─>│
    │              │           │                    │              │<─events, state────│
    │              │           │                    │              │               │
    │<─battleEvents────────────│<───────────────────────events─────│               │
    │              │<─battleEvents─────│           │              │               │
    │<─gameStateUpdate─────────│<───────────────────────newState───│               │
    │              │<─gameStateUpdate──│           │              │               │
```

---

## Socket.IO 이벤트

### 클라이언트 → 서버

| 이벤트 | 파라미터 | 설명 |
|--------|----------|------|
| `joinMatchmaking` | 없음 | 매칭 시작 요청 |
| `selectCards` | `CardSelection` | 카드 3장 선택 |

### 서버 → 클라이언트

| 이벤트 | 파라미터 | 설명 |
|--------|----------|------|
| `matchFound` | `GameState` | 매칭 성공, 초기 게임 상태 전송 |
| `gameStateUpdate` | `GameState` | 게임 상태 업데이트 |
| `battleEvents` | `BattleEvent[]` | 전투 이벤트 목록 |
| `error` | `string` | 에러 메시지 |

---

## 에러 처리

### 카드 선택 에러

```typescript
// 에너지 부족
{
  success: false,
  reason: '에너지가 부족합니다'
}

// 중복 선택
{
  success: false,
  reason: '같은 카드를 중복 선택할 수 없습니다'
}
```

### 게임 룸 에러

```typescript
// 게임 룸을 찾을 수 없음
socket.emit('error', '게임을 찾을 수 없습니다')
```

---

## 성능 최적화

### 1. Deep Copy
게임 상태를 변경할 때 원본을 보존하기 위해 Deep Copy 사용:

```typescript
const newState = JSON.parse(JSON.stringify(gameState))
```

**장점:**
- 원본 상태 보존
- 롤백 가능

**단점:**
- 성능 오버헤드
- 큰 객체일 경우 느림

**개선 방안 (향후):**
- Immer.js 사용
- Immutable.js 사용

### 2. 메모리 관리
게임 종료 시 게임 룸 삭제:

```typescript
socket.on('disconnect', () => {
  matchmakingService.removePlayer(socket.id)
})
```

---

## 보안 고려사항

### 1. 서버 중심 로직
- 모든 게임 규칙 검증은 서버에서 수행
- 클라이언트의 입력은 항상 검증

### 2. 에너지 검증
```typescript
// 클라이언트가 보낸 카드 선택을 서버에서 재검증
const validation = this.gameEngine.validateCardSelection(player, cards)
if (!validation.valid) {
  return { success: false, reason: validation.reason }
}
```

### 3. 게임 상태 보호
- 클라이언트는 자신의 게임 룸만 접근 가능
- Socket ID로 게임 룸 매핑

---

## 테스트 전략

### 단위 테스트 (Jest)

```bash
cd server
npm test
```

**테스트 항목:**
1. ✅ 카드 유효성 검증
2. ✅ 이동 로직
3. ✅ 방어 로직
4. ✅ 공격 로직 (HIT/MISS)
5. ✅ 에너지 회복
6. ✅ 승패 판정
7. ✅ 카드 우선순위 처리
8. ✅ 전투 시뮬레이션

### 통합 테스트

```typescript
// server/src/__tests__/integration.test.ts
// 2플레이어 전체 게임 흐름 테스트
```

---

## 향후 개선 사항

### 1. 라운드 반복
현재는 1라운드만 진행. 여러 라운드 지원 필요.

### 2. 재접속 처리
연결 끊김 시 게임 상태 복구.

### 3. 타임아웃
카드 선택 시간 제한 (60초).

### 4. 데이터베이스
게임 결과 저장, 전적 관리.

### 5. 로깅
Winston 등을 이용한 체계적인 로깅.

---

**마지막 업데이트**: 2025-11-10
