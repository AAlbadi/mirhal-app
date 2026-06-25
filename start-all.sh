#!/bin/bash

# Function to kill all background processes on script exit
cleanup() {
    echo "Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

echo "Starting Mirhal Ecosystem..."

# 1. Start Backend in background
echo "-> Starting Backend (Port 5001)..."
# Fix crash by removing duplicate admin user if exists
node server/scripts/fix-crash.js
cd server && npm run dev &
BACKEND_PID=$!
# cd .. (Removed incorrect directory change)

# Wait a bit for backend to initialize
sleep 5

# 2. Start Web Frontend in background
echo "-> Starting Web Frontend..."
npm run dev &
FRONTEND_PID=$!

# 3. Start Mobile App
echo "-> Starting Mobile App (Expo)..."
cd mirhal-mobile-app && npx expo start

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
