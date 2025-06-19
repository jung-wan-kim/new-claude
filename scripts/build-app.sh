#!/bin/bash

echo "🏗️  Building Claude Code Controller..."
echo "===================================="

# 1. 환경 변수 체크
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from example..."
    cp .env.example .env
fi

# 2. 의존성 설치
echo "📦 Installing dependencies..."
npm install

# 3. 코드 빌드
echo "🔨 Building TypeScript..."
npm run build

# 4. 아이콘 준비
if [ ! -f "assets/icon.icns" ]; then
    echo "🎨 Generating app icons..."
    node scripts/create-placeholder-icon.js
fi

# 5. Electron 앱 빌드
echo "📱 Building Electron app..."
npm run dist:mac

echo ""
echo "✅ Build complete!"
echo "📁 Output directory: dist-app/"
echo ""
echo "To install the app:"
echo "  1. Open dist-app/ folder"
echo "  2. Drag 'Claude Code Controller.app' to Applications"
echo ""