#!/bin/bash

echo "🛑 Stopping Demon Tournament Servers..."

# Node 프로세스 종료
pkill -f "node.*demon"
pkill -f "vite"
pkill -f "nodemon"

echo "✅ All servers stopped"
