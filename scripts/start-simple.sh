#!/bin/bash

# Budget Manager 2025 - Simple Start Script
# Einfache, robuste Lösung ohne ES Modules

echo "🎯 Budget Manager 2025 - Simple Start"
echo "====================================="

# Function to cleanup
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "npm.*run.*dev" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "pdftocairo" 2>/dev/null || true
    sleep 2
    echo "✅ Cleanup complete"
    exit 0
}

# Trap signals
trap cleanup SIGINT SIGTERM

# Step 1: Cleanup existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "npm.*run.*dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "pdftocairo" 2>/dev/null || true
sleep 2

# Step 2: Free ports
echo "🔧 Freeing ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 1

# Step 3: Start Backend
echo "🚀 Starting Backend..."
cd backend
PORT=3001 node src/server.js &
BACKEND_PID=$!
cd ..

# Wait for backend
echo "⏳ Waiting for backend..."
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Backend started successfully"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend startup timeout"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Step 4: Start Frontend
echo "🚀 Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend
echo "⏳ Waiting for frontend..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend started successfully"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Frontend startup timeout"
        kill $FRONTEND_PID 2>/dev/null || true
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

echo ""
echo "🎉 All services started successfully!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep alive
wait






