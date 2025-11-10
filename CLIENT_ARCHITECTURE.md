# 클라이언트 아키텍처 상세 문서

## 목차
1. [아키텍처 개요](#아키텍처-개요)
2. [디렉토리 구조](#디렉토리-구조)
3. [핵심 모듈 상세](#핵심-모듈-상세)
4. [UI 컴포넌트](#ui-컴포넌트)
5. [상태 관리](#상태-관리)
6. [애니메이션](#애니메이션)

---

## 아키텍처 개요

### 설계 원칙

**프레젠테이션 레이어 (Presentation Layer)**
- 클라이언트는 UI 표시와 사용자 입력만 담당
- 게임 로직은 서버에서 처리
- 서버로부터 받은 데이터를 시각화

### 기술 스택
- **React 18**: 컴포넌트 기반 UI
- **TypeScript**: 타입 안정성
- **Vite**: 빠른 개발 서버, HMR
- **Socket.IO-Client**: 실시간 통신
- **Framer Motion**: 애니메이션
- **Inline Styles**: CSS-in-JS (간단한 스타일링)

---

## 디렉토리 구조

```
client/src/
├── components/           # UI 컴포넌트
│   ├── BattleField.tsx  # 4x3 그리드 전투 필드
│   ├── BattleLog.tsx    # 전투 로그
│   └── StatusBar.tsx    # HP/Energy 상태 바
│
├── hooks/               # 커스텀 React 훅
│   └── useSocket.ts    # Socket.IO 통신 훅
│
├── App.tsx              # 메인 앱 컴포넌트
└── main.tsx             # 엔트리포인트
```

---

## 핵심 모듈 상세

### 1. hooks/useSocket.ts (Socket.IO 훅)

서버와의 실시간 통신을 관리하는 커스텀 훅입니다.

```typescript
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { GameState, BattleEvent, CardSelection } from '../../shared/types'

export function useSocket() {
  // 상태
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [battleEvents, setBattleEvents] = useState<BattleEvent[]>([])
  const [error, setError] = useState<string>('')

  // Socket 초기화
  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket'],
      autoConnect: true,
    })

    setSocket(newSocket)

    // 연결 상태 이벤트
    newSocket.on('connect', () => {
      console.log('서버 연결 성공:', newSocket.id)
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('서버 연결 해제')
      setConnected(false)
    })

    // 게임 이벤트 리스너
    newSocket.on('matchFound', (state: GameState) => {
      console.log('매칭 성공!', state)
      setGameState(state)
      setBattleEvents([])  // 이전 이벤트 초기화
    })

    newSocket.on('gameStateUpdate', (state: GameState) => {
      console.log('게임 상태 업데이트', state)
      setGameState(state)
    })

    newSocket.on('battleEvents', (events: BattleEvent[]) => {
      console.log('전투 이벤트 수신', events)
      setBattleEvents(events)
    })

    newSocket.on('error', (message: string) => {
      console.error('에러:', message)
      setError(message)
    })

    // 클린업
    return () => {
      newSocket.close()
    }
  }, [])

  // 서버에 메시지 전송하는 함수들
  const joinMatchmaking = () => {
    if (socket) {
      console.log('매칭 시작 요청')
      socket.emit('joinMatchmaking')
    }
  }

  const selectCards = (cards: CardSelection) => {
    if (socket) {
      console.log('카드 선택 전송:', cards)
      socket.emit('selectCards', cards)
    }
  }

  return {
    connected,
    gameState,
    battleEvents,
    error,
    myPlayerId: socket?.id || '',  // 내 플레이어 ID
    joinMatchmaking,
    selectCards,
  }
}
```

**역할:**
- Socket.IO 연결 관리
- 서버 이벤트 리스닝
- 게임 상태 동기화
- 이벤트 전송 함수 제공

**반환 값:**
```typescript
{
  connected: boolean              // 서버 연결 상태
  gameState: GameState | null     // 현재 게임 상태
  battleEvents: BattleEvent[]     // 전투 이벤트 목록
  error: string                   // 에러 메시지
  myPlayerId: string              // 내 Socket ID
  joinMatchmaking: () => void     // 매칭 시작 함수
  selectCards: (cards) => void    // 카드 선택 함수
}
```

---

### 2. App.tsx (메인 앱 컴포넌트)

전체 게임 UI를 관리하는 루트 컴포넌트입니다.

#### 상태 관리

```typescript
function App() {
  // Socket 훅으로 서버 통신
  const {
    connected,
    gameState,
    battleEvents,
    error,
    myPlayerId,
    joinMatchmaking,
    selectCards,
  } = useSocket()

  // 로컬 UI 상태
  const [selectedCards, setSelectedCards] = useState<CardType[]>([])
}
```

#### 플레이어 식별

```typescript
// 내가 Player1인지 Player2인지 판단
const isPlayer1 = gameState.player1.playerId === myPlayerId

// 내 캐릭터와 상대 캐릭터 구분
const myCharacter = isPlayer1 ? gameState.player1 : gameState.player2
const opponentCharacter = isPlayer1 ? gameState.player2 : gameState.player1

// 내 차례인지, 준비 완료했는지
const isMyTurn = gameState.phase === GamePhase.PREPARATION
const amIReady = isPlayer1 ? gameState.player1Ready : gameState.player2Ready
```

**중요:**
- `myPlayerId`는 Socket.IO가 자동으로 할당한 고유 ID
- 서버의 `gameState.player1.playerId`와 비교하여 내가 누구인지 판단
- 이를 통해 UI를 내 시점으로 표시

#### 화면 분기

```typescript
// 1. 매칭 대기 화면
if (!gameState) {
  return <매칭 대기 화면 />
}

// 2. 게임 진행 화면
return (
  <>
    <내 정보>
    <상대 정보>
    <라운드 정보>
    <전투 필드>
    <전투 로그>

    {/* 준비 단계 */}
    {isMyTurn && !amIReady && <카드 선택 UI>}

    {/* 대기 중 */}
    {isMyTurn && amIReady && <상대방 대기 중...>}

    {/* 전투 중 */}
    {gameState.phase === GamePhase.BATTLE && <전투 진행 중...>}

    {/* 게임 종료 */}
    {gameState.phase === GamePhase.ENDED && <결과 화면>}
  </>
)
```

#### 카드 선택 로직

```typescript
// 카드 클릭 핸들러
const handleCardClick = (card: CardType) => {
  // 이미 3장 선택했으면 막기
  if (selectedCards.length >= 3) {
    alert('이미 3장을 선택했습니다!')
    return
  }

  // 중복 선택 막기
  if (selectedCards.includes(card)) {
    alert('같은 카드를 중복 선택할 수 없습니다!')
    return
  }

  // 선택 추가
  setSelectedCards([...selectedCards, card])
}

// 준비 완료 버튼
const handleSubmit = () => {
  if (selectedCards.length !== 3) {
    alert('카드를 3장 선택해주세요!')
    return
  }

  // 서버에 전송
  selectCards(selectedCards as [CardType, CardType, CardType])
  setSelectedCards([])  // 초기화
}

// 다시 선택 버튼
const handleReset = () => {
  setSelectedCards([])
}
```

#### UI 레이아웃 구조

```
┌─────────────────────────────────────────┐
│         🎮 Demon Tournament            │
├─────────────────────────────────────────┤
│ 서버 연결: 🟢 연결됨                    │
├─────────────────────────────────────────┤
│ 🟦 Player 1 (나)     🟥 Player 2 (상대)│
│ HP:  ▓▓▓▓▓▓░░░ 70/100                  │
│ Energy: ▓▓▓▓▓▓▓▓░░ 80/100              │
│ 위치: (1, 1)                            │
├─────────────────────────────────────────┤
│ 📊 Round 1                              │
│ Phase: PREPARATION                      │
├─────────────────────────────────────────┤
│            4x3 전투 필드                │
│  ┌───┬───┬───┬───┐                     │
│  │   │   │   │   │                     │
│  │ 😀│   │   │ 😈│                     │
│  │   │   │   │   │                     │
│  └───┴───┴───┴───┘                     │
├─────────────────────────────────────────┤
│ 📜 전투 로그                            │
│ 🏃 Player1 moved up                    │
│ ⚔️ Player2 attacks (HIT!)              │
│ 💥 Player1 takes 30 damage             │
├─────────────────────────────────────────┤
│ 🎴 카드 선택 (2/3)                     │
│ 선택된 카드: [⬆️ 위로] [🛡️ 방어]      │
│                                         │
│ [⬆️][⬇️][⬅️][➡️][🛡️]                   │
│ [⚡][✚][⬆️][💥][✖️]                     │
│                                         │
│ [✅ 준비 완료]  [🔄 다시 선택]         │
└─────────────────────────────────────────┘
```

---

## UI 컴포넌트

### 1. components/StatusBar.tsx

HP와 Energy를 시각적으로 표시하는 상태 바입니다.

```typescript
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StatusBarProps {
  label: string         // "HP" 또는 "Energy"
  current: number       // 현재 값
  max: number          // 최대 값
  color: string        // 바 색상
}

export function StatusBar({ label, current, max, color }: StatusBarProps) {
  const [prevCurrent, setPrevCurrent] = useState(current)
  const [change, setChange] = useState<number | null>(null)

  // 값이 변경되면 애니메이션 표시
  useEffect(() => {
    if (current !== prevCurrent) {
      const diff = current - prevCurrent
      setChange(diff)

      // 2초 후 사라짐
      setTimeout(() => {
        setChange(null)
      }, 2000)

      setPrevCurrent(current)
    }
  }, [current, prevCurrent])

  const percentage = (current / max) * 100

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span>{label}</span>
        <div style={{ position: 'relative' }}>
          <span>
            {current} / {max}
          </span>

          {/* 변화량 애니메이션 */}
          <AnimatePresence>
            {change !== null && (
              <motion.div
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -30 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2 }}
                style={{
                  position: 'absolute',
                  left: '100%',
                  top: 0,
                  marginLeft: '0.5rem',
                  color: change > 0 ? '#4CAF50' : '#f44336',
                  fontWeight: 'bold',
                }}
              >
                {change > 0 ? '+' : ''}{change}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div
        style={{
          width: '100%',
          height: '20px',
          background: '#e0e0e0',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
          style={{
            height: '100%',
            background: color,
          }}
        />
      </div>
    </div>
  )
}
```

**특징:**
- 현재 값 / 최대 값 표시
- 프로그레스 바로 시각화
- 값 변화 시 애니메이션 (+30, -20 등)
- Framer Motion으로 부드러운 애니메이션

**사용 예:**
```typescript
<StatusBar
  label="HP"
  current={myCharacter.stats.hp}
  max={myCharacter.stats.maxHp}
  color="#f44336"
/>
```

---

### 2. components/BattleField.tsx

4x3 그리드 전투 필드를 시각화합니다.

```typescript
import { motion } from 'framer-motion'
import { Position } from '../../../shared/types'

interface BattleFieldProps {
  player1Position: Position
  player2Position: Position
  player1IsMe: boolean  // Player1이 나인지
}

export function BattleField({ player1Position, player2Position, player1IsMe }: BattleFieldProps) {
  const WIDTH = 4
  const HEIGHT = 3
  const CELL_SIZE = 80  // px

  // 그리드 셀 생성
  const cells = []
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      cells.push(
        <div
          key={`${x}-${y}`}
          style={{
            width: `${CELL_SIZE}px`,
            height: `${CELL_SIZE}px`,
            border: '2px solid #ccc',
            background: '#f9f9f9',
          }}
        />
      )
    }
  }

  // 캐릭터 렌더링
  const renderCharacter = (pos: Position, isPlayer1: boolean) => {
    const isMe = isPlayer1 ? player1IsMe : !player1IsMe

    return (
      <motion.div
        key={isPlayer1 ? 'p1' : 'p2'}
        animate={{
          left: `${pos.x * CELL_SIZE}px`,
          top: `${pos.y * CELL_SIZE}px`,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'absolute',
          width: `${CELL_SIZE}px`,
          height: `${CELL_SIZE}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          pointerEvents: 'none',
        }}
      >
        {isMe ? '😀' : '😈'}
      </motion.div>
    )
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>⚔️ 전투 필드</h3>
      <div
        style={{
          position: 'relative',
          width: `${WIDTH * CELL_SIZE}px`,
          height: `${HEIGHT * CELL_SIZE}px`,
          margin: '0 auto',
        }}
      >
        {/* 그리드 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${WIDTH}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${HEIGHT}, ${CELL_SIZE}px)`,
          }}
        >
          {cells}
        </div>

        {/* 캐릭터 오버레이 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {renderCharacter(player1Position, true)}
          {renderCharacter(player2Position, false)}
        </div>
      </div>
    </div>
  )
}
```

**특징:**
- 4x3 그리드 (320x240px)
- 캐릭터 위치를 절대 좌표로 표시
- Framer Motion으로 이동 애니메이션
- 나는 😀, 상대는 😈로 구분

**레이아웃:**
```
Position       좌표
┌───┬───┬───┬───┐
│0,0│1,0│2,0│3,0│
├───┼───┼───┼───┤
│0,1│1,1│2,1│3,1│  ← 초기 위치 (0,1), (3,1)
├───┼───┼───┼───┤
│0,2│1,2│2,2│3,2│
└───┴───┴───┴───┘
```

---

### 3. components/BattleLog.tsx

전투 이벤트를 시간순으로 표시합니다.

```typescript
import { BattleEvent, BattleEventType } from '../../../shared/types'

interface BattleLogProps {
  events: BattleEvent[]
}

export function BattleLog({ events }: BattleLogProps) {
  if (events.length === 0) {
    return null
  }

  // 이벤트 타입별 텍스트
  const getEventText = (event: BattleEvent): string => {
    switch (event.type) {
      case BattleEventType.MOVE:
        return `${event.playerId} moved ${event.data.direction}`
      case BattleEventType.DEFEND:
        return `${event.playerId} is defending (-${event.data.amount} damage)`
      case BattleEventType.ATTACK:
        return `${event.playerId} attacks with ${event.data.cardType} ${
          event.data.hit ? '✓ HIT!' : '✗ MISS'
        }`
      case BattleEventType.DAMAGE_DEALT:
        return `${event.playerId} takes ${event.data.damage} damage (HP: ${event.data.newHp})`
      case BattleEventType.ENERGY_RECOVERY:
        return `${event.playerId} recovered ${event.data.amount} energy`
      case BattleEventType.GAME_END:
        return `🏆 Game Over: ${event.data.result}`
      default:
        return 'Unknown event'
    }
  }

  // 이벤트 타입별 아이콘
  const getEventIcon = (event: BattleEvent): string => {
    switch (event.type) {
      case BattleEventType.MOVE:
        return '🏃'
      case BattleEventType.DEFEND:
        return '🛡️'
      case BattleEventType.ATTACK:
        return event.data.hit ? '⚔️' : '💨'
      case BattleEventType.DAMAGE_DEALT:
        return '💥'
      case BattleEventType.ENERGY_RECOVERY:
        return '⚡'
      case BattleEventType.GAME_END:
        return '🏆'
      default:
        return '•'
    }
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>📜 전투 로그</h3>
      <div
        style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#f5f5f5',
          borderRadius: '8px',
          maxHeight: '300px',
          overflowY: 'auto',
        }}
      >
        {events.map((event, idx) => (
          <div
            key={idx}
            style={{
              padding: '0.5rem',
              marginBottom: '0.5rem',
              background: 'white',
              borderRadius: '4px',
              fontSize: '0.9rem',
              borderLeft:
                event.type === BattleEventType.DAMAGE_DEALT
                  ? '3px solid #f44336'
                  : '3px solid #4CAF50',
            }}
          >
            <span style={{ marginRight: '0.5rem' }}>{getEventIcon(event)}</span>
            {getEventText(event)}
          </div>
        ))}
      </div>
    </div>
  )
}
```

**특징:**
- 이벤트 타입별 아이콘과 색상
- 데미지 이벤트는 빨간색 테두리
- 스크롤 가능 (최대 300px)
- 시간순 정렬

**이벤트 예시:**
```
🏃 socket-123 moved up
⚔️ socket-456 attacks with ATTACK_CROSS ✓ HIT!
💥 socket-123 takes 30 damage (HP: 70)
```

---

## 상태 관리

### 로컬 상태 vs 서버 상태

#### 로컬 상태 (useState)
```typescript
const [selectedCards, setSelectedCards] = useState<CardType[]>([])
```
- UI 전용 상태
- 카드 선택 임시 저장
- 서버에 전송 전까지는 로컬에만 존재

#### 서버 상태 (useSocket)
```typescript
const { gameState, battleEvents } = useSocket()
```
- 서버로부터 받은 데이터
- 게임의 신뢰할 수 있는 소스 (Source of Truth)
- 클라이언트는 읽기만 가능

### 상태 흐름

```
1. 카드 선택 (로컬)
   selectedCards = [MOVE_UP, DEFEND, ATTACK_CROSS]
     ↓
2. 준비 완료 클릭
     ↓
3. 서버에 전송
   selectCards(selectedCards)
     ↓
4. 서버 응답 대기
     ↓
5. 게임 상태 업데이트
   gameState.player1Ready = true
     ↓
6. UI 자동 업데이트
```

---

## 애니메이션

### Framer Motion 사용

#### 1. 캐릭터 이동 애니메이션

```typescript
<motion.div
  animate={{
    left: `${pos.x * CELL_SIZE}px`,
    top: `${pos.y * CELL_SIZE}px`,
  }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
  😀
</motion.div>
```

**효과:**
- 스프링 애니메이션 (자연스러운 움직임)
- 위치가 변경되면 자동으로 애니메이션

#### 2. 데미지/회복 숫자 애니메이션

```typescript
<AnimatePresence>
  {change !== null && (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -30 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2 }}
    >
      {change > 0 ? '+' : ''}{change}
    </motion.div>
  )}
</AnimatePresence>
```

**효과:**
- 숫자가 위로 올라가며 사라짐
- 2초 동안 페이드 아웃

#### 3. 프로그레스 바 애니메이션

```typescript
<motion.div
  initial={{ width: `${percentage}%` }}
  animate={{ width: `${percentage}%` }}
  transition={{ duration: 0.5 }}
  style={{ height: '100%', background: color }}
/>
```

**효과:**
- HP/Energy 변화 시 부드럽게 변경
- 0.5초 동안 애니메이션

---

## 반응형 디자인

현재는 고정 크기로 구현되어 있습니다.

### 현재 크기
- 전투 필드: 320x240px (80px x 4칸 x 3칸)
- 최대 컨테이너 너비: 1200px

### 향후 개선 (반응형)
```typescript
// 화면 크기에 따라 셀 크기 조정
const CELL_SIZE = Math.min(80, window.innerWidth / 5)
```

---

## 에러 처리

### 서버 에러 표시

```typescript
{error && (
  <div style={{
    marginTop: '1rem',
    padding: '1rem',
    background: '#fee',
    border: '1px solid #fcc'
  }}>
    ❌ {error}
  </div>
)}
```

### 사용자 입력 검증

```typescript
// 카드 3장 미선택
if (selectedCards.length !== 3) {
  alert('카드를 3장 선택해주세요!')
  return
}

// 중복 선택
if (selectedCards.includes(card)) {
  alert('같은 카드를 중복 선택할 수 없습니다!')
  return
}
```

---

## 성능 최적화

### 1. 불필요한 리렌더링 방지

```typescript
// useEffect 의존성 배열 최소화
useEffect(() => {
  if (current !== prevCurrent) {
    // ...
  }
}, [current, prevCurrent])  // 필요한 것만 포함
```

### 2. 애니메이션 최적화

```typescript
// GPU 가속 사용 (transform 속성)
<motion.div
  animate={{ x: pos.x * 80, y: pos.y * 80 }}  // transform: translate() 사용
/>
```

### 3. 이벤트 로그 최적화

```typescript
// 최대 높이 제한 + 스크롤
<div style={{
  maxHeight: '300px',
  overflowY: 'auto'
}}>
```

---

## 접근성 (Accessibility)

### 향후 개선 사항
- [ ] 키보드 네비게이션
- [ ] 스크린 리더 지원
- [ ] 색맹 모드
- [ ] 고대비 모드

---

## 디버깅

### Console 로그

```typescript
// Socket 이벤트
console.log('매칭 성공!', state)
console.log('게임 상태 업데이트', state)
console.log('전투 이벤트 수신', events)

// 카드 선택
console.log('카드 선택 전송:', cards)
```

### React DevTools
- 컴포넌트 트리 확인
- Props 및 State 검사
- 리렌더링 추적

---

## 테스트 전략

### 단위 테스트 (향후)
```typescript
// 카드 선택 로직 테스트
test('카드 3장 이상 선택 불가', () => {
  // ...
})

test('중복 카드 선택 불가', () => {
  // ...
})
```

### 통합 테스트
- 2개 브라우저로 실제 게임 플레이
- 다양한 카드 조합 테스트
- 네트워크 지연 시뮬레이션

---

## 빌드 및 배포

### 개발 모드
```bash
cd client
npm run dev
```
- http://localhost:5173 에서 실행
- HMR (Hot Module Replacement) 활성화

### 프로덕션 빌드
```bash
npm run build
```
- `dist/` 폴더에 최적화된 번들 생성
- HTML, CSS, JS 파일 생성

### 배포 (향후)
- Vercel, Netlify 등 정적 호스팅
- 서버 URL 환경 변수로 설정

---

## 향후 개선 사항

### 1. 순차적 카드 공개 시스템 (롤백됨)
- 카드를 한 장씩 공개하며 시뮬레이션
- 각 카드 효과를 실시간으로 표시

### 2. 카드 정보 표시
- 에너지 비용 표시
- 공격력 표시
- 공격 범위 그리드 표시

### 3. 사운드 효과
- 카드 선택 소리
- 공격 히트/미스 소리
- 배경 음악

### 4. 비주얼 이펙트
- 공격 이펙트 (파티클, 플래시)
- 승/패 애니메이션
- 카드 선택 애니메이션

### 5. 모바일 지원
- 터치 인터페이스
- 반응형 레이아웃
- 세로 모드 지원

---

**마지막 업데이트**: 2025-11-10
**현재 상태**: 기본 UI 완성, 2플레이어 게임 가능
