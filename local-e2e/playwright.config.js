const { defineConfig, devices } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Load environment variables natively (Node.js 20.12+)
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
} catch (e) {
  // .env might not exist, ignore silently
}

/**
 * @see https://playwright.dev/docs/test-configuration
 */
// Default to the single-server URL (npm run start → https://localhost:8080).
// Override via BASE_URL in local-e2e/.env for other setups.
const BASE_URL = process.env.BASE_URL || 'https://localhost:8080';

module.exports = defineConfig({
  testDir: './tests',
  // fullyParallel: false — 테스트를 직렬 실행해 CMS 동시 접속 충돌을 방지한다.
  // 실제 CMS 서버는 동시 세션 수가 제한적이어서 병렬 실행 시 opacity-100 timeout이 발생한다.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // workers: 1 — 로컬에서도 직렬 실행. CI도 동일.
  workers: 1,
  reporter: 'html',
  timeout: 60000,
  // webServer 블록 없음 — npm run stack (또는 npm run dev:stack)을 먼저 실행한 뒤 playwright를 시작하세요.
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [
    // Firefox는 npx playwright install firefox 로 바이너리 설치 후 아래 주석 해제
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
  ],
});
