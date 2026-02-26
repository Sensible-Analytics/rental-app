const { _electron: electron } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Dashboard E2E', () => {
  let app;
  let firstWindow;

  test.beforeAll(async () => {
    // Launch Electron app
    app = await electron.launch({
      args: [path.join(__dirname, '../../src/main/index.js')],
    });
    firstWindow = await app.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  test('should load dashboard and display title', async () => {
    const title = await firstWindow.title();
    // Assuming title is "Property Manager" or set in index.html
    expect(title).toBe('Property Manager - Premium Suite'); 
  });

  test('should display statistic cards', async () => {
    // Check if Stats cards exist
    // Classes or IDs might differ, using text locator strategy for resilience
    await expect(firstWindow.locator('text=NET WEALTH')).toBeVisible();
    await expect(firstWindow.locator('text=MONTHLY CASHFLOW')).toBeVisible();
    await expect(firstWindow.locator('text=PENDING ACTIONS')).toBeVisible();
  });

  test('should display properties list', async () => {
    await expect(firstWindow.locator('text=ACTIVE PORTFOLIO')).toBeVisible();
    // Check if at least one property card is rendered if seeded
    // This depends on the seeded data.
  });
});
