import { BattleEvent, BattleEventType } from '../../../shared/types'

interface BattleLogProps {
  events: BattleEvent[]
}

export function BattleLog({ events }: BattleLogProps) {
  if (events.length === 0) {
    return null
  }

  const getEventText = (event: BattleEvent): string => {
    switch (event.type) {
      case BattleEventType.MOVE:
        return `${event.playerId} moved ${event.data.direction}`
      case BattleEventType.DEFEND:
        return `${event.playerId} is defending (-${event.data.amount} damage)`
      case BattleEventType.ATTACK:
        return `${event.playerId} attacks with ${event.data.cardType} ${event.data.hit ? '✓ HIT!' : '✗ MISS'}`
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
              borderLeft: event.type === BattleEventType.DAMAGE_DEALT ? '3px solid #f44336' : '3px solid #4CAF50',
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
