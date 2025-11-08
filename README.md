# Demon Tournament - Web-based 1v1 Turn-based Card Game

웹 기반 1대1 턴제 카드 게임 프로젝트입니다.

## 프로젝트 구조

```
demon_tournament/
├── client/          # 프론트엔드 (React + Vite + TypeScript)
├── server/          # 백엔드 (Express + TypeScript + Socket.IO)
├── shared/          # 공유 타입 정의
└── CLAUDE.md        # 개발 계획서
```

## 기술 스택

### Frontend
- React 18
- TypeScript
- Vite
- Socket.IO-Client
- Zustand (상태 관리)

### Backend
- Node.js 20+
- TypeScript
- Express.js
- Socket.IO
- Jest (테스트)

## 시작하기

### 사전 요구사항
- Node.js 20 이상
- npm 또는 yarn

### 설치 및 실행

1. **백엔드 서버 실행**
```bash
cd server
npm install
npm run dev
```
서버가 http://localhost:3000 에서 실행됩니다.

2. **프론트엔드 클라이언트 실행**
```bash
cd client
npm install
npm run dev
```
클라이언트가 http://localhost:5173 에서 실행됩니다.

## 개발 상태

현재 1단계 (기본 환경 설정) 완료:
- [x] 프로젝트 구조 설계
- [x] Backend 초기화
- [x] Frontend 초기화
- [x] Socket.IO 기본 통신 확인

## 게임 규칙

자세한 게임 규칙은 [CLAUDE.md](CLAUDE.md)를 참조하세요.

## 라이선스

MIT
