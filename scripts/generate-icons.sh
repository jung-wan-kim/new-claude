#!/bin/bash

# macOS 앱 아이콘 생성 스크립트
# 1024x1024 PNG 파일에서 필요한 모든 크기의 아이콘 생성

echo "🎨 Generating app icons..."

# 필요한 디렉토리 생성
mkdir -p assets/icons.iconset

# 기본 아이콘이 없으면 생성
if [ ! -f "assets/icon-1024.png" ]; then
    echo "📝 Creating placeholder icon..."
    # ImageMagick을 사용하여 플레이스홀더 아이콘 생성
    convert -size 1024x1024 xc:transparent \
        -fill '#007acc' -draw 'circle 512,512 512,50' \
        -fill white -pointsize 400 -gravity center -annotate +0+0 'CCC' \
        assets/icon-1024.png
fi

# 다양한 크기의 아이콘 생성
echo "🔄 Resizing icons..."
sips -z 16 16     assets/icon-1024.png --out assets/icons.iconset/icon_16x16.png
sips -z 32 32     assets/icon-1024.png --out assets/icons.iconset/icon_16x16@2x.png
sips -z 32 32     assets/icon-1024.png --out assets/icons.iconset/icon_32x32.png
sips -z 64 64     assets/icon-1024.png --out assets/icons.iconset/icon_32x32@2x.png
sips -z 128 128   assets/icon-1024.png --out assets/icons.iconset/icon_128x128.png
sips -z 256 256   assets/icon-1024.png --out assets/icons.iconset/icon_128x128@2x.png
sips -z 256 256   assets/icon-1024.png --out assets/icons.iconset/icon_256x256.png
sips -z 512 512   assets/icon-1024.png --out assets/icons.iconset/icon_256x256@2x.png
sips -z 512 512   assets/icon-1024.png --out assets/icons.iconset/icon_512x512.png
sips -z 1024 1024 assets/icon-1024.png --out assets/icons.iconset/icon_512x512@2x.png

# .icns 파일 생성
echo "📦 Creating .icns file..."
iconutil -c icns assets/icons.iconset -o assets/icon.icns

# 다른 플랫폼용 아이콘 생성
echo "🖼️ Creating other icons..."
sips -z 256 256 assets/icon-1024.png --out assets/icon.png
sips -z 32 32 assets/icon-1024.png --out assets/tray-icon.png
sips -z 64 64 assets/icon-1024.png --out assets/tray-icon@2x.png

echo "✅ Icon generation complete!"