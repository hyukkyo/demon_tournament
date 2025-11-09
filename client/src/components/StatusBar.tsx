import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

interface StatusBarProps {
  label: string
  current: number
  max: number
  color: string
  showChange?: boolean
}

export function StatusBar({ label, current, max, color, showChange = true }: StatusBarProps) {
  const [change, setChange] = useState<number | null>(null)
  const [prevValue, setPrevValue] = useState(current)

  useEffect(() => {
    if (showChange && current !== prevValue) {
      const diff = current - prevValue
      setChange(diff)
      setPrevValue(current)

      // 2초 후 사라짐
      setTimeout(() => setChange(null), 2000)
    }
  }, [current, prevValue, showChange])

  const percentage = (current / max) * 100

  return (
    <div style={{ marginBottom: '0.5rem', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{label}</span>
        <span style={{ fontSize: '0.9rem' }}>
          {current} / {max}
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: '20px',
          backgroundColor: '#e0e0e0',
          borderRadius: '10px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <motion.div
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
          style={{
            height: '100%',
            backgroundColor: color,
            borderRadius: '10px',
          }}
        />
      </div>

      {/* 변화량 표시 */}
      <AnimatePresence>
        {change !== null && change !== 0 && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -30 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            style={{
              position: 'absolute',
              right: '0',
              top: '-10px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: change > 0 ? '#4CAF50' : '#f44336',
              pointerEvents: 'none',
            }}
          >
            {change > 0 ? '+' : ''}
            {change}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
