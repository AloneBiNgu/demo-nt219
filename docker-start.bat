@echo off
REM Docker Quick Start Script for Windows

echo 🐳 Starting NT219 E-commerce Application...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Build images
echo 📦 Building Docker images...
docker-compose build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo ✅ Build completed
echo.

REM Start containers
echo 🚀 Starting containers...
docker-compose up -d

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to start containers!
    pause
    exit /b 1
)

echo ✅ Containers started
echo.

REM Wait for services
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check health
echo 🏥 Checking health...
docker-compose ps

echo.
echo ✅ Application is ready!
echo.
echo 📍 Access points:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo    MongoDB:  localhost:27017
echo    Vault:    http://localhost:8200
echo.
echo 📝 View logs:
echo    docker-compose logs -f
echo.
echo 🛑 Stop application:
echo    docker-compose down
echo.
pause
