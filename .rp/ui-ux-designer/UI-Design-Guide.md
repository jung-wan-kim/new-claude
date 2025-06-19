# Claude Code Controller - UI/UX Design Guide

## 디자인 철학

### 핵심 원칙
1. **터미널 우선**: 모든 인터랙션은 키보드로 가능해야 함
2. **정보 밀도**: 한 화면에 최대한 많은 유용한 정보 표시
3. **일관성**: 표준 터미널 관례 준수
4. **접근성**: 시각적 구분이 명확하고 스크린 리더 호환

## 레이아웃 구조

### 전체 레이아웃
```
┌─────────────────────────────────────────────────────────────┐
│                         Status Bar                          │
├──────────────┬─────────────────────────────────────────────┤
│              │                                             │
│    Tasks     │                 Work Panel                  │
│    Panel     │          (Claude Code Output)               │
│     (25%)    │                  (50%)                      │
│              │                                             │
├──────────────┼─────────────────────────────────────────────┤
│              │                                             │
│   Context    │                Log Panel                    │
│    Panel     │         (System Messages)                   │
│     (25%)    │                 (25%)                       │
│              │                                             │
└──────────────┴─────────────────────────────────────────────┘
```

### 패널 설명
1. **Status Bar**: 현재 상태, 모드, 알림
2. **Tasks Panel**: 작업 목록 및 진행 상황
3. **Work Panel**: Claude Code 실행 결과
4. **Context Panel**: 저장된 컨텍스트 및 히스토리
5. **Log Panel**: 시스템 로그 및 디버그 정보

## 색상 스킴

### 다크 테마 (기본)
```javascript
const darkTheme = {
  background: '#1e1e1e',
  foreground: '#d4d4d4',
  primary: '#007acc',      // Azure Blue
  success: '#4ec9b0',      // Teal
  warning: '#ce9178',      // Orange
  error: '#f44747',        // Red
  info: '#9cdcfe',         // Light Blue
  border: '#3e3e3e',
  selection: '#264f78',
  
  // 패널별 색상
  statusBar: {
    bg: '#007acc',
    fg: '#ffffff'
  },
  taskPanel: {
    pending: '#ce9178',
    inProgress: '#9cdcfe',
    completed: '#4ec9b0',
    failed: '#f44747'
  }
};
```

### 라이트 테마
```javascript
const lightTheme = {
  background: '#ffffff',
  foreground: '#333333',
  primary: '#0066cc',
  success: '#008000',
  warning: '#ff6600',
  error: '#cc0000',
  info: '#0099cc',
  border: '#cccccc',
  selection: '#add8e6'
};
```

### 고대비 테마
```javascript
const highContrastTheme = {
  background: '#000000',
  foreground: '#ffffff',
  primary: '#00ffff',
  success: '#00ff00',
  warning: '#ffff00',
  error: '#ff0000',
  info: '#ffffff',
  border: '#ffffff',
  selection: '#ffff00'
};
```

## 단축키 체계

### 글로벌 단축키
| 키 | 기능 | 설명 |
|---|------|-----|
| `⌘Q` | 종료 | 애플리케이션 종료 |
| `⌘K` | 클리어 | 현재 패널 내용 클리어 |
| `⌘/` | 도움말 | 단축키 도움말 표시 |
| `⌘,` | 설정 | 설정 화면 열기 |

### 패널 네비게이션
| 키 | 기능 | 설명 |
|---|------|-----|
| `⌘1` | Tasks 포커스 | Tasks 패널로 이동 |
| `⌘2` | Work 포커스 | Work 패널로 이동 |
| `⌘3` | Context 포커스 | Context 패널로 이동 |
| `⌘4` | Logs 포커스 | Logs 패널로 이동 |
| `Tab` | 다음 패널 | 순차적으로 패널 이동 |
| `⇧Tab` | 이전 패널 | 역순으로 패널 이동 |

### 작업 관리
| 키 | 기능 | 설명 |
|---|------|-----|
| `⌘N` | 새 작업 | 새 작업 생성 다이얼로그 |
| `Enter` | 작업 실행 | 선택된 작업 실행 |
| `⌘Enter` | 빠른 실행 | 승인 없이 즉시 실행 |
| `⌘.` | 작업 중지 | 실행 중인 작업 중지 |
| `Space` | 상세 보기 | 작업 상세 정보 토글 |
| `d` | 삭제 | 선택된 작업 삭제 |

### Vi 모드
| 키 | 기능 | 설명 |
|---|------|-----|
| `j` | 아래로 | 다음 항목 선택 |
| `k` | 위로 | 이전 항목 선택 |
| `h` | 왼쪽 | 이전 패널로 |
| `l` | 오른쪽 | 다음 패널로 |
| `g` | 처음으로 | 목록 처음으로 |
| `G` | 끝으로 | 목록 끝으로 |
| `/` | 검색 | 검색 모드 진입 |

## UI 컴포넌트

### 1. 작업 항목
```
┌─ Pending ─────────────────────────┐
│ ◯ Initialize project structure    │
│   Created: 2 mins ago             │
└───────────────────────────────────┘

┌─ In Progress ─────────────────────┐
│ ◐ Setting up MCP connections      │
│   Started: 30s ago | 45%          │
│   ████████░░░░░░░░                │
└───────────────────────────────────┘

┌─ Completed ───────────────────────┐
│ ✓ Analyzed codebase               │
│   Duration: 1m 23s                │
└───────────────────────────────────┘
```

### 2. 상태 표시기
- `◯` Pending (노란색)
- `◐` In Progress (파란색)
- `✓` Completed (초록색)
- `✗` Failed (빨간색)
- `⏸` Paused (회색)

### 3. 프로그레스 바
```
Simple:    ████████░░░░░░░░ 50%
Detailed:  ████████░░░░░░░░ 4/8 tasks
Animated:  ████████████░░░░ [=====>   ]
```

### 4. 알림 배너
```
┌─ Success ─────────────────────────┐
│ ✓ Task completed successfully     │
└───────────────────────────────────┘

┌─ Warning ─────────────────────────┐
│ ⚠ MCP connection unstable         │
└───────────────────────────────────┘

┌─ Error ───────────────────────────┐
│ ✗ Failed to connect to server     │
└───────────────────────────────────┘
```

## 애니메이션 가이드

### 스피너 애니메이션
```
Frames: ⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏
Speed: 80ms per frame
```

### 페이드 효과
- 새 항목 추가: 0.3s ease-in
- 항목 제거: 0.2s ease-out
- 패널 전환: 0.15s ease-in-out

## 반응형 디자인

### 최소 크기
- 터미널 최소 크기: 80x24
- 권장 크기: 120x40
- 최적 크기: 160x50

### 크기별 레이아웃
1. **소형 (80x24)**
   - 단일 패널 뷰
   - 탭으로 패널 전환

2. **중형 (120x40)**
   - 2-패널 분할 뷰
   - 사이드바 토글 가능

3. **대형 (160x50+)**
   - 전체 4-패널 뷰
   - 모든 정보 동시 표시

## 접근성 고려사항

### 스크린 리더 지원
- 모든 UI 요소에 설명 텍스트
- 상태 변경 시 음성 알림
- 논리적인 탭 순서

### 키보드 네비게이션
- 모든 기능 키보드로 접근 가능
- 표준 OS 단축키와 충돌 없음
- 커스터마이징 가능한 키맵

### 시각적 피드백
- 명확한 포커스 인디케이터
- 충분한 색상 대비 (WCAG AA 준수)
- 색상에만 의존하지 않는 정보 전달

## 사용자 경험 플로우

### 첫 실행 경험
1. 환영 메시지 및 빠른 투어
2. MCP 서버 연결 가이드
3. 첫 작업 생성 튜토리얼
4. 단축키 치트시트 표시

### 일반 워크플로우
1. 작업 생성 (⌘N)
2. 작업 선택 및 실행 (Enter)
3. 실행 모니터링 (Work Panel)
4. 결과 확인 및 승인
5. 컨텍스트 저장 (자동)

### 에러 처리
1. 명확한 에러 메시지
2. 해결 방법 제시
3. 재시도 옵션
4. 상세 로그 접근

## 커스터마이징

### 사용자 설정 가능 항목
- 색상 테마
- 폰트 크기
- 패널 레이아웃
- 단축키 매핑
- 알림 설정

### 설정 파일 예시
```json
{
  "theme": "dark",
  "fontSize": 14,
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
  "notifications": {
    "sound": true,
    "desktop": true,
    "inApp": true
  }
}
```