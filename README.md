# Claude Code Controller

<div align="center">
  <img src="assets/icon.png" alt="Claude Code Controller" width="128" height="128">
  
  **터미널 기반의 지능형 Claude Code 관리 도구**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Platform: macOS](https://img.shields.io/badge/Platform-macOS-blue.svg)](https://www.apple.com/macos/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-4.0+-blue.svg)](https://www.typescriptlang.org/)
</div>

## 개요

Claude Code Controller는 Claude Code CLI를 더 효율적으로 사용하기 위한 macOS 네이티브 애플리케이션입니다. TaskManager와 Context7 MCP 서버를 통합하여 지능형 작업 관리와 컨텍스트 추적을 제공합니다.

## 주요 기능

- 🚀 **지능형 작업 관리**: TaskManager MCP를 통한 체계적인 작업 추적
- 💾 **컨텍스트 지속성**: Context7을 통한 작업 컨텍스트 저장 및 검색
- 🖥️ **터미널 UI**: 개발자 친화적인 터미널 기반 인터페이스
- ⌨️ **Vi 모드 지원**: 효율적인 키보드 단축키
- 🎨 **테마 지원**: 다크/라이트/고대비 테마
- 📱 **macOS 네이티브**: 시스템 트레이 통합

## 설치

### 사전 요구사항

- macOS 10.15 (Catalina) 이상
- Node.js 16.0 이상
- Claude Code CLI 설치

### 빠른 시작

```bash
# 저장소 클론
git clone https://github.com/jung-wan-kim/new-claude.git
cd new-claude

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 CONTEXT7_API_KEY 설정

# 개발 모드 실행
npm start
```

### macOS 앱 빌드

```bash
# 앱 빌드
./scripts/build-app.sh

# 빌드된 앱은 dist-app/ 폴더에 생성됨
```

## 사용법

### 기본 단축키

| 단축키 | 기능 |
|--------|------|
| `⌘1` | Tasks 패널 포커스 |
| `⌘2` | Work 패널 포커스 |
| `⌘3` | Context 패널 포커스 |
| `⌘4` | Logs 패널 포커스 |
| `⌘N` | 새 작업 생성 |
| `⌘Enter` | 작업 실행 |
| `⌘.` | 작업 중지 |
| `⌘K` | 터미널 클리어 |
| `⌘B` | 사이드바 토글 |
| `⌘Q` | 앱 종료 |

### 작업 관리

1. **새 작업 생성**: `⌘N`을 눌러 새 작업 요청 생성
2. **작업 실행**: Tasks 패널에서 작업 선택 후 `Enter`
3. **진행 상황 확인**: 실시간으로 업데이트되는 작업 상태 확인
4. **컨텍스트 저장**: 작업 중 생성된 컨텍스트는 자동 저장

## 아키텍처

```
┌─────────────────────────────┐
│     Electron Main Process    │
├──────────┬──────────────────┤
│   MCP    │  Claude Code     │
│ Manager  │    Bridge        │
├──────────┴──────────────────┤
│      Renderer Process       │
├────────────────────────────┤
│    React + TypeScript      │
│      Terminal UI           │
└────────────────────────────┘
```

## 개발

### 프로젝트 구조

```
claude-code-controller/
├── src/
│   ├── main/          # Electron 메인 프로세스
│   ├── renderer/      # UI 컴포넌트
│   └── shared/        # 공유 코드
├── docs/              # 문서
├── scripts/           # 빌드 스크립트
└── assets/           # 리소스 파일
```

### 테스트

```bash
# MCP 연결 테스트
./scripts/test-mcp.sh

# 단위 테스트
npm test

# 타입 체크
npm run typecheck
```

## 기여

기여를 환영합니다! PR을 보내기 전에 다음을 확인해주세요:

1. 코드 스타일 준수 (`npm run lint`)
2. 타입 체크 통과 (`npm run typecheck`)
3. 테스트 통과 (`npm test`)

## 라이선스

MIT License - [LICENSE](LICENSE) 파일 참조

## 문제 해결

### MCP 서버 연결 실패
- `.env` 파일의 API 키 확인
- 네트워크 연결 상태 확인

### 빌드 오류
- Node.js 버전 확인 (16.0+)
- `node_modules` 삭제 후 재설치

자세한 문제 해결은 [문서](docs/)를 참조하세요.

---

<div align="center">
  Made with ❤️ by Jung-wan Kim
</div>