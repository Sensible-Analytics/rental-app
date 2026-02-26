const { _electron: electron } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Comprehensive Smoke Test', () => {
  let app;
  let window;

  test.beforeAll(async () => {
    app = await electron.launch({
      args: [path.join(__dirname, '../../src/main/index.js')],
      env: { ...process.env, NODE_ENV: 'test' }
    });
    window = await app.firstWindow();
    window.on('console', msg => console.log(`[Renderer]: ${msg.text()}`));
    window.on('pageerror', err => console.log(`[Renderer Error]: ${err.message}`));
    await window.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    if (app) await app.close();
  });

  test('Dashboard should finish loading data', async () => {
    // Assert that the "Loading..." text is NOT visible eventually
    // The "NET WEALTH" card has id="stat-wealth" which starts with "Loading..."
    const wealthValue = window.locator('#stat-wealth');
    await expect(wealthValue).not.toContainText('Loading', { timeout: 10000 });
    
    // Check for specific values format (e.g. currency symbol)
    // This confirms data was actually processed and rendered
    await expect(wealthValue).toContainText(/₹|A\$/);
  });

  test('Properties should be listed and clickable', async () => {
    // Wait for grid to populate
    const propertyCard = window.locator('.property-card').first();
    await expect(propertyCard).toBeVisible({ timeout: 5000 });

    // Click it
    await propertyCard.click();

    // Verify detail view opens
    const detailView = window.locator('#view-property-detail');
    await expect(detailView).toHaveClass(/active/);

    // Verify Back button works
    await window.click('.back-btn');
    const dashboardView = window.locator('#view-dashboard');
    await expect(dashboardView).toHaveClass(/active/);
  });
});
