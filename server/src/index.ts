import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { MatchmakingService } from './services/MatchmakingService';
import { setupGameHandlers } from './socket/gameHandler';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173', // Vite 기본 포트
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// 매칭 서비스 인스턴스
const matchmakingService = new MatchmakingService();

// 기본 라우트
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// 서버 통계 API
app.get('/stats', (req, res) => {
  const stats = matchmakingService.getStats();
  res.json(stats);
});

// Socket.IO 연결 처리
io.on('connection', (socket) => {
  setupGameHandlers(socket, matchmakingService);
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║  🎮 Demon Tournament Server         ║
║                                      ║
║  🚀 Server: http://localhost:${PORT}   ║
║  📡 WebSocket: Ready                 ║
║  🎯 Game Engine: Loaded              ║
╚══════════════════════════════════════╝
  `);
});
