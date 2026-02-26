const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  retries: 0,
  workers: 1, // Electron usually prefers single worker to avoid port conflicts
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'electron',
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
