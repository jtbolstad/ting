import { defineConfig, devices } from '@playwright/test';

// Point the suite at a deployed environment instead of a local dev stack, e.g.
//   PLAYWRIGHT_BASE_URL=https://staging.ting.hpvel.no pnpm test:e2e
// When set, no local servers are started — the tests run against that URL.
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const useLocalServers = !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: useLocalServers
    ? [
        {
          command: 'pnpm run dev:server',
          url: 'http://localhost:3001/health',
          reuseExistingServer: !process.env.CI,
          timeout: 120000,
        },
        {
          command: 'pnpm run dev:client',
          url: 'http://localhost:3000',
          reuseExistingServer: !process.env.CI,
          timeout: 120000,
        },
      ]
    : undefined,
});
