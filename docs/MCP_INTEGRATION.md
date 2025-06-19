# MCP (Model Context Protocol) 통합 가이드

## 개요

Claude Code Controller는 두 개의 MCP 서버와 통합됩니다:
1. **TaskManager** - 작업 관리 및 워크플로우 자동화
2. **Context7** - 컨텍스트 저장 및 검색

## 설정

### 1. 환경 변수 설정

`.env` 파일을 생성하고 필요한 환경 변수를 설정합니다:

```bash
cp .env.example .env
```

필수 환경 변수:
- `CONTEXT7_API_KEY`: Context7 서비스 API 키

### 2. MCP 서버 설치

MCP 서버는 자동으로 npx를 통해 실행되지만, 로컬에 설치하려면:

```bash
# TaskManager MCP 서버
npm install -g @mcphq/mcp-server-task-manager

# Context7 MCP 서버
npm install -g @context7/mcp-server
```

## 아키텍처

```
┌─────────────────────────────────┐
│   Claude Code Controller        │
├─────────────────────────────────┤
│         MCPManager              │
├──────────────┬──────────────────┤
│TaskManager   │   Context7       │
│   Client     │    Client        │
├──────────────┴──────────────────┤
│    @modelcontextprotocol/sdk    │
├──────────────┬──────────────────┤
│  StdioClient │  StdioClient     │
│  Transport   │  Transport       │
└──────┬───────┴────────┬─────────┘
       │                │
       ▼                ▼
┌──────────────┐ ┌───────────────┐
│ TaskManager  │ │   Context7    │
│ MCP Server   │ │  MCP Server   │
└──────────────┘ └───────────────┘
```

## 사용 가능한 기능

### TaskManager

1. **요청 생성**
   ```typescript
   const { requestId } = await mcpManager.taskManager.createRequest({
     originalRequest: "사용자의 원본 요청",
     tasks: [
       { title: "작업 1", description: "설명" },
       { title: "작업 2", description: "설명" }
     ]
   });
   ```

2. **다음 작업 가져오기**
   ```typescript
   const nextTask = await mcpManager.taskManager.getNextTask(requestId);
   ```

3. **작업 완료 표시**
   ```typescript
   await mcpManager.taskManager.markTaskDone(taskId, "완료 세부사항");
   ```

4. **작업 승인**
   ```typescript
   await mcpManager.taskManager.approveTaskCompletion(requestId, taskId);
   ```

### Context7

1. **컨텍스트 생성**
   ```typescript
   const context = await mcpManager.context7.createContext({
     title: "제목",
     content: "내용",
     type: "code",
     tags: ["태그1", "태그2"]
   });
   ```

2. **컨텍스트 검색**
   ```typescript
   const results = await mcpManager.context7.search("검색어", {
     type: "code",
     tags: ["javascript"]
   });
   ```

3. **컨텍스트 업데이트**
   ```typescript
   await mcpManager.context7.updateContext(contextId, {
     content: "업데이트된 내용"
   });
   ```

## 테스트

MCP 서버 연결을 테스트하려면:

```bash
# 테스트 스크립트 실행
./scripts/test-mcp.sh
```

또는 직접 실행:

```bash
# TypeScript 컴파일
npm run build

# 테스트 실행
node dist/test/test-mcp-connection.js
```

## 문제 해결

### 1. TaskManager 연결 실패
- npx 캐시 정리: `npx clear-npx-cache`
- 직접 설치 후 경로 지정: `TASKMANAGER_MCP_PATH=/path/to/server`

### 2. Context7 연결 실패
- API 키 확인: `CONTEXT7_API_KEY`가 올바르게 설정되었는지 확인
- 네트워크 연결 확인

### 3. 권한 오류
- macOS에서 실행 권한 필요: `chmod +x scripts/test-mcp.sh`

## 개발 팁

1. **오류 처리**: MCP 서버 연결은 선택적이므로 하나가 실패해도 앱이 계속 작동해야 함
2. **재연결**: 연결이 끊어진 경우 `mcpManager.reconnect()` 사용
3. **상태 확인**: `mcpManager.getStatus()`로 현재 연결 상태 확인