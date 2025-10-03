@echo off
REM Production deployment script for Windows

echo 🚀 Starting production deployment...

REM Install dependencies
echo 📦 Installing dependencies...
call npm run install:all

REM Build client
echo 🔨 Building client...
call npm run build:client

REM Check if build was successful
if not exist "client\dist" (
    echo ❌ Client build failed!
    exit /b 1
)

echo ✅ Build completed successfully!
echo 📁 Client built to: client\dist
echo.
echo 🎯 Next steps:
echo 1. Deploy the server folder to your hosting platform
echo 2. Set NODE_ENV=production
echo 3. Set PORT to your platform's requirements
echo 4. Start with: npm start
echo.
echo 🌐 Your game will be available at your hosting URL

pause