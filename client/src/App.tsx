import { useState, useEffect } from 'react'
import { useSocket } from './hooks/useSocket'
import { CardType, GamePhase, BattleEventType } from '../../shared/types'
import { BattleField } from './components/BattleField'
import { BattleLog } from './components/BattleLog'
import { StatusBar } from './components/StatusBar'
import { motion, AnimatePresence } from 'framer-motion'

// 사용 가능한 모든 카드
const ALL_CARDS = [
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
]

// 카드 이름 매핑
const CARD_NAMES: Record<CardType, string> = {
  [CardType.MOVE_UP]: '⬆️ 위로 이동',
  [CardType.MOVE_DOWN]: '⬇️ 아래로 이동',
  [CardType.MOVE_LEFT]: '⬅️ 왼쪽 이동',
  [CardType.MOVE_RIGHT]: '➡️ 오른쪽 이동',
  [CardType.DEFEND]: '🛡️ 방어',
  [CardType.ENERGY_RECOVERY]: '⚡ 에너지 회복',
  [CardType.ATTACK_CROSS]: '✚ 십자 공격',
  [CardType.ATTACK_FORWARD]: '⬆️ 전방 공격',
  [CardType.ATTACK_AREA]: '💥 광역 공격',
  [CardType.ATTACK_DIAGONAL]: '✖️ 대각선 공격',
}

function App() {
  const { connected, gameState, battleEvents, error, myPlayerId, joinMatchmaking, selectCards } = useSocket()
  const [selectedCards, setSelectedCards] = useState<CardType[]>([])
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentEventIndex, setCurrentEventIndex] = useState(0)
  const [displayedEvents, setDisplayedEvents] = useState<typeof battleEvents>([])
  const [currentCardReveal, setCurrentCardReveal] = useState<{
    cardIndex: number
    player1Card: CardType
    player2Card: CardType
  } | null>(null)

  const handleCardClick = (card: CardType) => {
    if (selectedCards.length >= 3) {
      alert('이미 3장을 선택했습니다!')
      return
    }

    if (selectedCards.includes(card)) {
      alert('같은 카드를 중복 선택할 수 없습니다!')
      return
    }

    setSelectedCards([...selectedCards, card])
  }

  const handleSubmit = () => {
    if (selectedCards.length !== 3) {
      alert('카드를 3장 선택해주세요!')
      return
    }

    selectCards(selectedCards as [CardType, CardType, CardType])
    setSelectedCards([])
  }

  const handleReset = () => {
    setSelectedCards([])
  }

  // 전투 이벤트가 도착하면 시뮬레이션 시작
  useEffect(() => {
    if (battleEvents.length > 0 && gameState?.phase === GamePhase.BATTLE && !isSimulating) {
      setIsSimulating(true)
      setCurrentEventIndex(0)
      setDisplayedEvents([])
      setCurrentCardReveal(null)
    }
  }, [battleEvents, gameState, isSimulating])

  // 이벤트 순차 재생
  useEffect(() => {
    if (!isSimulating || currentEventIndex >= battleEvents.length) {
      if (isSimulating && currentEventIndex >= battleEvents.length) {
        // 시뮬레이션 완료
        setTimeout(() => {
          setIsSimulating(false)
        }, 1000)
      }
      return
    }

    const currentEvent = battleEvents[currentEventIndex]

    // 게임 종료 이벤트면 시뮬레이션 중단
    if (currentEvent.type === BattleEventType.GAME_END) {
      setDisplayedEvents([...displayedEvents, currentEvent])
      setTimeout(() => {
        setCurrentEventIndex(currentEventIndex + 1)
      }, 2000)
      return
    }

    // 카드 공개 이벤트 처리
    if (currentEvent.type === BattleEventType.CARD_REVEAL) {
      setCurrentCardReveal({
        cardIndex: currentEvent.data.cardIndex,
        player1Card: currentEvent.data.player1Card,
        player2Card: currentEvent.data.player2Card,
      })
      setDisplayedEvents([...displayedEvents, currentEvent])
      // 카드 공개 후 1.5초 대기
      setTimeout(() => {
        setCurrentCardReveal(null)
        setCurrentEventIndex(currentEventIndex + 1)
      }, 1500)
      return
    }

    // 일반 이벤트 처리
    setDisplayedEvents([...displayedEvents, currentEvent])
    setTimeout(() => {
      setCurrentEventIndex(currentEventIndex + 1)
    }, 600)
  }, [isSimulating, currentEventIndex, battleEvents, displayedEvents])

  // 매칭 대기 화면
  if (!gameState) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
        <h1>🎮 Demon Tournament</h1>

        <div style={{ marginTop: '2rem' }}>
          <p>서버 연결: <strong>{connected ? '🟢 연결됨' : '🔴 연결 안됨'}</strong></p>
        </div>

        {error && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#fee', border: '1px solid #fcc' }}>
            ❌ {error}
          </div>
        )}

        <div style={{ marginTop: '2rem' }}>
          <button
            onClick={joinMatchmaking}
            disabled={!connected}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              cursor: connected ? 'pointer' : 'not-allowed',
              background: connected ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
            }}
          >
            🔍 매칭 시작
          </button>
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
          <h3>게임 규칙</h3>
          <ul>
            <li>매 라운드 3장의 카드를 선택합니다</li>
            <li>카드는 우선순위에 따라 처리됩니다: 이동 &gt; 방어 &gt; 공격/회복</li>
            <li>상대방의 HP를 0으로 만들면 승리!</li>
          </ul>
        </div>
      </div>
    )
  }

  // 게임 중 화면
  // 내가 Player 1인지 Player 2인지 판단
  const isPlayer1 = gameState.player1.playerId === myPlayerId
  const myCharacter = isPlayer1 ? gameState.player1 : gameState.player2
  const opponentCharacter = isPlayer1 ? gameState.player2 : gameState.player1
  const isMyTurn = gameState.phase === GamePhase.PREPARATION
  const amIReady = isPlayer1 ? gameState.player1Ready : gameState.player2Ready

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🎮 Demon Tournament</h1>

      {/* 게임 상태 */}
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* 내 정보 */}
        <div style={{ padding: '1rem', background: '#e3f2fd', borderRadius: '8px' }}>
          <h3>🟦 {isPlayer1 ? 'Player 1' : 'Player 2'} (나)</h3>
          <div style={{ marginTop: '1rem' }}>
            <StatusBar label="HP" current={myCharacter.stats.hp} max={myCharacter.stats.maxHp} color="#f44336" />
            <StatusBar label="Energy" current={myCharacter.stats.energy} max={myCharacter.stats.maxEnergy} color="#2196F3" />
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>위치: ({myCharacter.position.x}, {myCharacter.position.y})</p>
          {amIReady && <p style={{ marginTop: '0.5rem' }}>✅ 준비 완료</p>}
        </div>

        {/* 상대 정보 */}
        <div style={{ padding: '1rem', background: '#ffebee', borderRadius: '8px' }}>
          <h3>🟥 {isPlayer1 ? 'Player 2' : 'Player 1'} (상대)</h3>
          <div style={{ marginTop: '1rem' }}>
            <StatusBar label="HP" current={opponentCharacter.stats.hp} max={opponentCharacter.stats.maxHp} color="#f44336" />
            <StatusBar label="Energy" current={opponentCharacter.stats.energy} max={opponentCharacter.stats.maxEnergy} color="#2196F3" />
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>위치: ({opponentCharacter.position.x}, {opponentCharacter.position.y})</p>
          {!amIReady && (isPlayer1 ? gameState.player2Ready : gameState.player1Ready) && <p style={{ marginTop: '0.5rem' }}>✅ 준비 완료</p>}
        </div>
      </div>

      {/* 라운드 정보 */}
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#fff3e0', borderRadius: '8px' }}>
        <h3>📊 Round {gameState.round}</h3>
        <p>Phase: <strong>{gameState.phase}</strong></p>
        {gameState.result && <p>🏆 Result: <strong>{gameState.result}</strong></p>}
      </div>

      {/* 전투 필드 */}
      <BattleField
        player1Position={gameState.player1.position}
        player2Position={gameState.player2.position}
        player1IsMe={isPlayer1}
      />

      {/* 전투 로그 */}
      <BattleLog events={isSimulating ? displayedEvents : battleEvents} />

      {/* 카드 선택 */}
      {isMyTurn && !amIReady && (
        <div style={{ marginTop: '2rem' }}>
          <h3>🎴 카드 선택 ({selectedCards.length}/3)</h3>

          {/* 선택된 카드 */}
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
            <strong>선택된 카드:</strong>
            {selectedCards.length === 0 ? (
              <span style={{ marginLeft: '1rem', color: '#999' }}>없음</span>
            ) : (
              <div style={{ marginTop: '0.5rem' }}>
                {selectedCards.map((card, idx) => (
                  <div key={idx} style={{ padding: '0.5rem', background: 'white', marginTop: '0.5rem', borderRadius: '4px' }}>
                    {idx + 1}. {CARD_NAMES[card]}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 카드 목록 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
            {ALL_CARDS.map((card) => (
              <button
                key={card}
                onClick={() => handleCardClick(card)}
                disabled={selectedCards.includes(card) || selectedCards.length >= 3}
                style={{
                  padding: '1rem',
                  cursor: selectedCards.includes(card) || selectedCards.length >= 3 ? 'not-allowed' : 'pointer',
                  background: selectedCards.includes(card) ? '#ddd' : 'white',
                  border: '2px solid #ccc',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                }}
              >
                {CARD_NAMES[card]}
              </button>
            ))}
          </div>

          {/* 제출/리셋 버튼 */}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleSubmit}
              disabled={selectedCards.length !== 3}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                cursor: selectedCards.length === 3 ? 'pointer' : 'not-allowed',
                background: selectedCards.length === 3 ? '#4CAF50' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
              }}
            >
              ✅ 제출하기
            </button>
            <button
              onClick={handleReset}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                cursor: 'pointer',
                background: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
              }}
            >
              🔄 다시 선택
            </button>
          </div>
        </div>
      )}

      {/* 대기 중 */}
      {isMyTurn && amIReady && (
        <div style={{ marginTop: '2rem', padding: '2rem', background: '#fff9c4', borderRadius: '8px', textAlign: 'center' }}>
          <h3>⏳ 상대방을 기다리는 중...</h3>
        </div>
      )}

      {/* 전투 중 - 카드 공개 */}
      <AnimatePresence>
        {currentCardReveal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: '2rem',
              padding: '2rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              textAlign: 'center',
              color: 'white',
            }}
          >
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem' }}>
              🎴 카드 {currentCardReveal.cardIndex + 1} 공개!
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: '2rem' }}>
              <div
                style={{
                  flex: 1,
                  padding: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div style={{ fontSize: '1rem', marginBottom: '0.5rem', opacity: 0.9 }}>
                  {isPlayer1 ? '나' : '상대'}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {CARD_NAMES[currentCardReveal.player1Card]}
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div style={{ fontSize: '1rem', marginBottom: '0.5rem', opacity: 0.9 }}>
                  {isPlayer1 ? '상대' : '나'}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {CARD_NAMES[currentCardReveal.player2Card]}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 전투 중 - 진행률 */}
      {gameState.phase === GamePhase.BATTLE && isSimulating && (
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
            시뮬레이션 진행 중... ({currentEventIndex} / {battleEvents.length})
          </div>
          <div
            style={{
              width: '100%',
              height: '8px',
              background: '#e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentEventIndex / battleEvents.length) * 100}%` }}
              transition={{ duration: 0.3 }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              }}
            />
          </div>
        </div>
      )}

      {/* 게임 종료 */}
      {gameState.phase === GamePhase.ENDED && (
        <div style={{ marginTop: '2rem', padding: '2rem', background: '#c8e6c9', borderRadius: '8px', textAlign: 'center' }}>
          <h2>🏆 게임 종료!</h2>
          <h3>{gameState.result}</h3>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#fee', border: '1px solid #fcc' }}>
          ❌ {error}
        </div>
      )}
    </div>
  )
}

export default App
