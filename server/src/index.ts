import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import logger from './utils/logger';

const server = http.createServer(app);

// Socket.IO 설정
const io = new Server(server, {
  cors: {
    origin: config.clientUrl,
    credentials: true,
  },
});

// Socket.IO 연결 핸들러
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// 서버 시작
const startServer = async () => {
  try {
    // 데이터베이스 연결
    await connectDatabase();

    // 서버 시작
    server.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { io };
