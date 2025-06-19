// UI 스크린샷 테스트
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// UI 프로세스 시작
const uiProcess = spawn('npx', ['tsx', 'src/test/test-ui.ts'], {
  env: { ...process.env, NODE_ENV: 'development' },
  stdio: 'pipe'
});

let output = '';

// 출력 캡처
uiProcess.stdout.on('data', (data) => {
  output += data.toString();
  // 주기적으로 출력 확인
  process.stdout.write(data.toString());
});

uiProcess.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});

uiProcess.on('exit', (code) => {
  console.log(`UI process exited with code ${code}`);
  process.exit(0);
});

function saveScreenshot() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `ui-screenshot-${timestamp}.txt`;
  
  // 터미널 출력을 파일로 저장
  fs.writeFileSync(filename, output);
  console.log(`\nScreenshot saved to ${filename}`);
}

// 3초 후 스크린샷 및 종료
setTimeout(() => {
  saveScreenshot();
  uiProcess.kill();
}, 3000);