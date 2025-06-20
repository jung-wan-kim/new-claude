# RP 자동화 시스템 사용 가이드

## 🚀 시작하기

이 프로젝트에는 RP(Role-Playing) 자동화 시스템이 설정되어 있습니다.

### 프로젝트 정보
- **프로젝트명**: new-claude
- **설명**: Claude 프로젝트 테스트
- **타입**: 웹 애플리케이션

### 설정된 RP 목록
- **product-manager**: Product Manager - 제품의 비전을 정의하고 요구사항을 구체화
- **ux-ui-designer**: UX/UI Designer - 사용자 경험을 최적화하고 인터페이스를 설계
- **frontend-developer**: Frontend Developer - 사용자 인터페이스를 구현
- **backend-developer**: Backend Developer - 서버 애플리케이션과 비즈니스 로직을 구현
- **devops-engineer**: DevOps Engineer - 빌드, 배포, 운영을 자동화
- **qa-engineer**: QA Engineer - 소프트웨어 품질을 보장
- **technical-writer**: Technical Writer - 기술 문서를 작성
- **project-manager**: Project Manager - 프로젝트 전체를 관리하고 조율

## 📖 사용 방법

### 1. Claude Code에서 RP 활용하기

각 RP 파일과 프로젝트 컨텍스트를 함께 사용하여 작업을 수행합니다:

```bash
# 프로젝트 컨텍스트와 함께 사용 (권장)
claude-code ".rp/PROJECT_CONTEXT.md와 .rp/product-manager.md를 참고해서 
            이 프로젝트의 PRD를 작성해줘"

# 특정 RP만 사용
claude-code ".rp/frontend-developer.md를 참고해서 컴포넌트를 개발해줘"
```

### 2. 전체 프로젝트 워크플로우

1. **Product Manager**: 요구사항 정의 및 PRD 작성
2. **UX/UI Designer**: 디자인 시스템 구축
3. **Frontend Developer**: UI 구현
4. **Backend Developer**: API 개발
5. **DevOps Engineer**: 인프라 구축 및 배포
6. **QA Engineer**: 테스트 및 품질 보증
7. **Technical Writer**: 문서화
8. **Project Manager**: 전체 프로젝트 관리

### 3. 프로젝트 컨텍스트 업데이트

프로젝트가 진행되면서 PROJECT_CONTEXT.md 파일을 업데이트하여 
RP들이 최신 프로젝트 상태를 반영할 수 있도록 합니다:

```bash
# PROJECT_CONTEXT.md 편집
vim .rp/PROJECT_CONTEXT.md
```

### 4. RP 파일 커스터마이징

프로젝트 특성에 맞게 RP 파일을 수정할 수 있습니다:

```bash
# 예: Backend Developer RP에 프로젝트 특화 기술 스택 추가
vim .rp/backend-developer.md
```

## 🔧 추가 설정

### RP 추가/제거

```bash
# RP 재설정
../rp-automation/init-rp.sh
```

### 커스텀 RP 생성

`.rp/` 디렉토리에 새로운 `.md` 파일을 추가하여 커스텀 RP를 생성할 수 있습니다.

## 📚 팁

1. **프로젝트 컨텍스트 우선**: 항상 PROJECT_CONTEXT.md를 함께 참조하도록 하세요
2. **단계별 진행**: 복잡한 작업은 여러 RP를 순차적으로 활용하세요
3. **피드백 반영**: RP의 출력물을 검토하고 필요시 컨텍스트를 업데이트하세요

## 📚 참고 자료

- [RP 자동화 시스템 전체 문서](https://github.com/jung-wan-kim/rp-automation)
- [Claude Code 사용법](https://docs.anthropic.com/claude-code)