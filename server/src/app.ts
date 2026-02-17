import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

// CORS 설정
const corsOptions = {
  origin: config.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

// 기본 라우트
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Demon Tournament Server',
    version: '1.0.0',
  });
});

// 에러 핸들러 (마지막에 위치)
app.use(errorHandler);

export default app;
