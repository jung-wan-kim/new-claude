# Claude Code Controller (CCC) Terminal UI Design System

## 1. 터미널 UI 레이아웃 구조

### 1.1 메인 레이아웃 (ASCII 다이어그램)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CCC v1.0 │ Project: my-app │ Context: loaded │ Status: ● Active   │ 14:23:45 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────┐  ┌──────────────────────────────────────┐ │
│  │      TASK MANAGER (⌘1)      │  │         WORK AREA (⌘2)              │ │
│  ├─────────────────────────────┤  ├──────────────────────────────────────┤ │
│  │ ▶ Current Tasks              │  │                                      │ │
│  │   ├─ ✓ Setup project        │  │  Current Task: Implement API         │ │
│  │   ├─ ◐ Implement API (45%)  │  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │   └─ ○ Write tests          │  │                                      │ │
│  │                              │  │  > Creating endpoint structure...    │ │
│  │ ▼ Completed (2)             │  │  > Generated POST /api/users         │ │
│  │ ▼ Planned (5)               │  │  > Adding validation middleware...   │ │
│  │                              │  │  ✓ Endpoint created successfully     │ │
│  │ Progress: ████████░░ 45%    │  │                                      │ │
│  └─────────────────────────────┘  └──────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────┐  ┌──────────────────────────────────────┐ │
│  │      CONTEXT (⌘3)           │  │         LOGS & OUTPUT (⌘4)          │ │
│  ├─────────────────────────────┤  ├──────────────────────────────────────┤ │
│  │ 📁 Project Info              │  │ [14:23:40] Starting task execution   │ │
│  │   Name: my-app              │  │ [14:23:41] Claude Code initialized  │ │
│  │   Type: Next.js + Supabase  │  │ [14:23:42] Context loaded from C7   │ │
│  │                              │  │ [14:23:43] Executing: create API    │ │
│  │ 🔧 Recent Contexts           │  │ [14:23:44] > npm install express    │ │
│  │   • API structure defined    │  │ [14:23:45] Process completed        │ │
│  │   • Database schema ready    │  │ [14:23:45] Awaiting approval...     │ │
│  └─────────────────────────────┘  └──────────────────────────────────────┘ │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ [⌘K] Commands │ [⌘/] Search │ [⌘P] Projects │ [⌘H] Help │ [⌘Q] Quit      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 대체 레이아웃 모드

#### 포커스 모드 (⌘F)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CCC - Focus Mode │ Implement API endpoint │ Auto-approve: OFF │    14:25:12 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                        Current Task: Implement API                          │
│                        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━                        │
│                        Progress: 45% │ ETA: ~5 min                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                     │  │
│  │  > claude-code "Create a REST API endpoint for user management"    │  │
│  │                                                                     │  │
│  │  Creating endpoint structure...                                     │  │
│  │  ✓ Generated POST /api/users                                       │  │
│  │  ✓ Generated GET /api/users/:id                                    │  │
│  │  ✓ Added validation middleware                                     │  │
│  │  ◐ Writing unit tests...                                           │  │
│  │                                                                     │  │
│  │  const router = express.Router();                                  │  │
│  │                                                                     │  │
│  │  router.post('/users', validateUser, async (req, res) => {         │  │
│  │    // Implementation in progress...                                 │  │
│  │  });                                                                │  │
│  │                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [A] Approve & Continue │ [R] Retry │ [S] Skip │ [ESC] Exit Focus Mode     │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 대시보드 모드 (⌘D)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CCC Dashboard │ 3 Active Projects │ 12 Tasks Today │ Productivity: ↑ 85%    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐        │
│  │   Project: API   │  │ Project: Frontend │  │  Project: Docs   │        │
│  │  ████████░░ 80%  │  │  ███░░░░░░ 30%   │  │  █████████ 100%  │        │
│  │                  │  │                   │  │                   │        │
│  │  ✓ Setup        │  │  ✓ Init          │  │  ✓ README        │        │
│  │  ◐ Endpoints    │  │  ◐ Components    │  │  ✓ API Docs     │        │
│  │  ○ Tests        │  │  ○ Styling       │  │  ✓ Examples     │        │
│  │                  │  │  ○ Tests         │  │                   │        │
│  │  [Enter] Open   │  │  [Enter] Open    │  │  [Enter] Open    │        │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘        │
│                                                                             │
│  Today's Activity                          Performance Metrics              │
│  ┌────────────────────────────────────┐  ┌────────────────────────────┐  │
│  │ 09:00 ████                        │  │ Tasks/Hour  : ████ 4.2      │  │
│  │ 10:00 ████████                    │  │ Success Rate: █████████ 95%  │  │
│  │ 11:00 ██████                      │  │ Automation  : ███████ 78%    │  │
│  │ 12:00 ██                          │  │ Context Hits: ████████ 89%   │  │
│  │ 13:00 ████████████                │  │                              │  │
│  │ 14:00 ████████                    │  │ Weekly Trend: ↑↑↑↓↑↑↑        │  │
│  └────────────────────────────────────┘  └────────────────────────────┘  │
│                                                                             │
│  [N] New Project │ [T] New Task │ [R] Reports │ [S] Settings              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. 컬러 스킴 및 테마 시스템

### 2.1 기본 컬러 팔레트

```javascript
const colorScheme = {
  // 브랜드 컬러
  primary: {
    default: '#3B82F6',  // Bright Blue
    hover: '#2563EB',
    active: '#1D4ED8',
    muted: '#DBEAFE'
  },
  
  // 시맨틱 컬러
  semantic: {
    success: '#10B981',  // Green
    warning: '#F59E0B',  // Amber
    error: '#EF4444',    // Red
    info: '#3B82F6',     // Blue
    pending: '#8B5CF6'   // Purple
  },
  
  // 중립 컬러 (터미널 최적화)
  neutral: {
    bg: {
      primary: '#000000',   // Pure black
      secondary: '#0A0A0A', // Near black
      tertiary: '#1A1A1A',  // Dark gray
      elevated: '#2A2A2A'   // Elevated surface
    },
    text: {
      primary: '#FFFFFF',   // Pure white
      secondary: '#A1A1AA', // Gray
      muted: '#71717A',     // Dim gray
      disabled: '#52525B'   // Dark gray
    },
    border: {
      default: '#3F3F46',   // Border gray
      focus: '#3B82F6',     // Focus blue
      subtle: '#27272A'     // Subtle border
    }
  },
  
  // 상태 표시 컬러
  status: {
    active: '#10B981',    // Green dot
    idle: '#F59E0B',      // Yellow dot
    error: '#EF4444',     // Red dot
    offline: '#6B7280'    // Gray dot
  }
};
```

### 2.2 터미널 ANSI 컬러 매핑

```javascript
const ansiColors = {
  // 기본 8색
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // 밝은 8색
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  
  // 스타일
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m'
};
```

### 2.3 테마 시스템

```javascript
const themes = {
  // 기본 다크 테마
  dark: {
    name: 'Dark',
    colors: colorScheme,
    syntax: {
      keyword: '#C678DD',
      string: '#98C379',
      number: '#D19A66',
      comment: '#5C6370',
      function: '#61AFEF',
      variable: '#E06C75'
    }
  },
  
  // 고대비 테마 (접근성)
  highContrast: {
    name: 'High Contrast',
    colors: {
      ...colorScheme,
      neutral: {
        bg: {
          primary: '#000000',
          secondary: '#000000',
          tertiary: '#1A1A1A',
          elevated: '#FFFFFF'
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#FFFFFF',
          muted: '#CCCCCC',
          disabled: '#666666'
        }
      }
    }
  },
  
  // 모노크롬 테마 (집중 모드)
  monochrome: {
    name: 'Monochrome',
    colors: {
      primary: { default: '#FFFFFF' },
      semantic: {
        success: '#FFFFFF',
        warning: '#CCCCCC',
        error: '#FFFFFF',
        info: '#AAAAAA'
      }
    }
  }
};
```

## 3. 단축키 체계 및 네비게이션

### 3.1 글로벌 단축키

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  macOS 스타일 단축키 체계
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ 네비게이션
  ⌘1-4     : 패널 전환 (Task, Work, Context, Logs)
  ⌘Tab     : 다음 패널로 이동
  ⌘⇧Tab    : 이전 패널로 이동
  ⌘W       : 현재 패널 닫기
  ⌘⇧W      : 모든 패널 닫기

▶ 작업 제어
  ⌘N       : 새 작업 생성
  ⌘Enter   : 작업 실행/승인
  ⌘.       : 작업 중지
  ⌘R       : 작업 재시도
  ⌘Delete  : 작업 삭제

▶ 보기 모드
  ⌘F       : 포커스 모드
  ⌘D       : 대시보드 모드
  ⌘L       : 로그 전체화면
  ⌘⇧F      : 전체화면 토글

▶ 검색 및 필터
  ⌘K       : 명령 팔레트
  ⌘/       : 빠른 검색
  ⌘F       : 현재 패널에서 찾기
  ⌘G       : 다음 찾기
  ⌘⇧G      : 이전 찾기

▶ 프로젝트
  ⌘P       : 프로젝트 전환
  ⌘⇧P      : 프로젝트 설정
  ⌘S       : 현재 상태 저장
  ⌘O       : 프로젝트 열기

▶ 시스템
  ⌘,       : 환경설정
  ⌘H       : 도움말
  ⌘?       : 단축키 도움말
  ⌘Q       : 종료
```

### 3.2 컨텍스트별 단축키

```javascript
const contextualShortcuts = {
  taskManager: {
    'j/↓': '다음 작업',
    'k/↑': '이전 작업', 
    'Enter': '작업 상세',
    'Space': '작업 선택/해제',
    'a': '모두 선택',
    'd': '선택 삭제',
    'e': '작업 편집',
    'r': '작업 재실행',
    'x': '작업 취소'
  },
  
  workArea: {
    'Ctrl+C': '실행 중지',
    'Ctrl+L': '화면 지우기',
    'Ctrl+R': '마지막 명령 재실행',
    'Tab': '자동완성',
    'Ctrl+A': '줄 처음으로',
    'Ctrl+E': '줄 끝으로'
  },
  
  logs: {
    'f': '팔로우 모드 토글',
    'c': '로그 지우기',
    'w': '줄바꿈 토글',
    '/': '로그 검색',
    'n': '다음 검색 결과',
    'N': '이전 검색 결과',
    'Ctrl+Home': '로그 처음',
    'Ctrl+End': '로그 끝'
  }
};
```

### 3.3 Vi 모드 지원 (선택적)

```
Normal Mode:
  h/j/k/l  : 좌/하/상/우 이동
  gg       : 문서 처음
  G        : 문서 끝
  /        : 검색
  n/N      : 다음/이전 검색
  i        : Insert 모드
  v        : Visual 모드
  :        : 명령 모드

Command Mode:
  :w       : 저장
  :q       : 종료
  :wq      : 저장 후 종료
  :task    : 작업 관리
  :log     : 로그 보기
  :set     : 설정
```

## 4. 정보 아키텍처

### 4.1 계층 구조

```
CCC (Root)
├── Projects
│   ├── Active Project
│   │   ├── Tasks
│   │   │   ├── Planned
│   │   │   ├── In Progress
│   │   │   └── Completed
│   │   ├── Contexts
│   │   │   ├── Project Info
│   │   │   ├── Recent Contexts
│   │   │   └── Saved Templates
│   │   └── Sessions
│   │       ├── Active Claude Sessions
│   │       └── Session History
│   └── Project List
│
├── Workflows
│   ├── Templates
│   ├── Custom Workflows
│   └── Automation Rules
│
├── Monitoring
│   ├── Logs
│   │   ├── System Logs
│   │   ├── Claude Logs
│   │   └── Error Logs
│   ├── Metrics
│   └── Reports
│
└── Settings
    ├── General
    ├── Appearance
    ├── Shortcuts
    ├── MCP Config
    └── Claude Settings
```

### 4.2 데이터 플로우

```
User Input → Command Parser → Task Manager
                                    ↓
Context Manager ← → Claude Code ← → MCP Servers
        ↓                              ↓
    UI Update ← ← ← ← ← ← ← ← Log Stream
```

## 5. 주요 화면별 와이어프레임

### 5.1 초기 설정 화면

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Welcome to Claude Code Controller                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ╭─────────────╮                               │
│                              │     CCC     │                               │
│                              │    v1.0     │                               │
│                              ╰─────────────╯                               │
│                                                                             │
│  Let's set up your environment:                                            │
│                                                                             │
│  1. Claude Code Installation                                    [✓] Found   │
│     Location: /usr/local/bin/claude-code                                   │
│                                                                             │
│  2. MCP Servers                                                            │
│     □ taskmanager    [Not found]                     [Install] [Skip]     │
│     □ context7       [Not found]                     [Install] [Skip]     │
│                                                                             │
│  3. API Configuration                                                       │
│     Claude API Key: ********************************          [Verify]    │
│                                                                             │
│  4. Default Project Directory                                               │
│     Path: [~/Projects                                    ]     [Browse]    │
│                                                                             │
│                    [← Back]            [Continue →]                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 작업 생성 화면

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Create New Task                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Task Title:                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Implement user authentication system                                 │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Description:                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Create a complete authentication system with:                        │  │
│  │ - User registration and login                                       │  │
│  │ - JWT token management                                              │  │
│  │ - Password reset functionality                                      │  │
│  │ - Role-based access control                                         │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Sub-tasks: (will be auto-generated)                                       │
│  ☑ Break down into smaller tasks                                           │
│  ☑ Generate task dependencies                                              │
│                                                                             │
│  Context:                                                                   │
│  ☑ Use current project context                                             │
│  ☐ Load from template: [Select template...     ▼]                         │
│                                                                             │
│  Automation:                                                                │
│  ○ Manual approval for each step                                           │
│  ● Auto-approve if confidence > 90%                                        │
│  ○ Fully automated (no approval needed)                                    │
│                                                                             │
│                    [Cancel]            [Create Task]                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 작업 승인 화면

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Task Approval Required                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Task: Create User Model                                                    │
│  Status: Completed (Awaiting Approval)                                     │
│  Confidence: 95%                                                            │
│                                                                             │
│  Changes Made:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ + Created: src/models/User.ts                                       │  │
│  │ + Created: src/models/index.ts                                      │  │
│  │ M Modified: package.json (added dependencies)                      │  │
│  │                                                                     │  │
│  │ Dependencies added:                                                 │  │
│  │ - bcrypt@5.1.0                                                     │  │
│  │ - jsonwebtoken@9.0.0                                               │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Code Preview:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ // src/models/User.ts                                              │  │
│  │ import { Schema, model } from 'mongoose';                          │  │
│  │ import bcrypt from 'bcrypt';                                       │  │
│  │                                                                     │  │
│  │ const UserSchema = new Schema({                                    │  │
│  │   email: { type: String, required: true, unique: true },           │  │
│  │   password: { type: String, required: true },                      │  │
│  │   // ... (view more)                                               │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [A] Approve  [R] Retry  [M] Modify  [S] Skip  [X] Reject                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 6. 애니메이션 및 트랜지션

### 6.1 애니메이션 타입

```javascript
const animations = {
  // 프로그레스 바 애니메이션
  progressBar: {
    type: 'smooth',
    duration: 300,
    easing: 'ease-out',
    frames: [
      '░░░░░░░░░░',
      '█░░░░░░░░░', 
      '██░░░░░░░░',
      '███░░░░░░░',
      // ...
    ]
  },
  
  // 로딩 스피너
  spinner: {
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    interval: 80
  },
  
  // 상태 인디케이터
  statusDot: {
    active: '●',
    pulse: ['●', '○', '●'],
    interval: 500
  },
  
  // 타이핑 효과
  typing: {
    chars: ['', '.', '..', '...'],
    interval: 300
  }
};
```

### 6.2 트랜지션 효과

```javascript
const transitions = {
  // 패널 전환
  panelSwitch: {
    type: 'slide',
    duration: 200,
    direction: 'horizontal'
  },
  
  // 모드 전환
  modeChange: {
    type: 'fade',
    duration: 150,
    steps: [
      { opacity: 1 },
      { opacity: 0.5 },
      { opacity: 0 },
      { opacity: 0.5 },
      { opacity: 1 }
    ]
  },
  
  // 알림 표시
  notification: {
    enter: 'slideDown',
    exit: 'fadeOut',
    duration: 300
  }
};
```

### 6.3 시각적 피드백

```
작업 상태 표시:
  ○ 대기중     (정적)
  ◐ 진행중     (회전 애니메이션)
  ◉ 검토대기   (점멸)
  ✓ 완료       (체크 애니메이션)
  ✗ 실패       (진동 효과)

진행률 표시:
  [░░░░░░░░░░] 0%
  [██░░░░░░░░] 20%
  [████░░░░░░] 40%
  [██████░░░░] 60%
  [████████░░] 80%
  [██████████] 100%

활성 상태:
  Idle    : ○ (회색)
  Active  : ● (녹색, 점멸)
  Warning : ● (노란색, 빠른 점멸)
  Error   : ● (빨간색, 정적)
```

## 7. 접근성 고려사항

### 7.1 스크린 리더 지원

```javascript
const a11y = {
  // ARIA 레이블
  labels: {
    taskList: 'Task list, use arrow keys to navigate',
    progressBar: 'Task progress: {percentage}% complete',
    statusIndicator: 'Status: {status}',
    logArea: 'Log output area, auto-scrolling {enabled|disabled}'
  },
  
  // 키보드 네비게이션 공지
  announcements: {
    panelFocus: 'Focused on {panelName} panel',
    taskSelected: 'Selected task: {taskName}',
    modeChanged: 'Switched to {modeName} mode',
    actionCompleted: '{action} completed successfully'
  },
  
  // 포커스 관리
  focusManagement: {
    trapFocus: true,
    restoreFocus: true,
    skipLinks: ['Skip to main content', 'Skip to task list']
  }
};
```

### 7.2 고대비 모드

```
고대비 테마 요소:
  - 순수 흑백 배경
  - 굵은 테두리 (2px)
  - 큰 텍스트 크기 옵션
  - 명확한 포커스 인디케이터
  - 색상에만 의존하지 않는 상태 표시
```

### 7.3 키보드 전용 사용

```
모든 기능에 대한 키보드 접근:
  - Tab 순서 최적화
  - 단축키 커스터마이징
  - 포커스 표시 강화
  - 모달 다이얼로그 Esc 닫기
  - 방향키 네비게이션
```

## 8. 반응형 레이아웃 (터미널 크기 대응)

### 8.1 크기별 레이아웃

```
최소 크기 (80x24):
┌─────────────────────────────────────┐
│ CCC │ Tasks: 3 │ ● Active           │
├─────────────────────────────────────┤
│ > Current Task                      │
│   Implementing API...               │
│   Progress: ████░░ 67%              │
│                                     │
│ [Logs]                              │
│ 14:23:45 Task started               │
│ 14:23:46 Creating endpoint...       │
├─────────────────────────────────────┤
│ [⌘K] Cmd │ [⌘H] Help │ [⌘Q] Quit  │
└─────────────────────────────────────┘

표준 크기 (120x30):
[기본 레이아웃 - 2x2 그리드]

대형 크기 (160x50+):
[확장 레이아웃 - 추가 패널, 상세 정보]
```

### 8.2 동적 레이아웃 조정

```javascript
const responsiveLayout = {
  breakpoints: {
    small: { width: 80, height: 24 },
    medium: { width: 120, height: 30 },
    large: { width: 160, height: 40 },
    xlarge: { width: 200, height: 50 }
  },
  
  layouts: {
    small: {
      panels: ['main'],
      showStatusBar: true,
      abbreviate: true
    },
    medium: {
      panels: ['tasks', 'work'],
      showStatusBar: true,
      splitRatio: [0.3, 0.7]
    },
    large: {
      panels: ['tasks', 'work', 'context', 'logs'],
      grid: '2x2',
      showStatusBar: true
    },
    xlarge: {
      panels: ['all'],
      additionalPanels: ['metrics', 'history'],
      grid: '3x2'
    }
  }
};
```

### 8.3 콘텐츠 우선순위

```
크기별 표시 우선순위:

1. 필수 (모든 크기):
   - 현재 작업 상태
   - 주요 액션 버튼
   - 중요 알림

2. 중요 (medium+):
   - 작업 목록
   - 실시간 로그
   - 진행률 표시

3. 보조 (large+):
   - 컨텍스트 정보
   - 상세 메트릭
   - 히스토리

4. 추가 (xlarge+):
   - 대시보드 위젯
   - 고급 설정
   - 분석 도구
```

## 9. 디자인 시스템 구현 가이드

### 9.1 컴포넌트 라이브러리

```javascript
// Blessed 기반 컴포넌트 예시
const components = {
  Button: {
    base: {
      height: 3,
      padding: { left: 2, right: 2 },
      border: { type: 'line' },
      style: {
        fg: 'white',
        bg: 'blue',
        border: { fg: 'blue' },
        hover: { bg: 'lightblue' },
        focus: { border: { fg: 'cyan' } }
      }
    },
    variants: {
      primary: { style: { bg: 'blue' } },
      secondary: { style: { bg: 'gray' } },
      danger: { style: { bg: 'red' } }
    }
  },
  
  ProgressBar: {
    base: {
      height: 1,
      width: '100%',
      filled: '█',
      empty: '░',
      style: { fg: 'green' }
    }
  }
};
```

### 9.2 레이아웃 시스템

```javascript
const layoutSystem = {
  // 그리드 시스템
  grid: {
    columns: 12,
    gutter: 1,
    margin: 1
  },
  
  // 스페이싱
  spacing: {
    xs: 1,
    sm: 2,
    md: 4,
    lg: 6,
    xl: 8
  },
  
  // 패널 설정
  panels: {
    minWidth: 20,
    minHeight: 5,
    resizable: true,
    collapsible: true
  }
};
```

## 10. 구현 권장사항

### 10.1 성능 최적화
- 가상 스크롤링으로 대량 로그 처리
- 디바운싱으로 빈번한 업데이트 제어
- 불필요한 리렌더링 방지

### 10.2 사용자 경험
- 즉각적인 시각적 피드백
- 명확한 에러 메시지
- 실행 취소/다시 실행 지원

### 10.3 확장성
- 플러그인 UI 컴포넌트 지원
- 커스텀 테마 생성 도구
- 레이아웃 프리셋 저장/불러오기

---

이 디자인 시스템은 Claude Code Controller가 macOS 사용자들에게 친숙하면서도 터미널 환경에 최적화된 경험을 제공하도록 설계되었습니다. 모든 요소는 생산성, 접근성, 그리고 확장성을 고려하여 만들어졌습니다.