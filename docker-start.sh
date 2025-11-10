#!/bin/bash
# Docker Quick Start Script

echo "🐳 Starting NT219 E-commerce Application..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Build images
echo "📦 Building Docker images..."
docker-compose build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed"
echo ""

# Start containers
echo "🚀 Starting containers..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start containers!"
    exit 1
fi

echo "✅ Containers started"
echo ""

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check health
echo "🏥 Checking health..."
docker-compose ps

echo ""
echo "✅ Application is ready!"
echo ""
echo "📍 Access points:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   MongoDB:  localhost:27017"
echo "   Vault:    http://localhost:8200"
echo ""
echo "📝 View logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stop application:"
echo "   docker-compose down"
