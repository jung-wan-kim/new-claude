# DevOps Engineer - CI/CD Pipeline & Deployment Strategy

## 개요

Claude Code Controller의 빌드, 테스트, 배포를 자동화하기 위한 CI/CD 파이프라인 구축 및 릴리즈 프로세스 정립.

## CI/CD 파이프라인 아키텍처

### 1. GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  # 1. 코드 품질 검사
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Type check
        run: npm run typecheck
      
      - name: Check formatting
        run: npm run format:check

  # 2. 테스트 실행
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
        node: [16, 18, 20]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js ${{ matrix.node }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  # 3. 빌드 검증
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Test build artifacts
        run: |
          node dist/index.js --version
          node dist/index.js --help

  # 4. MCP 연결 테스트
  integration:
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run MCP integration tests
        run: npm run test:mcp
        env:
          CONTEXT7_API_KEY: ${{ secrets.CONTEXT7_API_KEY_TEST }}
```

### 2. Release Workflow

```yaml
# .github/workflows/release.yml
name: Release Pipeline

on:
  push:
    tags:
      - 'v*'

jobs:
  # 1. 릴리즈 빌드
  release-build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        include:
          - os: macos-latest
            platform: darwin
            arch: x64
          - os: macos-latest
            platform: darwin
            arch: arm64
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Package macOS app
        run: |
          ./scripts/build-app.sh
          ./scripts/sign-app.sh
          ./scripts/notarize-app.sh
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          TEAM_ID: ${{ secrets.TEAM_ID }}
      
      - name: Create DMG
        run: ./scripts/create-dmg.sh
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: claude-code-controller-${{ matrix.platform }}-${{ matrix.arch }}
          path: dist-app/*.dmg

  # 2. GitHub 릴리즈 생성
  create-release:
    needs: release-build
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Download artifacts
        uses: actions/download-artifact@v3
      
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            claude-code-controller-*/claude-code-controller-*.dmg
          generate_release_notes: true
          draft: false
          prerelease: ${{ contains(github.ref, 'beta') }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # 3. npm 패키지 배포
  npm-publish:
    needs: release-build
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  # 4. Homebrew 업데이트
  homebrew-update:
    needs: create-release
    runs-on: ubuntu-latest
    
    steps:
      - name: Update Homebrew formula
        uses: mislav/bump-homebrew-formula-action@v2
        with:
          formula-name: claude-code-controller
          tag-name: ${{ github.ref_name }}
        env:
          COMMITTER_TOKEN: ${{ secrets.HOMEBREW_TOKEN }}
```

## 빌드 스크립트

### 1. macOS 앱 빌드 스크립트
```bash
#!/bin/bash
# scripts/build-app.sh

set -e

echo "🏗️  Building Claude Code Controller for macOS..."

# 환경 변수
APP_NAME="Claude Code Controller"
BUNDLE_ID="com.jungwankim.claude-code-controller"
VERSION=$(node -p "require('./package.json').version")
BUILD_DIR="dist-app"

# 클린업
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Node.js 앱 빌드
npm run build

# Electron 패키징
npx electron-packager . "$APP_NAME" \
  --platform=darwin \
  --arch=x64,arm64 \
  --out="$BUILD_DIR" \
  --app-bundle-id="$BUNDLE_ID" \
  --app-version="$VERSION" \
  --icon=assets/icon.icns \
  --overwrite \
  --prune=true \
  --darwin-dark-mode-support

echo "✅ Build complete!"
```

### 2. 코드 서명 스크립트
```bash
#!/bin/bash
# scripts/sign-app.sh

set -e

APP_PATH="dist-app/Claude Code Controller-darwin-x64/Claude Code Controller.app"
ENTITLEMENTS="assets/entitlements.plist"

echo "🔏 Signing app..."

# 코드 서명
codesign --deep --force --verbose --sign "$TEAM_ID" \
  --entitlements "$ENTITLEMENTS" \
  --options runtime \
  "$APP_PATH"

# 검증
codesign --verify --verbose "$APP_PATH"

echo "✅ Code signing complete!"
```

### 3. 노터라이제이션 스크립트
```bash
#!/bin/bash
# scripts/notarize-app.sh

set -e

APP_PATH="dist-app/Claude Code Controller-darwin-x64/Claude Code Controller.app"
ZIP_PATH="dist-app/claude-code-controller.zip"

echo "📦 Preparing for notarization..."

# ZIP 생성
ditto -c -k --keepParent "$APP_PATH" "$ZIP_PATH"

# 노터라이제이션 제출
xcrun altool --notarize-app \
  --primary-bundle-id "com.jungwankim.claude-code-controller" \
  --username "$APPLE_ID" \
  --password "$APPLE_PASSWORD" \
  --team-id "$TEAM_ID" \
  --file "$ZIP_PATH"

echo "⏳ Notarization submitted. Waiting for result..."

# 결과 대기 (실제로는 더 복잡한 폴링 로직 필요)
sleep 300

# 스테이플링
xcrun stapler staple "$APP_PATH"

echo "✅ Notarization complete!"
```

## Docker 컨테이너화

### Dockerfile
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# 의존성 캐싱
COPY package*.json ./
RUN npm ci --only=production

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# 런타임 이미지
FROM node:18-alpine

WORKDIR /app

# 필요한 파일만 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# 비루트 사용자 생성
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  claude-code-controller:
    build: .
    container_name: ccc
    environment:
      - NODE_ENV=production
      - CONTEXT7_API_KEY=${CONTEXT7_API_KEY}
    volumes:
      - ~/.claude-code-controller:/home/nodejs/.claude-code-controller
    restart: unless-stopped
```

## 릴리즈 프로세스

### 1. 버전 관리
```json
{
  "scripts": {
    "version:patch": "npm version patch && git push --follow-tags",
    "version:minor": "npm version minor && git push --follow-tags",
    "version:major": "npm version major && git push --follow-tags",
    "preversion": "npm test && npm run lint",
    "postversion": "npm run build"
  }
}
```

### 2. 릴리즈 체크리스트
```markdown
# Release Checklist

## Pre-release
- [ ] All tests passing
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Documentation updated
- [ ] Breaking changes documented

## Release
- [ ] Tag created
- [ ] CI/CD pipeline successful
- [ ] Artifacts uploaded
- [ ] Release notes published

## Post-release
- [ ] npm package published
- [ ] Homebrew formula updated
- [ ] Documentation site updated
- [ ] Social media announcement
```

### 3. 자동 체인지로그 생성
```javascript
// scripts/generate-changelog.js
const conventionalChangelog = require('conventional-changelog');
const fs = require('fs');

const stream = conventionalChangelog({
  preset: 'angular',
  releaseCount: 0
});

let changelog = '';
stream.on('data', (chunk) => {
  changelog += chunk.toString();
});

stream.on('end', () => {
  fs.writeFileSync('CHANGELOG.md', changelog);
  console.log('Changelog generated!');
});
```

## 모니터링 및 알림

### 1. 빌드 상태 배지
```markdown
[![CI](https://github.com/jung-wan-kim/new-claude/actions/workflows/ci.yml/badge.svg)](https://github.com/jung-wan-kim/new-claude/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/jung-wan-kim/new-claude/branch/main/graph/badge.svg)](https://codecov.io/gh/jung-wan-kim/new-claude)
[![npm version](https://badge.fury.io/js/claude-code-controller.svg)](https://badge.fury.io/js/claude-code-controller)
```

### 2. Slack 통합
```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: |
      Build ${{ job.status }} for ${{ github.ref }}
      Commit: ${{ github.sha }}
      Author: ${{ github.actor }}
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## 보안 고려사항

### 1. 시크릿 관리
- GitHub Secrets 사용
- 환경별 분리
- 정기적 로테이션

### 2. 의존성 스캔
```yaml
- name: Security Audit
  run: |
    npm audit --production
    npx snyk test
```

### 3. SAST (Static Application Security Testing)
```yaml
- name: CodeQL Analysis
  uses: github/codeql-action/analyze@v2
```

## 성능 최적화

### 1. 빌드 캐싱
- node_modules 캐싱
- Docker 레이어 캐싱
- 아티팩트 캐싱

### 2. 병렬 실행
- 매트릭스 빌드
- 독립적인 job 병렬화
- 테스트 샤딩

### 3. 최적화된 빌드
- Tree shaking
- 코드 minification
- Dead code elimination