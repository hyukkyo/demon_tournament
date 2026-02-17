# Demon Tournament

1대1 멀티플레이 턴제 전략 배틀 게임

## 프로젝트 구조

```
demon_tournament/
├── client/          # React 프론트엔드
├── server/          # Node.js 백엔드
└── docs/            # 문서
```

## 시작하기

### 사전 요구사항

- Node.js 18+
- MongoDB (로컬 또는 MongoDB Atlas)
- npm 또는 yarn

### 설치 방법

#### 1. 백엔드 설정

```bash
cd server
npm install
cp .env.example .env
# .env 파일을 열어 환경변수 설정
```

`.env` 파일 설정:
```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/demon_tournament
CLIENT_URL=http://localhost:5173
LOG_LEVEL=info
```

#### 2. 프론트엔드 설정

```bash
cd client
npm install
cp .env.example .env
```

`.env` 파일 설정:
```
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
VITE_ENV=development
```

### 실행 방법

#### 개발 모드

터미널 1 - 백엔드 실행:
```bash
cd server
npm run dev
```

터미널 2 - 프론트엔드 실행:
```bash
cd client
npm run dev
```

또는 루트 디렉토리에서:
```bash
./start.sh
```

#### 서버 확인
- 백엔드: http://localhost:3000
- 프론트엔드: http://localhost:5173
- Health Check: http://localhost:3000/api/health

### MongoDB 설정

#### 로컬 MongoDB 사용
```bash
# MongoDB 설치 (Ubuntu)
sudo apt-get install mongodb

# MongoDB 시작
sudo systemctl start mongodb
```

#### MongoDB Atlas 사용 (클라우드)
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 가입
2. 무료 클러스터 생성
3. 연결 문자열 복사
4. `server/.env`의 `MONGODB_URI`에 붙여넣기

## 개발 상태

### Phase 1: 기반 구조 ✅ (완료)
- [x] 프로젝트 초기 구조 생성
- [x] 패키지 설치 및 기본 설정
- [x] TypeScript 설정
- [x] ESLint, Prettier 설정
- [x] 기본 서버 구축
- [x] Socket.IO 연결 설정
- [x] MongoDB 연결 설정
- [x] Health Check API
- [x] 기본 클라이언트 구축
- [x] 전역 상태 관리 설정

### Phase 2: 게임 시스템 개발 (진행 예정)
- [ ] 매칭 시스템
- [ ] 캐릭터 & 카드 시스템
- [ ] 배틀 시스템

## 문서

- [개발 계획서](./docs/plan/development_plan.md)
- [게임 디자인 문서](./docs/plan/game_design_document.md)
- [백엔드 설계](./docs/plan/backend_design.md)
- [프론트엔드 설계](./docs/plan/frontend_design.md)

## 스크립트

### 백엔드
- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm start` - 프로덕션 서버 실행
- `npm test` - 테스트 실행
- `npm run lint` - 린트 검사
- `npm run format` - 코드 포맷팅

### 프론트엔드
- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run preview` - 빌드 미리보기
- `npm test` - 테스트 실행
- `npm run lint` - 린트 검사
- `npm run format` - 코드 포맷팅

## 라이센스

MIT
