# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Claude Code Controller는 터미널 기반의 Claude Code CLI 관리 도구입니다. Blessed 라이브러리를 사용한 TUI(Terminal User Interface)로 구현되었으며, MCP(Model Context Protocol) 서버와 통합하여 지능형 작업 관리를 제공합니다.

## 핵심 아키텍처

### 주요 컴포넌트
- **ClaudeCodeController**: 애플리케이션의 메인 진입점이자 전체 시스템 조정자
- **MCPManager**: TaskManager와 Context7 MCP 서버 연결 관리
- **ClaudeCodeBridge**: Claude Code CLI와의 통신 브릿지
- **UIManager**: Blessed 기반 터미널 UI 관리
- **Store 시스템**: TaskStore, ContextStore, LogStore로 상태 관리

### 디렉토리 구조
```
src/
├── app/              # 메인 애플리케이션 로직
├── claude/           # Claude Code CLI 브릿지
├── mcp/              # MCP 서버 클라이언트
├── stores/           # 상태 관리 스토어
├── ui/               # 터미널 UI 컴포넌트
│   └── panels/       # UI 패널 컴포넌트들
├── shared/           # 공유 타입 및 유틸리티
└── test/             # 테스트 코드
```

## 개발 명령어

```bash
# 개발 모드 실행 (파일 변경 감지)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 후 실행
npm start

# 타입 체크
npm run typecheck

# 린트
npm run lint

# 테스트
npm test

# MCP 연결 테스트
npm run test:mcp

# 빌드 정리
npm run clean
```

## MCP 서버 통합

프로젝트는 두 개의 MCP 서버와 통합됩니다:

1. **TaskManager MCP**: 작업 계획, 추적, 승인 관리
   - 작업 요청 생성 및 관리
   - 작업 진행 상황 추적
   - 작업 승인 워크플로우

2. **Context7 MCP**: 컨텍스트 저장 및 검색
   - 작업 관련 컨텍스트 저장
   - 이전 작업 내역 검색
   - 지식 베이스 관리

## UI 컴포넌트 작업 시 주의사항

- Blessed 라이브러리의 특성상 React와 같은 반응형 업데이트가 아님
- 수동으로 `screen.render()` 호출 필요
- 키보드 이벤트는 포커스된 엘리먼트에서만 동작
- Unicode 문자 렌더링 시 터미널 설정 확인 필요

## 환경 변수

`.env` 파일에 다음 설정 필요:
- `CONTEXT7_API_KEY`: Context7 MCP 서버 API 키
- 기타 MCP 서버 관련 설정

## 빌드 및 배포

macOS 앱으로 패키징:
```bash
./scripts/build-app.sh
```

생성된 앱은 `dist-app/` 디렉토리에 위치

## 주요 기능 구현 패턴

1. **Store 패턴**: 모든 상태는 중앙 스토어에서 관리
2. **이벤트 기반 통신**: 컴포넌트 간 EventEmitter로 통신
3. **비동기 작업**: async/await 패턴 일관되게 사용
4. **에러 처리**: try-catch로 모든 비동기 작업 보호

## 테스트 전략

- MCP 연결은 실제 서버로 테스트
- UI 컴포넌트는 격리된 단위 테스트
- 통합 테스트는 mock MCP 서버 사용