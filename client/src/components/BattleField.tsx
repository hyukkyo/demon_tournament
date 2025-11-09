import { motion } from 'framer-motion'
import { Position } from '../../../shared/types'

interface BattleFieldProps {
  player1Position: Position
  player2Position: Position
  player1IsMe: boolean
}

export function BattleField({ player1Position, player2Position, player1IsMe }: BattleFieldProps) {
  const FIELD_WIDTH = 4
  const FIELD_HEIGHT = 3
  const CELL_SIZE = 100

  const renderCell = (x: number, y: number) => {
    return (
      <div
        key={`${x}-${y}`}
        style={{
          width: `${CELL_SIZE}px`,
          height: `${CELL_SIZE}px`,
          border: '2px solid #ddd',
          backgroundColor: '#f5f5f5',
          position: 'relative',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            fontSize: '0.7rem',
            color: '#999',
          }}
        >
          {x},{y}
        </span>
      </div>
    )
  }

  // 절대 위치로 캐릭터 배치
  const renderCharacter = (position: Position, isPlayer1Char: boolean) => {
    const isMe = player1IsMe === isPlayer1Char
    const label = isMe ? '🟦 나' : '🟥 상대'
    const bgColor = isMe ? '#e3f2fd' : '#ffebee'
    const color = isMe ? '#1976d2' : '#d32f2f'

    return (
      <motion.div
        key={isPlayer1Char ? 'player1' : 'player2'}
        initial={false}
        animate={{
          x: position.x * (CELL_SIZE + 4),
          y: position.y * (CELL_SIZE + 4),
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        style={{
          position: 'absolute',
          width: `${CELL_SIZE}px`,
          height: `${CELL_SIZE}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bgColor,
          border: '3px solid',
          borderColor: color,
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: 'bold',
          color: color,
          zIndex: 10,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          pointerEvents: 'none',
        }}
      >
        {label}
      </motion.div>
    )
  }

  const cells = []
  for (let y = 0; y < FIELD_HEIGHT; y++) {
    for (let x = 0; x < FIELD_WIDTH; x++) {
      cells.push(renderCell(x, y))
    }
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>⚔️ 전투 필드</h3>
      <div
        style={{
          position: 'relative',
          width: `${FIELD_WIDTH * CELL_SIZE + (FIELD_WIDTH - 1) * 4}px`,
          height: `${FIELD_HEIGHT * CELL_SIZE + (FIELD_HEIGHT - 1) * 4}px`,
          margin: '1rem auto',
        }}
      >
        {/* 그리드 배경 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${FIELD_WIDTH}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${FIELD_HEIGHT}, ${CELL_SIZE}px)`,
            gap: '4px',
          }}
        >
          {cells}
        </div>

        {/* 캐릭터들 (절대 위치) - 별도 레이어 */}
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
