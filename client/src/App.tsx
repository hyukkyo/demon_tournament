import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

function App() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const newSocket = io('http://localhost:3000')
    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log('Connected to server')
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server')
      setConnected(false)
    })

    newSocket.on('pong', (data: { message: string }) => {
      setMessage(data.message)
    })

    return () => {
      newSocket.close()
    }
  }, [])

  const sendPing = () => {
    if (socket) {
      socket.emit('ping')
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Demon Tournament - Card Game</h1>
      <div style={{ marginTop: '2rem' }}>
        <p>Server Status: <strong>{connected ? '🟢 Connected' : '🔴 Disconnected'}</strong></p>
        <button
          onClick={sendPing}
          disabled={!connected}
          style={{
            padding: '0.5rem 1rem',
            marginTop: '1rem',
            cursor: connected ? 'pointer' : 'not-allowed'
          }}
        >
          Send Ping
        </button>
        {message && (
          <p style={{ marginTop: '1rem' }}>
            Server Response: <strong>{message}</strong>
          </p>
        )}
      </div>
    </div>
  )
}

export default App
