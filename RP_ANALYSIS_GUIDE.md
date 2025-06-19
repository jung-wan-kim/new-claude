# Claude Code Controller - RP 분석 가이드

## 프로젝트 개요
Claude Code를 제어하고 관리하는 지능형 터미널 프로그램 개발

## RP별 분석 작업

### 1. Product Manager (.rp/product-manager.md)
```bash
claude-code ".rp/PROJECT_CONTEXT.md와 .rp/product-manager.md를 참고해서 
Claude Code Controller의 상세 PRD를 작성해줘. 
사용자 스토리, 기능 요구사항, 비기능 요구사항을 포함해줘"
```

### 2. UX/UI Designer (.rp/ux-ui-designer.md)
```bash
claude-code ".rp/PROJECT_CONTEXT.md와 .rp/ux-ui-designer.md를 참고해서 
터미널 UI의 디자인 시스템을 설계해줘. 
레이아웃, 컬러 스킴, 단축키 체계를 포함해줘"
```

### 3. Backend Developer (.rp/backend-developer.md)
```bash
claude-code ".rp/PROJECT_CONTEXT.md와 .rp/backend-developer.md를 참고해서 
Claude Code CLI 통신 모듈과 MCP 클라이언트 아키텍처를 설계해줘"
```

### 4. Frontend Developer (.rp/frontend-developer.md)
```bash
claude-code ".rp/PROJECT_CONTEXT.md와 .rp/frontend-developer.md를 참고해서 
Blessed/Ink를 사용한 터미널 UI 컴포넌트 구조를 설계해줘"
```

### 5. DevOps Engineer (.rp/devops-engineer.md)
```bash
claude-code ".rp/PROJECT_CONTEXT.md와 .rp/devops-engineer.md를 참고해서 
빌드 파이프라인과 배포 전략을 수립해줘. 
npm 패키지 배포 프로세스도 포함해줘"
```

### 6. QA Engineer (.rp/qa-engineer.md)
```bash
claude-code ".rp/PROJECT_CONTEXT.md와 .rp/qa-engineer.md를 참고해서 
테스트 전략을 수립해줘. 유닛 테스트, 통합 테스트, E2E 테스트 계획을 포함해줘"
```

### 7. Technical Writer (.rp/technical-writer.md)
```bash
claude-code ".rp/PROJECT_CONTEXT.md와 .rp/technical-writer.md를 참고해서 
사용자 매뉴얼과 API 문서 구조를 설계해줘"
```

### 8. Project Manager (.rp/project-manager.md)
```bash
claude-code ".rp/PROJECT_CONTEXT.md와 .rp/project-manager.md를 참고해서 
프로젝트 일정과 마일스톤을 수립해줘. 리스크 관리 계획도 포함해줘"
```

## 통합 분석 (전체 팀)
```bash
claude-code ".rp/PROJECT_CONTEXT.md와 .rp/ 디렉토리의 모든 RP 파일을 참고해서 
Claude Code Controller 프로젝트의 전체 개발 계획을 수립해줘. 
각 RP의 관점에서 필요한 작업들을 통합해서 정리해줘"
```

## 분석 순서 권장사항
1. Product Manager - 요구사항 정의
2. UX/UI Designer - 사용자 경험 설계
3. Backend/Frontend Developer - 기술 아키텍처
4. DevOps Engineer - 인프라 및 배포
5. QA Engineer - 품질 보증 계획
6. Technical Writer - 문서화 계획
7. Project Manager - 전체 프로젝트 관리

## 다음 단계
1. 위 명령어들을 순차적으로 실행하여 각 RP의 분석 결과 획득
2. 분석 결과를 종합하여 구체적인 개발 계획 수립
3. MVP 개발 착수