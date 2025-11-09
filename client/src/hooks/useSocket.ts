import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type {
  GameState,
  BattleEvent,
  CardSelection,
} from '../../../shared/types'

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [battleEvents, setBattleEvents] = useState<BattleEvent[]>([])
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const newSocket = io('http://localhost:3000')
    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log('✅ Connected to server:', newSocket.id)
      setConnected(true)
      setError('')
    })

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server')
      setConnected(false)
    })

    newSocket.on('matchFound', (state: GameState) => {
      console.log('🎮 Match found!')
      setGameState(state)
    })

    newSocket.on('gameStateUpdate', (state: GameState) => {
      console.log('📊 Game state updated')
      setGameState(state)
    })

    newSocket.on('battleEvents', (events: BattleEvent[]) => {
      console.log('⚔️  Battle events received:', events.length)
      setBattleEvents(events)
    })

    newSocket.on('error', (message: string) => {
      console.error('❌ Error from server:', message)
      setError(message)
    })

    return () => {
      newSocket.close()
    }
  }, [])

  const joinMatchmaking = useCallback(() => {
    if (socket) {
      console.log('🔍 Joining matchmaking...')
      socket.emit('joinMatchmaking')
    }
  }, [socket])

  const selectCards = useCallback(
    (cards: CardSelection) => {
      if (socket) {
        console.log('🎴 Selecting cards:', cards)
        socket.emit('selectCards', cards)
      }
    },
    [socket]
  )

  // 내 플레이어 ID
  const myPlayerId = socket?.id || ''

  return {
    connected,
    gameState,
    battleEvents,
    error,
    myPlayerId,
    joinMatchmaking,
    selectCards,
  }
}
