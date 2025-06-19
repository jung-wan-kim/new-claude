# Claude Code Controller (CCC) DevOps 전략

## 1. 빌드 파이프라인 설계

### 1.1 TypeScript 컴파일 전략

```yaml
# tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  },
  "include": ["src/**/*"],
  "exclude": ["src/**/*.test.ts", "src/**/*.spec.ts"]
}
```

### 1.2 번들링 전략 (esbuild)

```javascript
// build/esbuild.config.js
import { build } from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';

const buildConfigs = [
  {
    // Main process bundle
    entryPoints: ['src/main/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: 'dist/main.js',
    format: 'cjs',
    sourcemap: true,
    minify: process.env.NODE_ENV === 'production',
    plugins: [nodeExternalsPlugin()],
    define: {
      'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'production'}"`,
      '__VERSION__': `"${process.env.npm_package_version}"`
    }
  },
  {
    // CLI bundle
    entryPoints: ['src/cli/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: 'dist/cli.js',
    format: 'cjs',
    banner: {
      js: '#!/usr/bin/env node'
    },
    external: ['./main.js']
  }
];

// Build all configurations
Promise.all(buildConfigs.map(config => build(config)))
  .catch(() => process.exit(1));
```

### 1.3 의존성 관리

```json
// package.json
{
  "scripts": {
    "prebuild": "npm run clean && npm run lint",
    "build": "npm run build:ts && npm run build:bundle",
    "build:ts": "tsc -p tsconfig.build.json",
    "build:bundle": "node build/esbuild.config.js",
    "postbuild": "npm run copy:assets",
    "copy:assets": "cp -r src/assets dist/",
    "clean": "rm -rf dist .tsbuildinfo"
  },
  "bundledDependencies": [
    "@modelcontextprotocol/sdk",
    "blessed",
    "ink"
  ],
  "optionalDependencies": {
    "fsevents": "^2.3.2"
  }
}
```

## 2. macOS 앱 패키징

### 2.1 pkg를 사용한 독립 실행 파일 생성

```javascript
// build/pkg.config.js
module.exports = {
  pkg: {
    scripts: 'dist/**/*.js',
    assets: [
      'dist/assets/**/*',
      'node_modules/blessed/**/*'
    ],
    targets: [
      'node18-macos-arm64',
      'node18-macos-x64'
    ],
    outputPath: 'release'
  }
};
```

```bash
# build/package.sh
#!/bin/bash
set -e

VERSION=$(node -p "require('./package.json').version")
APP_NAME="claude-code-controller"

# Build the application
npm run build

# Create pkg bundles
npx pkg dist/cli.js \
  --config build/pkg.config.js \
  --output "release/${APP_NAME}-${VERSION}"

# Create universal binary
lipo -create \
  "release/${APP_NAME}-${VERSION}-macos-arm64" \
  "release/${APP_NAME}-${VERSION}-macos-x64" \
  -output "release/${APP_NAME}-${VERSION}-macos-universal"

# Set executable permissions
chmod +x "release/${APP_NAME}-${VERSION}-macos-universal"
```

### 2.2 코드 서명 및 공증

```bash
# build/sign-and-notarize.sh
#!/bin/bash
set -e

APP_PATH="$1"
DEVELOPER_ID="$APPLE_DEVELOPER_ID"
APP_PASSWORD="$APPLE_APP_PASSWORD"
TEAM_ID="$APPLE_TEAM_ID"

# Code signing
codesign --force --deep --verbose \
  --sign "$DEVELOPER_ID" \
  --options runtime \
  --entitlements build/entitlements.plist \
  "$APP_PATH"

# Verify signature
codesign --verify --verbose "$APP_PATH"

# Create ZIP for notarization
ditto -c -k --keepParent "$APP_PATH" "${APP_PATH}.zip"

# Submit for notarization
xcrun notarytool submit "${APP_PATH}.zip" \
  --apple-id "$APPLE_ID" \
  --password "$APP_PASSWORD" \
  --team-id "$TEAM_ID" \
  --wait

# Staple the ticket
xcrun stapler staple "$APP_PATH"
```

```xml
<!-- build/entitlements.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    <key>com.apple.security.automation.apple-events</key>
    <true/>
</dict>
</plist>
```

### 2.3 DMG 생성

```javascript
// build/create-dmg.js
const createDMG = require('electron-installer-dmg');
const path = require('path');

async function buildDMG() {
  const version = require('../package.json').version;
  
  await createDMG({
    appPath: `release/claude-code-controller-${version}-macos-universal`,
    name: 'Claude Code Controller',
    title: 'Claude Code Controller',
    icon: 'assets/icon.icns',
    background: 'assets/dmg-background.png',
    contents: [
      { x: 448, y: 344, type: 'link', path: '/Applications' },
      { x: 192, y: 344, type: 'file' }
    ],
    out: 'release/',
    overwrite: true
  });
}

buildDMG().catch(console.error);
```

## 3. CI/CD 파이프라인

### 3.1 GitHub Actions 워크플로우

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  release:
    types: [created]

env:
  NODE_VERSION: '18.x'

jobs:
  # 코드 품질 검사
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Security audit
        run: npm audit --production

  # 테스트
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-12, macos-13, macos-14]
        node: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  # 빌드
  build:
    needs: [quality, test]
    runs-on: macos-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Package application
        run: ./build/package.sh
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: release/

  # 릴리스
  release:
    needs: build
    if: github.event_name == 'release'
    runs-on: macos-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-artifacts
          path: release/
      
      - name: Import certificates
        env:
          CERTIFICATES_P12: ${{ secrets.CERTIFICATES_P12 }}
          CERTIFICATES_PASSWORD: ${{ secrets.CERTIFICATES_PASSWORD }}
        run: |
          echo $CERTIFICATES_P12 | base64 --decode > certificate.p12
          security create-keychain -p actions temp.keychain
          security import certificate.p12 -k temp.keychain -P $CERTIFICATES_PASSWORD -T /usr/bin/codesign
          security list-keychains -s temp.keychain
          security default-keychain -s temp.keychain
          security unlock-keychain -p actions temp.keychain
          security set-key-partition-list -S apple-tool:,apple: -s -k actions temp.keychain
      
      - name: Sign and notarize
        env:
          APPLE_DEVELOPER_ID: ${{ secrets.APPLE_DEVELOPER_ID }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_PASSWORD: ${{ secrets.APPLE_APP_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        run: |
          ./build/sign-and-notarize.sh "release/claude-code-controller-*-macos-universal"
      
      - name: Create DMG
        run: node build/create-dmg.js
      
      - name: Upload release assets
        uses: softprops/action-gh-release@v1
        with:
          files: |
            release/*.dmg
            release/*-macos-universal
```

### 3.2 자동화된 테스트

```typescript
// tests/e2e/smoke.test.ts
import { spawn } from 'child_process';
import { expect } from '@jest/globals';

describe('Smoke Tests', () => {
  test('CLI starts without errors', async () => {
    const proc = spawn('./dist/cli.js', ['--version']);
    
    const output = await new Promise<string>((resolve) => {
      let data = '';
      proc.stdout.on('data', chunk => data += chunk);
      proc.on('close', () => resolve(data));
    });
    
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });
  
  test('Can connect to MCP servers', async () => {
    const proc = spawn('./dist/cli.js', ['test-connection']);
    
    const exitCode = await new Promise<number>((resolve) => {
      proc.on('close', code => resolve(code));
    });
    
    expect(exitCode).toBe(0);
  });
});
```

## 4. 배포 전략

### 4.1 Homebrew 배포

```ruby
# Formula/claude-code-controller.rb
class ClaudeCodeController < Formula
  desc "Intelligent terminal program for controlling Claude Code"
  homepage "https://github.com/yourusername/claude-code-controller"
  version "1.0.0"
  
  if OS.mac? && Hardware::CPU.arm?
    url "https://github.com/yourusername/claude-code-controller/releases/download/v#{version}/claude-code-controller-#{version}-macos-arm64.tar.gz"
    sha256 "ARM64_SHA256_HERE"
  else
    url "https://github.com/yourusername/claude-code-controller/releases/download/v#{version}/claude-code-controller-#{version}-macos-x64.tar.gz"
    sha256 "X64_SHA256_HERE"
  end
  
  def install
    bin.install "claude-code-controller" => "ccc"
  end
  
  def post_install
    # Create config directory
    (var/"claude-code-controller").mkpath
  end
  
  service do
    run [opt_bin/"ccc", "daemon"]
    keep_alive true
    log_path var/"log/claude-code-controller.log"
    error_log_path var/"log/claude-code-controller-error.log"
  end
  
  test do
    system "#{bin}/ccc", "--version"
  end
end
```

### 4.2 직접 다운로드

```typescript
// src/web/download-page.ts
export const downloadLinks = {
  stable: {
    universal: 'https://github.com/.../claude-code-controller-macos-universal.dmg',
    arm64: 'https://github.com/.../claude-code-controller-macos-arm64.dmg',
    x64: 'https://github.com/.../claude-code-controller-macos-x64.dmg'
  },
  beta: {
    // Beta versions
  }
};

// Auto-detect architecture
export function getRecommendedDownload(): string {
  const arch = process.arch;
  const isBeta = process.env.CHANNEL === 'beta';
  
  if (arch === 'arm64') {
    return isBeta ? downloadLinks.beta.arm64 : downloadLinks.stable.arm64;
  } else {
    return isBeta ? downloadLinks.beta.x64 : downloadLinks.stable.x64;
  }
}
```

### 4.3 자동 업데이트 메커니즘

```typescript
// src/updater/auto-updater.ts
import { autoUpdater } from 'electron-updater';
import { app } from 'electron';

export class AutoUpdater {
  private updateCheckInterval = 4 * 60 * 60 * 1000; // 4시간
  
  constructor(private config: IUpdaterConfig) {
    this.setupUpdater();
  }
  
  private setupUpdater() {
    // 업데이트 서버 설정
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'yourusername',
      repo: 'claude-code-controller',
      private: false
    });
    
    // 자동 다운로드 설정
    autoUpdater.autoDownload = this.config.autoDownload ?? true;
    autoUpdater.autoInstallOnAppQuit = true;
    
    // 이벤트 핸들러
    autoUpdater.on('update-available', (info) => {
      this.notifyUpdateAvailable(info);
    });
    
    autoUpdater.on('update-downloaded', (info) => {
      this.promptInstallUpdate(info);
    });
    
    // 주기적 업데이트 확인
    this.scheduleUpdateCheck();
  }
  
  async checkForUpdates(): Promise<void> {
    try {
      await autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
      console.error('Update check failed:', error);
    }
  }
  
  private scheduleUpdateCheck() {
    // 초기 확인
    setTimeout(() => this.checkForUpdates(), 30000); // 30초 후
    
    // 주기적 확인
    setInterval(() => this.checkForUpdates(), this.updateCheckInterval);
  }
  
  private notifyUpdateAvailable(info: UpdateInfo) {
    // 터미널 UI에 알림 표시
    this.ui.showNotification({
      title: '업데이트 사용 가능',
      message: `새 버전 ${info.version}이 사용 가능합니다.`,
      actions: [
        { label: '다운로드', action: () => autoUpdater.downloadUpdate() },
        { label: '나중에', action: () => {} }
      ]
    });
  }
  
  private promptInstallUpdate(info: UpdateInfo) {
    this.ui.showDialog({
      title: '업데이트 설치 준비 완료',
      message: '앱을 재시작하여 업데이트를 설치하시겠습니까?',
      buttons: [
        { 
          label: '지금 재시작', 
          action: () => autoUpdater.quitAndInstall() 
        },
        { 
          label: '나중에', 
          action: () => {} 
        }
      ]
    });
  }
}
```

## 5. 환경 관리

### 5.1 환경별 설정

```typescript
// src/config/environments.ts
export interface IEnvironmentConfig {
  name: string;
  apiUrl: string;
  mcpServers: {
    taskManager: string;
    context7: string;
  };
  features: {
    autoUpdate: boolean;
    telemetry: boolean;
    crashReporting: boolean;
  };
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const environments: Record<string, IEnvironmentConfig> = {
  development: {
    name: 'development',
    apiUrl: 'http://localhost:3000',
    mcpServers: {
      taskManager: 'ws://localhost:3001',
      context7: 'ws://localhost:3002'
    },
    features: {
      autoUpdate: false,
      telemetry: false,
      crashReporting: false
    },
    logLevel: 'debug'
  },
  
  staging: {
    name: 'staging',
    apiUrl: 'https://staging-api.ccc.example.com',
    mcpServers: {
      taskManager: 'wss://staging-taskmanager.ccc.example.com',
      context7: 'wss://staging-context7.ccc.example.com'
    },
    features: {
      autoUpdate: true,
      telemetry: true,
      crashReporting: true
    },
    logLevel: 'info'
  },
  
  production: {
    name: 'production',
    apiUrl: 'https://api.ccc.example.com',
    mcpServers: {
      taskManager: 'wss://taskmanager.ccc.example.com',
      context7: 'wss://context7.ccc.example.com'
    },
    features: {
      autoUpdate: true,
      telemetry: true,
      crashReporting: true
    },
    logLevel: 'warn'
  }
};
```

### 5.2 환경 변수 및 설정 관리

```typescript
// src/config/config-manager.ts
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs-extra';

export class ConfigManager {
  private configPath: string;
  private config: IAppConfig;
  
  constructor() {
    this.configPath = path.join(
      app.getPath('userData'),
      'config.json'
    );
    this.loadConfig();
  }
  
  private loadConfig() {
    // 기본 설정
    const defaults = this.getDefaults();
    
    // 사용자 설정 로드
    let userConfig = {};
    if (fs.existsSync(this.configPath)) {
      try {
        userConfig = fs.readJsonSync(this.configPath);
      } catch (error) {
        console.error('Failed to load user config:', error);
      }
    }
    
    // 환경 변수 오버라이드
    const envOverrides = this.getEnvOverrides();
    
    // 병합
    this.config = {
      ...defaults,
      ...userConfig,
      ...envOverrides
    };
  }
  
  private getEnvOverrides(): Partial<IAppConfig> {
    const overrides: Partial<IAppConfig> = {};
    
    if (process.env.CCC_API_URL) {
      overrides.apiUrl = process.env.CCC_API_URL;
    }
    
    if (process.env.CCC_LOG_LEVEL) {
      overrides.logLevel = process.env.CCC_LOG_LEVEL as any;
    }
    
    if (process.env.CCC_TELEMETRY === 'false') {
      overrides.features = {
        ...overrides.features,
        telemetry: false
      };
    }
    
    return overrides;
  }
  
  async saveConfig(updates: Partial<IAppConfig>) {
    this.config = { ...this.config, ...updates };
    await fs.writeJson(this.configPath, this.config, { spaces: 2 });
  }
}
```

## 6. 모니터링 및 로깅

### 6.1 크래시 리포팅 (Sentry)

```typescript
// src/monitoring/crash-reporter.ts
import * as Sentry from '@sentry/electron';

export class CrashReporter {
  constructor(config: ICrashReporterConfig) {
    if (!config.enabled) return;
    
    Sentry.init({
      dsn: config.sentryDsn,
      environment: config.environment,
      release: `claude-code-controller@${app.getVersion()}`,
      
      beforeSend(event, hint) {
        // 민감한 정보 필터링
        if (event.exception) {
          event.exception.values?.forEach(exception => {
            if (exception.stacktrace) {
              exception.stacktrace.frames?.forEach(frame => {
                // 로컬 경로 제거
                if (frame.filename) {
                  frame.filename = frame.filename.replace(
                    /\/Users\/[^/]+/,
                    '/Users/***'
                  );
                }
              });
            }
          });
        }
        
        return event;
      },
      
      integrations: [
        new Sentry.Integrations.MainProcessSession(),
        new Sentry.Integrations.ChildProcess(),
        new Sentry.Integrations.Console(),
        new Sentry.Integrations.MacOSCrashReporter()
      ]
    });
  }
  
  captureException(error: Error, context?: any) {
    Sentry.captureException(error, {
      contexts: {
        app: {
          version: app.getVersion(),
          platform: process.platform,
          arch: process.arch
        },
        custom: context
      }
    });
  }
  
  captureMessage(message: string, level: Sentry.SeverityLevel) {
    Sentry.captureMessage(message, level);
  }
}
```

### 6.2 사용 분석 (로컬 및 익명화)

```typescript
// src/monitoring/analytics.ts
import { createHash } from 'crypto';
import { machineId } from 'node-machine-id';

export class Analytics {
  private userId: string;
  private queue: IAnalyticsEvent[] = [];
  
  constructor(private config: IAnalyticsConfig) {
    this.initializeUserId();
    this.startBatchProcessor();
  }
  
  private async initializeUserId() {
    // 기기 ID를 해시하여 익명화
    const id = await machineId();
    this.userId = createHash('sha256').update(id).digest('hex');
  }
  
  track(event: string, properties?: Record<string, any>) {
    if (!this.config.enabled) return;
    
    this.queue.push({
      event,
      properties: this.sanitizeProperties(properties),
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
      context: {
        app: {
          version: app.getVersion(),
          channel: this.config.channel
        },
        os: {
          platform: process.platform,
          version: os.release()
        }
      }
    });
  }
  
  private sanitizeProperties(properties?: Record<string, any>) {
    if (!properties) return {};
    
    // 민감한 정보 제거
    const sanitized = { ...properties };
    const sensitiveKeys = ['password', 'token', 'secret', 'key'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
        delete sanitized[key];
      }
    });
    
    return sanitized;
  }
  
  private async sendBatch(events: IAnalyticsEvent[]) {
    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey
        },
        body: JSON.stringify({ events })
      });
    } catch (error) {
      console.error('Failed to send analytics:', error);
    }
  }
}
```

### 6.3 로깅 시스템

```typescript
// src/logging/logger.ts
import * as winston from 'winston';
import * as path from 'path';
import { app } from 'electron';

export class Logger {
  private logger: winston.Logger;
  
  constructor(config: ILoggerConfig) {
    const logDir = path.join(app.getPath('userData'), 'logs');
    
    this.logger = winston.createLogger({
      level: config.level || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      
      transports: [
        // 콘솔 출력 (개발 환경)
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
          silent: process.env.NODE_ENV === 'production'
        }),
        
        // 파일 출력 (일별 로테이션)
        new winston.transports.DailyRotateFile({
          dirname: logDir,
          filename: 'ccc-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          level: 'info'
        }),
        
        // 에러 로그 별도 파일
        new winston.transports.File({
          dirname: logDir,
          filename: 'error.log',
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5
        })
      ]
    });
    
    // 비정상 종료 시 로그 플러시
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception:', error);
      this.flush();
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection:', { reason, promise });
      this.flush();
    });
  }
  
  private flush() {
    // 모든 로그 트랜스포트 플러시
    this.logger.transports.forEach(transport => {
      if (transport instanceof winston.transports.File) {
        transport.close();
      }
    });
  }
}
```

## 7. 버전 관리 전략

### 7.1 Semantic Versioning

```javascript
// scripts/version.js
const semver = require('semver');
const fs = require('fs-extra');
const path = require('path');

async function bumpVersion(type) {
  const packagePath = path.join(__dirname, '../package.json');
  const pkg = await fs.readJson(packagePath);
  
  // 버전 증가
  const newVersion = semver.inc(pkg.version, type);
  pkg.version = newVersion;
  
  // package.json 업데이트
  await fs.writeJson(packagePath, pkg, { spaces: 2 });
  
  // 버전 파일 생성
  await fs.writeFile(
    path.join(__dirname, '../src/version.ts'),
    `export const VERSION = '${newVersion}';\n`
  );
  
  console.log(`Version bumped to ${newVersion}`);
  return newVersion;
}

// CLI 사용
const type = process.argv[2] || 'patch';
bumpVersion(type);
```

### 7.2 릴리스 프로세스

```yaml
# .github/workflows/release.yml
name: Release Process

on:
  workflow_dispatch:
    inputs:
      version_type:
        description: 'Version type'
        required: true
        type: choice
        options:
          - patch
          - minor
          - major
          - prerelease

jobs:
  release:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
      
      - name: Bump version
        id: version
        run: |
          NEW_VERSION=$(node scripts/version.js ${{ inputs.version_type }})
          echo "version=$NEW_VERSION" >> $GITHUB_OUTPUT
      
      - name: Generate changelog
        run: |
          npx conventional-changelog -p angular -i CHANGELOG.md -s
      
      - name: Commit changes
        run: |
          git add .
          git commit -m "chore(release): v${{ steps.version.outputs.version }}"
          git tag -a "v${{ steps.version.outputs.version }}" -m "Release v${{ steps.version.outputs.version }}"
      
      - name: Push changes
        run: |
          git push origin main
          git push origin "v${{ steps.version.outputs.version }}"
      
      - name: Create GitHub release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: "v${{ steps.version.outputs.version }}"
          generate_release_notes: true
          draft: false
          prerelease: ${{ inputs.version_type == 'prerelease' }}
```

## 8. 보안 고려사항

### 8.1 보안 스캔

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  schedule:
    - cron: '0 0 * * *'
  push:
    branches: [main]

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run npm audit
        run: npm audit --production
      
      - name: Run Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  
  code-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run CodeQL analysis
        uses: github/codeql-action/analyze@v2
      
      - name: Run semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten
```

### 8.2 런타임 보안

```typescript
// src/security/runtime-protection.ts
import { app } from 'electron';

export class RuntimeProtection {
  static initialize() {
    // 디버거 방지
    if (app.isPackaged) {
      app.commandLine.appendSwitch('disable-devtools');
    }
    
    // 권한 제한
    app.on('web-contents-created', (event, contents) => {
      contents.on('new-window', (event) => {
        event.preventDefault();
      });
      
      contents.on('will-navigate', (event, url) => {
        if (!this.isAllowedUrl(url)) {
          event.preventDefault();
        }
      });
    });
    
    // 보안 헤더 설정
    app.on('web-contents-created', (event, contents) => {
      contents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': ["default-src 'self'"],
            'X-Content-Type-Options': ['nosniff'],
            'X-Frame-Options': ['DENY']
          }
        });
      });
    });
  }
  
  private static isAllowedUrl(url: string): boolean {
    const allowed = [
      'https://api.ccc.example.com',
      'https://github.com/yourusername/claude-code-controller'
    ];
    
    return allowed.some(pattern => url.startsWith(pattern));
  }
}
```

## 마무리

이 DevOps 전략은 Claude Code Controller를 안정적이고 보안성 높은 macOS 네이티브 앱으로 빌드하고 배포하기 위한 포괄적인 가이드라인을 제공합니다. 주요 특징:

1. **자동화된 빌드 파이프라인**: TypeScript 컴파일, 번들링, 코드 서명까지 자동화
2. **macOS 최적화**: Universal Binary 지원, 코드 서명 및 공증으로 신뢰성 확보
3. **다양한 배포 채널**: Homebrew, DMG, 직접 다운로드 지원
4. **자동 업데이트**: 사용자 경험을 해치지 않는 백그라운드 업데이트
5. **포괄적인 모니터링**: 크래시 리포팅, 사용 분석, 상세한 로깅
6. **보안 중심 설계**: 정기적인 보안 스캔, 런타임 보호, 민감정보 보호

이 전략을 따라 구현하면 개발자들이 신뢰하고 사용할 수 있는 전문적인 macOS 개발 도구를 만들 수 있습니다.