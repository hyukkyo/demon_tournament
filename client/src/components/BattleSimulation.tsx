import { useState, useEffect } from 'react'
import { BattleEvent, BattleEventType, GameState, CardType } from '../../../shared/types'
import { motion, AnimatePresence } from 'framer-motion'

interface BattleSimulationProps {
  events: BattleEvent[]
  initialState: GameState
  onSimulationComplete: (finalState: GameState) => void
}

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

export function BattleSimulation({ events, initialState, onSimulationComplete }: BattleSimulationProps) {
  const [currentEventIndex, setCurrentEventIndex] = useState(0)
  const [displayedEvents, setDisplayedEvents] = useState<BattleEvent[]>([])
  const [currentCardIndex, setCurrentCardIndex] = useState<number | null>(null)
  const [revealedCards, setRevealedCards] = useState<{
    player1Card: CardType | null
    player2Card: CardType | null
  }>({ player1Card: null, player2Card: null })

  useEffect(() => {
    if (currentEventIndex >= events.length) {
      // 시뮬레이션 완료
      setTimeout(() => {
        onSimulationComplete(initialState)
      }, 1000)
      return
    }

    const currentEvent = events[currentEventIndex]

    // 카드 공개 이벤트 처리
    if (currentEvent.type === BattleEventType.CARD_REVEAL) {
      setCurrentCardIndex(currentEvent.data.cardIndex)
      setRevealedCards({
        player1Card: currentEvent.data.player1Card,
        player2Card: currentEvent.data.player2Card,
      })
      // 카드 공개 후 1초 대기
      setTimeout(() => {
        setDisplayedEvents([...displayedEvents, currentEvent])
        setCurrentEventIndex(currentEventIndex + 1)
      }, 1500)
      return
    }

    // 일반 이벤트 처리
    setDisplayedEvents([...displayedEvents, currentEvent])

    // 게임 종료 이벤트면 더 긴 딜레이
    if (currentEvent.type === BattleEventType.GAME_END) {
      setTimeout(() => {
        setCurrentEventIndex(currentEventIndex + 1)
      }, 2000)
    } else {
      // 일반 이벤트는 짧은 딜레이
      setTimeout(() => {
        setCurrentEventIndex(currentEventIndex + 1)
      }, 600)
    }
  }, [currentEventIndex, events, displayedEvents, initialState, onSimulationComplete])

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* 카드 공개 표시 */}
      <AnimatePresence>
        {currentCardIndex !== null && revealedCards.player1Card && revealedCards.player2Card && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{
              padding: '2rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              marginBottom: '2rem',
              textAlign: 'center',
              color: 'white',
            }}
          >
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem' }}>
              🎴 카드 {currentCardIndex + 1} 공개!
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
                <div style={{ fontSize: '1rem', marginBottom: '0.5rem', opacity: 0.9 }}>플레이어 1</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {CARD_NAMES[revealedCards.player1Card]}
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
                <div style={{ fontSize: '1rem', marginBottom: '0.5rem', opacity: 0.9 }}>플레이어 2</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {CARD_NAMES[revealedCards.player2Card]}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 진행률 표시 */}
      <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
          시뮬레이션 진행 중... ({currentEventIndex} / {events.length})
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
            animate={{ width: `${(currentEventIndex / events.length) * 100}%` }}
            transition={{ duration: 0.3 }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
