# 개발 진행 상황 요약

## 📋 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [현재 구현 완료된 기능](#현재-구현-완료된-기능)
3. [프로젝트 구조](#프로젝트-구조)
4. [핵심 로직 설명](#핵심-로직-설명)
5. [데이터 흐름](#데이터-흐름)
6. [테스트 방법](#테스트-방법)
7. [다음 단계](#다음-단계)

---

## 프로젝트 개요

**Demon Tournament**는 웹 기반 1v1 턴제 카드 게임입니다.

### 게임 규칙
- 각 플레이어는 라운드마다 **3장의 카드**를 선택
- 양쪽이 선택을 완료하면 서버에서 **전투 시뮬레이션** 자동 진행
- 카드는 **우선순위**에 따라 처리됨:
  - 1순위: 이동 카드
  - 2순위: 방어 카드
  - 3순위: 공격 / 에너지 회복 카드
- 상대방의 HP를 0으로 만들면 승리

---

## 현재 구현 완료된 기능

### ✅ 완료 항목

#### 1. 프로젝트 초기 세팅
- **백엔드**: Node.js + Express + TypeScript + Socket.IO
- **프론트엔드**: React 18 + Vite + TypeScript
- **공유 타입**: `shared/types/` 디렉토리로 타입 정의 공유
- ESLint, Prettier 설정 완료

#### 2. 게임 로직 (서버)
- ✅ 카드 정의 시스템 (`server/src/game/models/cards.ts`)
  - 10종류의 카드 (이동 4개, 방어 1개, 에너지 회복 1개, 공격 4개)
- ✅ 전투 필드 관리 (`server/src/game/models/BattleField.ts`)
  - 4x3 그리드 구조
- ✅ 게임 엔진 (`server/src/game/engine/GameEngine.ts`)
  - 카드 우선순위 처리
  - 이동, 방어, 공격, 에너지 회복 로직
  - 승패 판정
- ✅ 전투 시뮬레이션
  - 3장의 카드를 순서대로 처리
  - 각 카드 처리 후 승패 판정
  - 게임 종료 시 즉시 중단
- ✅ Jest 단위 테스트 (8개 테스트 모두 통과)

#### 3. 네트워크 (서버)
- ✅ Socket.IO 실시간 통신
- ✅ 매칭 시스템 (`server/src/services/MatchmakingService.ts`)
  - 대기 중인 플레이어 자동 매칭
- ✅ 게임 룸 관리 (`server/src/services/GameRoom.ts`)
  - 게임 상태 관리
  - 카드 선택 유효성 검증
  - 전투 시뮬레이션 실행
- ✅ 이벤트 핸들러 (`server/src/socket/gameHandler.ts`)
  - `joinMatchmaking`: 매칭 시작
  - `selectCards`: 카드 선택
  - `battleEvents`: 전투 결과 전송

#### 4. UI/UX (클라이언트)
- ✅ 매칭 화면
  - 서버 연결 상태 표시
  - 매칭 시작 버튼
- ✅ 카드 선택 화면
  - 10개 카드 그리드 표시
  - 선택된 카드 하이라이트
  - 카드 중복 선택 방지
  - 준비 완료 / 다시 선택 버튼
- ✅ 전투 필드 (`client/src/components/BattleField.tsx`)
  - 4x3 그리드 시각화
  - 캐릭터 위치 표시 (나/상대 구분)
  - Framer Motion 애니메이션
- ✅ 상태 바 (`client/src/components/StatusBar.tsx`)
  - HP, Energy 바
  - 데미지/회복 애니메이션
- ✅ 전투 로그 (`client/src/components/BattleLog.tsx`)
  - 실시간 이벤트 로그
  - 이벤트 타입별 아이콘/색상

#### 5. 통합 테스트
- ✅ 2플레이어 실제 게임 진행 테스트 성공
- ✅ 플레이어 식별 (나/상대) 정상 작동
- ✅ 캐릭터 위치 업데이트 정상 작동

---

## 프로젝트 구조

```
demon_tournament/
├── shared/                    # 공유 타입 정의
│   └── types/
│       └── index.ts          # 모든 게임 타입 정의
│
├── server/                    # 백엔드
│   └── src/
│       ├── game/             # 게임 로직
│       │   ├── models/       # 데이터 모델
│       │   │   ├── cards.ts          # 카드 정의
│       │   │   └── BattleField.ts    # 필드 관리
│       │   └── engine/       # 게임 엔진
│       │       └── GameEngine.ts     # 전투 시뮬레이션
│       ├── services/         # 비즈니스 로직
│       │   ├── GameRoom.ts           # 게임 룸 관리
│       │   └── MatchmakingService.ts # 매칭 시스템
│       ├── socket/           # Socket.IO 핸들러
│       │   └── gameHandler.ts        # 이벤트 핸들러
│       └── index.ts          # 서버 엔트리포인트
│
└── client/                    # 프론트엔드
    └── src/
        ├── components/       # UI 컴포넌트
        │   ├── BattleField.tsx       # 전투 필드
        │   ├── BattleLog.tsx         # 전투 로그
        │   └── StatusBar.tsx         # 상태 바
        ├── hooks/            # React 훅
        │   └── useSocket.ts          # Socket.IO 훅
        └── App.tsx           # 메인 앱
```

---

## 핵심 로직 설명

### 1. 타입 시스템 (`shared/types/index.ts`)

#### 주요 타입들:

```typescript
// 위치
type Position = { x: number; y: number }

// 카드 타입 (enum)
enum CardType {
  MOVE_UP, MOVE_DOWN, MOVE_LEFT, MOVE_RIGHT,
  DEFEND,
  ENERGY_RECOVERY,
  ATTACK_CROSS, ATTACK_FORWARD, ATTACK_AREA, ATTACK_DIAGONAL
}

// 카드 정의
type CardDefinition = {
  type: CardType
  name: string
  priority: CardPriority  // 1=이동, 2=방어, 3=공격/회복
  energyCost: number
  damage?: number
  attackPattern?: Position[]  // 공격 범위
}

// 캐릭터
type Character = {
  playerId: string
  stats: { hp, maxHp, energy, maxEnergy }
  position: Position
  deck: CardType[]
  defenseActive: boolean
  defenseAmount: number
}

// 게임 상태
type GameState = {
  phase: GamePhase  // WAITING, PREPARATION, BATTLE, ENDED
  round: number
  player1: Character
  player2: Character
  player1Selection: CardSelection | null
  player2Selection: CardSelection | null
  player1Ready: boolean
  player2Ready: boolean
  result: GameResult | null
}

// 전투 이벤트
type BattleEvent = {
  type: BattleEventType
  playerId: string
  data: any
}
```

---

### 2. 게임 엔진 (`server/src/game/engine/GameEngine.ts`)

#### 핵심 메서드:

##### `simulateBattle(gameState: GameState)`
전투 시뮬레이션의 메인 함수입니다.

```typescript
// 의사 코드
for (각 카드 0, 1, 2) {
  1. 방어 초기화
  2. 카드 우선순위별로 처리 (processCardsByPriority)
  3. 이벤트 생성
  4. 승패 판정
  5. 게임 종료면 break
}
```

##### `processCardsByPriority(state, card1, card2)`
두 플레이어의 카드를 우선순위에 따라 처리합니다.

```typescript
// 의사 코드
1. 두 카드를 우선순위로 정렬
2. 같은 우선순위끼리 그룹화
3. 각 그룹을 순서대로 처리
   - 이동 그룹 (우선순위 1)
   - 방어 그룹 (우선순위 2)
   - 공격/회복 그룹 (우선순위 3)
```

##### 카드 처리 로직:

**이동 카드:**
```typescript
// 방향에 따라 위치 변경
// 필드 범위 내에서만 이동 가능
if (새 위치가 범위 내) {
  character.position = 새 위치
  이벤트 생성: MOVE
}
```

**방어 카드:**
```typescript
// 이번 턴 동안 데미지 감소
character.defenseActive = true
character.defenseAmount = 15
이벤트 생성: DEFEND
```

**공격 카드:**
```typescript
// 공격 패턴에 따라 범위 계산
for (각 공격 패턴) {
  절대 위치 = 공격자 위치 + 패턴
  if (절대 위치 == 상대 위치) {
    데미지 = 카드 데미지 - 방어량
    상대.hp -= 데미지
    이벤트 생성: ATTACK (hit=true)
    이벤트 생성: DAMAGE_DEALT
    return
  }
}
이벤트 생성: ATTACK (hit=false)
```

**에너지 회복 카드:**
```typescript
character.energy = min(maxEnergy, energy + 30)
이벤트 생성: ENERGY_RECOVERY
```

---

### 3. 게임 룸 (`server/src/services/GameRoom.ts`)

게임 룸은 하나의 게임 세션을 관리합니다.

#### 주요 기능:

```typescript
class GameRoom {
  private gameState: GameState
  private gameEngine: GameEngine

  // 카드 선택 처리
  selectCards(playerId, cards) {
    1. 유효성 검증 (에너지, 중복 체크)
    2. 선택 저장
    3. 준비 완료 상태로 변경
    4. 양쪽 모두 준비되면 전투 시작
  }

  // 전투 시작
  startBattle() {
    1. 페이즈를 BATTLE로 변경
    2. gameEngine.simulateBattle() 호출
    3. 결과(이벤트, 새 상태) 반환
    4. 클라이언트에 전송
  }
}
```

---

### 4. 매칭 시스템 (`server/src/services/MatchmakingService.ts`)

간단한 큐 기반 매칭입니다.

```typescript
class MatchmakingService {
  private waitingPlayers: string[] = []

  addPlayer(socketId) {
    waitingPlayers.push(socketId)

    if (waitingPlayers.length >= 2) {
      player1 = waitingPlayers.shift()
      player2 = waitingPlayers.shift()

      // 게임 룸 생성
      room = new GameRoom([player1, player2])

      return { player1, player2, room }
    }
  }
}
```

---

### 5. 클라이언트 훅 (`client/src/hooks/useSocket.ts`)

Socket.IO 연결을 관리하는 React 훅입니다.

```typescript
function useSocket() {
  const [gameState, setGameState] = useState(null)
  const [battleEvents, setBattleEvents] = useState([])

  useEffect(() => {
    // 서버 연결
    socket.connect()

    // 이벤트 리스너
    socket.on('matchFound', (state) => {
      setGameState(state)
    })

    socket.on('gameStateUpdate', (state) => {
      setGameState(state)
    })

    socket.on('battleEvents', (events) => {
      setBattleEvents(events)
    })
  }, [])

  return {
    gameState,
    battleEvents,
    joinMatchmaking: () => socket.emit('joinMatchmaking'),
    selectCards: (cards) => socket.emit('selectCards', cards)
  }
}
```

---

### 6. 메인 앱 (`client/src/App.tsx`)

게임의 전체 UI 흐름을 관리합니다.

```typescript
function App() {
  // 1. 상태 관리
  const { gameState, battleEvents, ... } = useSocket()
  const [selectedCards, setSelectedCards] = useState([])

  // 2. 플레이어 식별
  const isPlayer1 = gameState.player1.playerId === myPlayerId
  const myCharacter = isPlayer1 ? gameState.player1 : gameState.player2
  const opponentCharacter = isPlayer1 ? gameState.player2 : gameState.player1

  // 3. 화면 분기
  if (!gameState) return <매칭 화면 />

  return (
    <>
      <내 정보 / 상대 정보>
      <라운드 정보>
      <전투 필드>
      <전투 로그>

      {phase === PREPARATION && <카드 선택 화면>}
      {phase === BATTLE && <전투 진행 중...>}
      {phase === ENDED && <게임 종료 화면>}
    </>
  )
}
```

---

## 데이터 흐름

### 전체 게임 플로우

```
1. 매칭 단계
   클라이언트 → joinMatchmaking → 서버
   서버 → matchFound → 클라이언트 (초기 GameState)

2. 준비 단계 (PREPARATION)
   [플레이어 1]
   - 카드 3장 선택
   - selectCards 전송 → 서버
   - player1Ready = true

   [플레이어 2]
   - 카드 3장 선택
   - selectCards 전송 → 서버
   - player2Ready = true

   [서버]
   - 양쪽 모두 준비 완료 감지
   - startBattle() 호출

3. 전투 단계 (BATTLE)
   [서버]
   - GameEngine.simulateBattle() 실행
   - BattleEvent[] 생성
   - 최종 GameState 계산

   [서버 → 클라이언트]
   - battleEvents 전송
   - gameStateUpdate 전송 (최종 상태)

   [클라이언트]
   - battleEvents 수신 → BattleLog 표시
   - gameStateUpdate 수신 → 화면 업데이트
   - 캐릭터 위치, HP, 에너지 변경 반영

4. 종료 단계 (ENDED)
   - 승패 결과 표시
```

### 이벤트 종류와 데이터

```typescript
// 이동 이벤트
{
  type: 'MOVE',
  playerId: 'socket-id',
  data: {
    direction: 'up',
    newPosition: { x: 0, y: 0 }
  }
}

// 방어 이벤트
{
  type: 'DEFEND',
  playerId: 'socket-id',
  data: {
    amount: 15
  }
}

// 공격 이벤트
{
  type: 'ATTACK',
  playerId: 'socket-id',
  data: {
    cardType: 'ATTACK_CROSS',
    hit: true,
    targetPosition: { x: 3, y: 1 }
  }
}

// 데미지 이벤트
{
  type: 'DAMAGE_DEALT',
  playerId: 'target-id',
  data: {
    damage: 30,
    newHp: 70
  }
}

// 에너지 회복 이벤트
{
  type: 'ENERGY_RECOVERY',
  playerId: 'socket-id',
  data: {
    amount: 30,
    newEnergy: 100
  }
}

// 게임 종료 이벤트
{
  type: 'GAME_END',
  playerId: '',
  data: {
    result: 'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW'
  }
}
```

---

## 테스트 방법

### 1. 서버 실행
```bash
cd server
npm run dev
```
서버가 http://localhost:3000 에서 실행됩니다.

### 2. 클라이언트 실행
```bash
cd client
npm run dev
```
클라이언트가 http://localhost:5173 에서 실행됩니다.

### 3. 2명 플레이어 테스트
1. 브라우저 2개 열기 (또는 일반 + 시크릿 모드)
2. 각각 http://localhost:5173 접속
3. 양쪽에서 "매칭 시작" 클릭
4. 자동으로 매칭되어 게임 시작
5. 각자 카드 3장 선택 후 "준비 완료" 클릭
6. 전투 결과 확인

### 4. 단위 테스트 실행
```bash
cd server
npm test
```

---

## 다음 단계

### 🚧 미완성 기능

#### 1. 게임 흐름
- [ ] 라운드 반복 (현재는 1라운드만 진행)
- [ ] 게임 종료 후 재매칭
- [ ] 타임아웃 처리 (카드 선택 시간 제한)

#### 2. 네트워크
- [ ] 재접속 처리 (연결 끊김 시)
- [ ] 에러 핸들링 개선
- [ ] 로깅 시스템

#### 3. UI/UX
- [ ] 순차적 카드 공개 시스템 (롤백됨)
- [ ] 카드에 에너지 비용/데미지 표시
- [ ] 카드에 공격 범위 그리드 표시
- [ ] 승/패 애니메이션
- [ ] 사운드 이펙트

#### 4. 게임 밸런스
- [ ] 다양한 캐릭터 추가
- [ ] 카드 밸런스 조정
- [ ] 추가 카드 타입

#### 5. 인프라
- [ ] 데이터베이스 연동 (PostgreSQL)
- [ ] 유저 계정 시스템
- [ ] 전적 저장
- [ ] Redis 세션 관리
- [ ] 배포 (Docker)

---

## 기술 스택 요약

| 분류 | 기술 |
|------|------|
| 언어 | TypeScript |
| 백엔드 | Node.js 20+, Express.js |
| 프론트엔드 | React 18, Vite |
| 실시간 통신 | Socket.IO |
| 애니메이션 | Framer Motion |
| 스타일링 | Tailwind CSS (inline styles) |
| 테스트 | Jest |
| 린팅 | ESLint, Prettier |

---

## 참고 문서

- [CLAUDE.md](./CLAUDE.md) - 게임 개발 계획서 (원본 기획)
- [shared/types/index.ts](./shared/types/index.ts) - 전체 타입 정의
- [server/src/game/engine/GameEngine.ts](./server/src/game/engine/GameEngine.ts) - 게임 로직 구현

---

**마지막 업데이트**: 2025-11-10
**현재 상태**: MVP 기능 구현 완료, 2플레이어 게임 진행 가능
