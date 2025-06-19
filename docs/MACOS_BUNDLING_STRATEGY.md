# macOS 앱 번들링 전략

## 개요
Claude Code Controller를 macOS 네이티브 앱으로 패키징하여 일반 사용자도 쉽게 설치하고 사용할 수 있도록 하는 전략입니다.

## 1. 번들링 옵션 비교

### Option 1: Electron (권장) ✅
**장점:**
- 터미널 UI와 네이티브 GUI를 함께 제공 가능
- 자동 업데이트 기능 내장
- 코드 서명 및 공증 프로세스 확립
- 크로스 플랫폼 확장 가능

**단점:**
- 앱 크기가 큼 (100MB+)
- 메모리 사용량 높음

### Option 2: pkg
**장점:**
- 가벼운 실행 파일
- 순수 Node.js 앱 패키징

**단점:**
- GUI 제공 어려움
- 자동 업데이트 직접 구현 필요

### Option 3: Swift + Node.js 임베딩
**장점:**
- 진정한 네이티브 앱
- 최고의 성능과 통합

**단점:**
- 개발 복잡도 높음
- 크로스 플랫폼 불가

## 2. 선택된 방안: Electron

### 2.1 아키텍처
```
Claude Code Controller.app/
├── Contents/
│   ├── Info.plist
│   ├── MacOS/
│   │   └── Claude Code Controller (실행 파일)
│   ├── Resources/
│   │   ├── app.asar (앱 번들)
│   │   ├── icon.icns
│   │   └── native-modules/
│   └── Frameworks/
│       └── Electron Framework.framework/
```

### 2.2 메인 프로세스 구조
```typescript
// main/index.ts
import { app, BrowserWindow, Tray, Menu } from 'electron';
import { startTerminalUI } from './terminal';
import { MCPManager } from './mcp';
import { ClaudeCodeBridge } from './claude';

class ClaudeCodeController {
  private mainWindow: BrowserWindow;
  private tray: Tray;
  private terminalUI: TerminalUI;
  
  async initialize() {
    // 1. 시스템 트레이 설정
    this.setupTray();
    
    // 2. 터미널 UI 창 생성
    this.createMainWindow();
    
    // 3. MCP 서버 연결
    await this.connectMCPServers();
    
    // 4. Claude Code 브릿지 초기화
    this.initializeClaudeBridge();
  }
  
  private createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      titleBarStyle: 'hiddenInset',
      backgroundColor: '#000000',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });
    
    // 터미널 UI 로드
    this.mainWindow.loadFile('terminal.html');
  }
}
```

## 3. 패키징 프로세스

### 3.1 빌드 설정 (electron-builder.yml)
```yaml
appId: com.claudecodecontroller.app
productName: Claude Code Controller
directories:
  output: dist
  buildResources: build
files:
  - dist/**/*
  - node_modules/**/*
  - package.json
mac:
  category: public.app-category.developer-tools
  icon: build/icon.icns
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  notarize:
    teamId: ${APPLE_TEAM_ID}
publish:
  provider: github
  owner: jung-wan-kim
  repo: claude-code-controller
```

### 3.2 코드 서명 및 공증
```bash
# 1. 개발자 인증서 준비
security find-identity -v -p codesigning

# 2. 앱 서명
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name (TEAM_ID)" \
  --options runtime \
  --entitlements entitlements.plist \
  "Claude Code Controller.app"

# 3. 공증 제출
xcrun altool --notarize-app \
  --primary-bundle-id "com.claudecodecontroller.app" \
  --username "apple-id@example.com" \
  --password "@keychain:AC_PASSWORD" \
  --file "Claude Code Controller.dmg"

# 4. 공증 확인
xcrun stapler staple "Claude Code Controller.app"
```

## 4. DMG 생성

### 4.1 DMG 구조
```
Claude Code Controller.dmg
├── Claude Code Controller.app
├── Applications (심볼릭 링크)
└── .background/
    └── background.png
```

### 4.2 create-dmg 설정
```json
{
  "title": "Claude Code Controller",
  "background": "assets/dmg-background.png",
  "icon": "assets/icon.icns",
  "contents": [
    { "x": 448, "y": 344, "type": "link", "path": "/Applications" },
    { "x": 192, "y": 344, "type": "file", "path": "Claude Code Controller.app" }
  ],
  "format": "UDZO"
}
```

## 5. 자동 업데이트

### 5.1 업데이트 서버
```typescript
// auto-updater.ts
import { autoUpdater } from 'electron-updater';

export class AutoUpdateManager {
  constructor() {
    autoUpdater.logger = logger;
    autoUpdater.checkForUpdatesAndNotify();
    
    // 업데이트 이벤트 처리
    autoUpdater.on('update-available', () => {
      dialog.showMessageBox({
        type: 'info',
        title: '업데이트 가능',
        message: '새로운 버전이 있습니다. 다운로드하시겠습니까?',
        buttons: ['예', '아니오']
      });
    });
  }
}
```

### 5.2 릴리스 프로세스
1. 버전 태그 생성: `git tag v1.0.0`
2. GitHub Release 생성
3. 자동 빌드 및 업로드 (GitHub Actions)
4. 사용자 앱에서 자동 감지 및 업데이트

## 6. 시스템 통합

### 6.1 macOS 권한
```xml
<!-- entitlements.plist -->
<dict>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.automation.apple-events</key>
  <true/>
  <key>com.apple.security.files.user-selected.read-write</key>
  <true/>
</dict>
```

### 6.2 런치 서비스 등록
```bash
# 시작 시 자동 실행
defaults write com.claudecodecontroller.app AutoLaunch -bool true

# Spotlight 검색 통합
mdimport -r /Applications/Claude\ Code\ Controller.app
```

## 7. 배포 채널

### 7.1 Homebrew Cask
```ruby
cask "claude-code-controller" do
  version "1.0.0"
  sha256 "..."
  
  url "https://github.com/jung-wan-kim/claude-code-controller/releases/download/v#{version}/Claude-Code-Controller-#{version}.dmg"
  name "Claude Code Controller"
  desc "Intelligent terminal program to control Claude Code"
  homepage "https://github.com/jung-wan-kim/claude-code-controller"
  
  app "Claude Code Controller.app"
  
  zap trash: [
    "~/Library/Application Support/Claude Code Controller",
    "~/Library/Preferences/com.claudecodecontroller.app.plist",
    "~/Library/Logs/Claude Code Controller"
  ]
end
```

### 7.2 직접 다운로드
- GitHub Releases 페이지
- 프로젝트 웹사이트

## 8. 최적화

### 8.1 앱 크기 축소
```javascript
// webpack.config.js
module.exports = {
  externals: {
    // 네이티브 모듈 제외
    'node-pty': 'commonjs2 node-pty',
    'blessed': 'commonjs2 blessed'
  },
  optimization: {
    minimize: true,
    moduleIds: 'deterministic'
  }
};
```

### 8.2 시작 시간 최적화
- 지연 로딩 구현
- 캐시 활용
- 백그라운드 초기화

## 9. 보안

### 9.1 API 키 보호
```typescript
import * as keytar from 'keytar';

class SecureStorage {
  async setAPIKey(service: string, key: string) {
    await keytar.setPassword('Claude Code Controller', service, key);
  }
  
  async getAPIKey(service: string) {
    return await keytar.getPassword('Claude Code Controller', service);
  }
}
```

### 9.2 샌드박스
- App Sandbox 활성화
- 필요한 권한만 요청

## 10. 테스트

### 10.1 설치 테스트
```bash
# DMG 마운트 및 설치
hdiutil attach Claude-Code-Controller.dmg
cp -R /Volumes/Claude\ Code\ Controller/Claude\ Code\ Controller.app /Applications/
hdiutil detach /Volumes/Claude\ Code\ Controller/

# 실행 테스트
open /Applications/Claude\ Code\ Controller.app
```

### 10.2 자동화 테스트
```typescript
// e2e/install.test.ts
import { Application } from 'spectron';

describe('Installation', () => {
  let app: Application;
  
  beforeEach(async () => {
    app = new Application({
      path: '/Applications/Claude Code Controller.app/Contents/MacOS/Claude Code Controller'
    });
    await app.start();
  });
  
  it('should launch successfully', async () => {
    const isVisible = await app.browserWindow.isVisible();
    expect(isVisible).toBe(true);
  });
});
```

## 결론

Electron을 사용한 macOS 앱 번들링은 Claude Code Controller에 가장 적합한 선택입니다. 터미널 UI의 강력함과 네이티브 앱의 편의성을 모두 제공하며, 자동 업데이트와 시스템 통합을 통해 최상의 사용자 경험을 제공할 수 있습니다.