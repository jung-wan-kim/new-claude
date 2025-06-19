# Claude Code Controller - 사용자 가이드

## 목차

1. [시작하기](#시작하기)
2. [기본 사용법](#기본-사용법)
3. [고급 기능](#고급-기능)
4. [단축키 레퍼런스](#단축키-레퍼런스)
5. [설정](#설정)
6. [트러블슈팅](#트러블슈팅)
7. [FAQ](#faq)

## 시작하기

### 시스템 요구사항

- **운영체제**: macOS 10.15 (Catalina) 이상
- **Node.js**: 16.0 이상
- **Claude Code CLI**: 설치 필요
- **메모리**: 최소 4GB RAM
- **저장공간**: 200MB 이상

### 설치

#### npm을 통한 설치 (권장)

```bash
# Claude Code Controller 설치
npm install -g claude-code-controller

# 설치 확인
ccc --version
```

#### Homebrew를 통한 설치 (macOS)

```bash
# Homebrew tap 추가
brew tap jung-wan-kim/claude-code-controller

# 설치
brew install claude-code-controller
```

#### 소스에서 빌드

```bash
# 저장소 클론
git clone https://github.com/jung-wan-kim/new-claude.git
cd new-claude

# 의존성 설치
npm install

# 빌드
npm run build

# 전역 설치
npm link
```

### 초기 설정

#### 1. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# 편집기로 .env 파일 열기
nano .env
```

필수 환경 변수:
- `CONTEXT7_API_KEY`: Context7 MCP 서버 API 키

#### 2. MCP 서버 연결 테스트

```bash
# MCP 서버 연결 확인
ccc test-mcp
```

성공 시 출력:
```
✅ TaskManager MCP client initialized
✅ Context7 MCP client initialized
✅ All MCP servers connected successfully
```

#### 3. 첫 실행

```bash
# Claude Code Controller 시작
ccc

# 또는 설정 파일 지정
ccc --config ~/.ccc.config.json
```

## 기본 사용법

### UI 구조 이해하기

Claude Code Controller는 4개의 주요 패널로 구성됩니다:

```
┌─────────────────────────────────────────────────────────────┐
│                         Status Bar                          │
├──────────────┬─────────────────────────────────────────────┤
│              │                                             │
│    Tasks     │                 Work Panel                  │
│    Panel     │          (Claude Code Output)               │
│              │                                             │
├──────────────┼─────────────────────────────────────────────┤
│              │                                             │
│   Context    │                Log Panel                    │
│    Panel     │         (System Messages)                   │
│              │                                             │
└──────────────┴─────────────────────────────────────────────┘
```

1. **Tasks Panel**: 작업 목록과 상태 표시
2. **Work Panel**: Claude Code 실행 결과 표시
3. **Context Panel**: 저장된 컨텍스트와 히스토리
4. **Log Panel**: 시스템 로그와 디버그 정보

### 작업 생성하기

#### 방법 1: 단축키 사용
1. `⌘N` 키를 눌러 새 작업 다이얼로그 열기
2. 제목과 설명 입력
3. `Enter` 또는 "Create" 버튼 클릭

#### 방법 2: 명령어 사용
```bash
# CLI에서 직접 작업 생성
ccc create-task "작업 제목" --description "작업 설명"
```

### 작업 실행하기

1. Tasks Panel에서 작업 선택 (화살표 키 또는 마우스)
2. `Enter` 키를 눌러 실행
3. Work Panel에서 실행 결과 확인

### 작업 상태

작업은 다음 상태 중 하나를 가집니다:

- **◯ Pending**: 대기 중 (노란색)
- **◐ In Progress**: 실행 중 (파란색)
- **✓ Completed**: 완료 (초록색)
- **✗ Failed**: 실패 (빨간색)
- **⏸ Paused**: 일시정지 (회색)

## 고급 기능

### 컨텍스트 관리

#### 컨텍스트 검색
1. `⌘3`으로 Context Panel 포커스
2. `/` 키로 검색 모드 진입
3. 검색어 입력 후 `Enter`

#### 컨텍스트 재사용
1. 검색 결과에서 컨텍스트 선택
2. `Enter`로 새 작업에 적용
3. 이전 작업의 결과를 기반으로 새 작업 시작

### 테마 변경

#### 사용 가능한 테마
- **Dark** (기본값): 어두운 배경
- **Light**: 밝은 배경
- **High Contrast**: 고대비 모드

#### 테마 변경 방법
1. `⌘,`로 설정 열기
2. "Theme" 섹션 이동
3. 원하는 테마 선택

### Vi 모드

Vi 스타일 키보드 네비게이션:

- `j`: 아래로 이동
- `k`: 위로 이동
- `h`: 왼쪽 패널로
- `l`: 오른쪽 패널로
- `g`: 목록 처음으로
- `G`: 목록 끝으로
- `/`: 검색 시작
- `n`: 다음 검색 결과
- `N`: 이전 검색 결과

### 작업 템플릿

자주 사용하는 작업을 템플릿으로 저장:

```bash
# 템플릿 생성
ccc template create "코드 리뷰" \
  --description "PR 코드 리뷰 및 피드백 제공" \
  --context "코딩 스타일 가이드 준수 확인"

# 템플릿 사용
ccc template use "코드 리뷰"
```

## 단축키 레퍼런스

### 전역 단축키

| 단축키 | 기능 | 설명 |
|--------|------|------|
| `⌘Q` | 종료 | 애플리케이션 종료 |
| `⌘K` | 클리어 | 현재 패널 내용 클리어 |
| `⌘/` | 도움말 | 단축키 도움말 표시 |
| `⌘,` | 설정 | 설정 화면 열기 |
| `⌘S` | 저장 | 현재 상태 저장 |

### 패널 네비게이션

| 단축키 | 기능 | 설명 |
|--------|------|------|
| `⌘1` | Tasks 포커스 | Tasks 패널로 이동 |
| `⌘2` | Work 포커스 | Work 패널로 이동 |
| `⌘3` | Context 포커스 | Context 패널로 이동 |
| `⌘4` | Logs 포커스 | Logs 패널로 이동 |
| `Tab` | 다음 패널 | 순차적으로 패널 이동 |
| `⇧Tab` | 이전 패널 | 역순으로 패널 이동 |

### 작업 관리

| 단축키 | 기능 | 설명 |
|--------|------|------|
| `⌘N` | 새 작업 | 새 작업 생성 다이얼로그 |
| `Enter` | 작업 실행 | 선택된 작업 실행 |
| `⌘Enter` | 빠른 실행 | 승인 없이 즉시 실행 |
| `⌘.` | 작업 중지 | 실행 중인 작업 중지 |
| `Space` | 상세 보기 | 작업 상세 정보 토글 |
| `d` | 삭제 | 선택된 작업 삭제 |
| `e` | 편집 | 작업 편집 |
| `r` | 새로고침 | 작업 목록 새로고침 |

### 출력 관리

| 단축키 | 기능 | 설명 |
|--------|------|------|
| `⌘F` | 검색 | Work Panel에서 텍스트 검색 |
| `⌘G` | 다음 찾기 | 다음 검색 결과로 이동 |
| `⌘⇧G` | 이전 찾기 | 이전 검색 결과로 이동 |
| `⌘A` | 전체 선택 | 출력 내용 전체 선택 |
| `⌘C` | 복사 | 선택된 텍스트 복사 |

## 설정

### 설정 파일 위치

설정은 다음 위치에 저장됩니다:
- 전역 설정: `~/.claude-code-controller/config.json`
- 프로젝트별 설정: `./.ccc.config.json`

### 설정 예시

```json
{
  "theme": "dark",
  "fontSize": 14,
  "viMode": true,
  "autoSave": true,
  "layout": {
    "tasksPanelWidth": "25%",
    "showStatusBar": true,
    "autoHideLogs": false
  },
  "keymap": {
    "newTask": "cmd+n",
    "executeTask": "enter",
    "stopTask": "cmd+."
  },
  "mcp": {
    "taskManager": {
      "enabled": true,
      "timeout": 30000
    },
    "context7": {
      "enabled": true,
      "cacheSize": 100
    }
  },
  "notifications": {
    "sound": true,
    "desktop": false,
    "inApp": true
  }
}
```

### 주요 설정 항목

#### 외관 설정
- `theme`: 색상 테마 (dark, light, high-contrast)
- `fontSize`: 글꼴 크기 (10-24)
- `fontFamily`: 글꼴 (monospace 권장)

#### 동작 설정
- `viMode`: Vi 모드 활성화
- `autoSave`: 자동 저장
- `confirmDelete`: 삭제 시 확인
- `scrollback`: 스크롤백 라인 수

#### MCP 설정
- `mcp.taskManager.timeout`: TaskManager 타임아웃 (ms)
- `mcp.context7.cacheSize`: Context7 캐시 크기
- `mcp.retryAttempts`: 재시도 횟수

## 트러블슈팅

### 일반적인 문제

#### 1. MCP 서버 연결 실패

**증상**: "Failed to connect to MCP server" 에러

**해결 방법**:
1. 환경 변수 확인
   ```bash
   echo $CONTEXT7_API_KEY
   ```
2. 네트워크 연결 확인
3. MCP 서버 상태 확인
   ```bash
   ccc test-mcp --verbose
   ```

#### 2. 작업 실행 안됨

**증상**: Enter 키를 눌러도 반응 없음

**해결 방법**:
1. Claude Code CLI 설치 확인
   ```bash
   which claude
   ```
2. 작업 상태 확인 (이미 실행 중인지)
3. 로그 패널에서 에러 메시지 확인

#### 3. UI 깨짐

**증상**: 텍스트가 겹치거나 레이아웃 깨짐

**해결 방법**:
1. 터미널 크기 조정 (최소 80x24)
2. 터미널 설정에서 UTF-8 인코딩 확인
3. 폰트를 고정폭 폰트로 변경

### 로그 수집

문제 해결을 위한 로그 수집:

```bash
# 디버그 모드로 실행
ccc --debug

# 로그 파일 위치
~/.claude-code-controller/logs/

# 로그 레벨 설정
export CCC_LOG_LEVEL=debug
```

### 지원 받기

#### 1. GitHub Issues
- 버그 리포트: https://github.com/jung-wan-kim/new-claude/issues
- 기능 요청: 같은 위치에 Feature Request 라벨 추가

#### 2. 커뮤니티
- Discord: [초대 링크]
- Slack: [워크스페이스 링크]

#### 3. 문서
- Wiki: https://github.com/jung-wan-kim/new-claude/wiki
- API 문서: https://docs.claude-code-controller.dev

## FAQ

### Q: Claude Code CLI 없이 사용할 수 있나요?
A: 아니요, Claude Code Controller는 Claude Code CLI를 래핑하는 도구이므로 반드시 설치되어 있어야 합니다.

### Q: Windows나 Linux에서 사용할 수 있나요?
A: 현재는 macOS만 공식 지원합니다. Linux 지원은 로드맵에 있으며, Windows 지원은 추후 계획 중입니다.

### Q: 여러 프로젝트를 동시에 관리할 수 있나요?
A: 현재 버전에서는 한 번에 하나의 프로젝트만 관리할 수 있습니다. 멀티 프로젝트 지원은 v2.0에서 예정되어 있습니다.

### Q: 작업 히스토리는 어디에 저장되나요?
A: 작업 히스토리는 `~/.claude-code-controller/history.db`에 SQLite 데이터베이스로 저장됩니다.

### Q: 커스텀 MCP 서버를 추가할 수 있나요?
A: 네, 플러그인 시스템을 통해 커스텀 MCP 서버를 추가할 수 있습니다. 자세한 내용은 개발자 가이드를 참조하세요.

### Q: 오프라인에서도 사용할 수 있나요?
A: 제한적으로 가능합니다. 로컬 캐시된 컨텍스트는 사용할 수 있지만, MCP 서버 기능은 인터넷 연결이 필요합니다.

### Q: 단축키를 변경할 수 있나요?
A: 네, 설정 파일의 `keymap` 섹션에서 모든 단축키를 커스터마이징할 수 있습니다.