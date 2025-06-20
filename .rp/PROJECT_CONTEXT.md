# 프로젝트 컨텍스트

## 프로젝트 정보
- **프로젝트명**: Claude Code Controller (CCC)
- **설명**: Claude Code를 제어하고 관리하는 지능형 터미널 프로그램
- **타입**: macOS 네이티브 애플리케이션 (터미널 기반)
- **생성일**: 2025-06-19

## 프로젝트 구조
```
claude-code-controller/
├── .rp/               # RP 자동화 시스템 파일
├── src/               # 소스 코드
│   ├── cli/          # CLI 인터페이스
│   ├── core/         # 핵심 로직
│   ├── mcp/          # MCP 클라이언트
│   └── ui/           # 터미널 UI
├── config/           # 설정 파일
└── tests/            # 테스트 코드
```

## 기술 스택
- **Language**: TypeScript/JavaScript (Node.js)
- **Terminal UI**: Blessed / Ink 3
- **Process Management**: Node.js child_process
- **MCP Integration**: @modelcontextprotocol/sdk
- **State Management**: Redux / Zustand
- **Testing**: Jest, Vitest
- **Build Tool**: Vite / esbuild

## 주요 기능
1. **작업 자동화 시스템**
   - taskmanager MCP를 통한 작업 계획 및 추적
   - Claude Code 명령 자동 실행
   - 작업 진행률 실시간 모니터링
   - 자동 승인/검토 워크플로우

2. **컨텍스트 관리**
   - context7 MCP를 통한 프로젝트 정보 저장
   - 작업별 컨텍스트 자동 주입
   - 작업 결과 히스토리 관리

3. **터미널 UI**
   - 대시보드 (작업 상태, 로그, 메트릭)
   - 대화형 명령 인터페이스
   - 실시간 로그 스트리밍
   - 단축키 기반 네비게이션 

## 개발 가이드라인
- **코딩 스타일**: ESLint + Prettier (Airbnb style guide)
- **브랜치 전략**: Git Flow (main, develop, feature/*, release/*, hotfix/*)
- **커밋 규칙**: Conventional Commits (feat:, fix:, docs:, style:, refactor:, test:, chore:)
- **테스트 요구사항**: 최소 80% 코드 커버리지
- **문서화**: TSDoc/JSDoc 필수, README 업데이트

## 프로젝트 목표
1. **생산성 향상**: Claude Code 작업을 자동화하여 개발 속도 10배 향상
2. **체계적 관리**: 모든 작업을 추적하고 문서화
3. **스마트 워크플로우**: 컨텍스트 기반 지능적 작업 수행
4. **확장성**: 플러그인 시스템으로 기능 확장 가능

## 핵심 과제
1. Claude Code CLI와의 안정적인 통신
2. MCP 서버와의 실시간 동기화
3. 직관적이고 반응성 높은 터미널 UI
4. 에러 처리 및 복구 메커니즘 

## RP 활용 가이드
이 프로젝트에서는 다음과 같이 RP를 활용합니다:

### 프로젝트 특화 지시사항
각 RP는 이 프로젝트의 컨텍스트를 이해하고 작업을 수행합니다.
- 모든 코드는 프로젝트의 기존 스타일을 따릅니다
- 기술 스택은 위에 명시된 것을 사용합니다
- 프로젝트의 주요 기능을 고려하여 작업합니다

### Claude Code 사용 예시
```bash
# 프로젝트 컨텍스트와 함께 특정 RP 활용
claude-code ".rp/PROJECT_CONTEXT.md와 .rp/backend-developer.md를 참고해서 
            새로운 API 엔드포인트를 추가해줘"

# 전체 팀 시뮬레이션
claude-code ".rp/PROJECT_CONTEXT.md를 기반으로 모든 RP를 활용해서 
            새로운 기능을 개발해줘"
```