#!/bin/bash

# Production deployment script
echo "🚀 Starting production deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Build client
echo "🔨 Building client..."
npm run build:client

# Check if build was successful
if [ ! -d "client/dist" ]; then
    echo "❌ Client build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Client built to: client/dist"
echo ""
echo "🎯 Next steps:"
echo "1. Deploy the server folder to your hosting platform"
echo "2. Set NODE_ENV=production"
echo "3. Set PORT to your platform's requirements"
echo "4. Start with: npm start"
echo ""
echo "🌐 Your game will be available at your hosting URL"