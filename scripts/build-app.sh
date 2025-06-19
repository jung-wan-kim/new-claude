#!/bin/bash
# Build script for macOS app

set -e

echo "🏗️  Building Claude Code Controller for macOS..."

# 환경 변수
APP_NAME="Claude Code Controller"
BUNDLE_ID="com.jungwankim.claude-code-controller"
VERSION=$(node -p "require('./package.json').version")
BUILD_DIR="dist-app"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 클린업
echo "🧹 Cleaning previous build..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Node.js 앱 빌드
echo "📦 Building Node.js application..."
npm run build

# 앱 구조 생성
echo "🏗️  Creating app structure..."
APP_DIR="$BUILD_DIR/$APP_NAME.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# 실행 파일 복사
echo "📋 Copying files..."
cp -r dist/* "$RESOURCES_DIR/"
cp -r node_modules "$RESOURCES_DIR/"
cp package.json "$RESOURCES_DIR/"

# 아이콘 복사 (있는 경우)
if [ -f "assets/icon.icns" ]; then
  cp assets/icon.icns "$RESOURCES_DIR/"
fi

# 실행 스크립트 생성
cat > "$MACOS_DIR/claude-code-controller" << 'EOF'
#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/../Resources"
/usr/local/bin/node dist/index.js "$@"
EOF

chmod +x "$MACOS_DIR/claude-code-controller"

# Info.plist 생성
cat > "$CONTENTS_DIR/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>claude-code-controller</string>
    <key>CFBundleIdentifier</key>
    <string>$BUNDLE_ID</string>
    <key>CFBundleName</key>
    <string>$APP_NAME</string>
    <key>CFBundleVersion</key>
    <string>$VERSION</string>
    <key>CFBundleShortVersionString</key>
    <string>$VERSION</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleIconFile</key>
    <string>icon.icns</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

echo -e "${GREEN}✅ Build complete!${NC}"
echo -e "📍 App location: ${YELLOW}$APP_DIR${NC}"

# 크기 정보 출력
APP_SIZE=$(du -sh "$APP_DIR" | cut -f1)
echo -e "📊 App size: ${YELLOW}$APP_SIZE${NC}"