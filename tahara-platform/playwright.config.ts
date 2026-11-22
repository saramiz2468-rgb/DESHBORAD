import { defineConfig, devices } from '@playwright/test';

/**
 * E2E runs against PRODUCTION builds (`npm run build` first), because the
 * service worker and CSP behave differently in `next dev`.
 *  - 3000: apps/web
 *  - 3001: apps/admin with ADMIN_PREVIEW_ENABLED=true  (design review)
 *  - 3002: apps/admin locked (default production behaviour)
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { locale: 'he-IL', timezoneId: 'Asia/Jerusalem', trace: 'off' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } },
    },
  ],
  webServer: [
    {
      command: 'npm run start -w @tahara/web',
      url: 'http://localhost:3000/',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm run start -w @tahara/admin',
      url: 'http://localhost:3001/login',
      env: { ADMIN_PREVIEW_ENABLED: 'true' },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npx --workspace @tahara/admin next start --port 3002',
      port: 3002,
      env: { ADMIN_PREVIEW_ENABLED: 'false' },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
