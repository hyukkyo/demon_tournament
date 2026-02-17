#!/bin/bash

echo "📦 Installing dependencies for Demon Tournament..."

# 백엔드 설치
echo ""
echo "📦 Installing backend dependencies..."
cd server
npm install
cp .env.example .env
cd ..

# 프론트엔드 설치
echo ""
echo "📦 Installing frontend dependencies..."
cd client
npm install
cp .env.example .env
cd ..

echo ""
echo "✅ Installation complete!"
echo ""
echo "⚙️  Next steps:"
echo "1. Edit server/.env and set your MongoDB URI"
echo "2. Edit client/.env if needed"
echo "3. Start MongoDB (if using local)"
echo "4. Run: ./start.sh"
