import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import logger from './utils/logger';
import { setupSocketHandlers } from './socket/socket.handler';
import { seedDatabase } from './utils/seed';

const server = http.createServer(app);

// Socket.IO 설정
const io = new Server(server, {
  cors: {
    origin: config.clientUrl,
    credentials: true,
  },
});

// Socket.IO 핸들러 설정
setupSocketHandlers(io);

// 서버 시작
const startServer = async () => {
  try {
    // 데이터베이스 연결
    await connectDatabase();
    
    // 데이터베이스 시드
    await seedDatabase();

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
