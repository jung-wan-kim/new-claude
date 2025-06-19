#!/bin/bash

# MCP 서버 연결 테스트 스크립트

echo "🧪 Testing MCP Server Connections..."
echo "===================================="

# TypeScript 컴파일
echo "📦 Compiling TypeScript..."
npx tsc src/test/test-mcp-connection.ts --outDir dist/test --module commonjs --target es2020 --esModuleInterop

# 테스트 실행
echo -e "\n🚀 Running MCP connection test..."
node dist/test/test-mcp-connection.js

echo -e "\n✅ Test complete!"