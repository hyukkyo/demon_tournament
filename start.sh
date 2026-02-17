#!/bin/bash

echo "🚀 Starting Demon Tournament Development Servers..."
echo ""

# 서버 로그 디렉토리 생성
mkdir -p server/logs

# 터미널 색상
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 백엔드 서버 시작
echo -e "${BLUE}Starting Backend Server...${NC}"
cd server
npm run dev &
SERVER_PID=$!
cd ..

# 잠시 대기 (서버가 시작될 시간)
sleep 3

# 프론트엔드 서버 시작
echo -e "${GREEN}Starting Frontend Server...${NC}"
cd client
npm run dev &
CLIENT_PID=$!
cd ..

echo ""
echo "✅ Servers started!"
echo "📦 Backend: http://localhost:3000"
echo "🎨 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"

# Ctrl+C 핸들러
trap "echo 'Stopping servers...'; kill $SERVER_PID $CLIENT_PID; exit" INT

# 서버들이 종료될 때까지 대기
wait
