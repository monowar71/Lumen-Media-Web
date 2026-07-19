import { test, expect } from '@playwright/test';

/**
 * Smoke E2E against a live stack (API :8096 + Vite :5173).
 */
test.describe('LumenMedia smoke', () => {
  test('login → home → library → open item → player', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/server url/i).fill('http://localhost:8096');
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in|create admin/i }).click();

    await expect(page.getByRole('link', { name: /^Home$/i })).toBeVisible({ timeout: 15_000 });

    const moviesNav = page.locator('nav').getByRole('link', { name: /^Movies$/i });
    await expect(moviesNav).toBeVisible({ timeout: 10_000 });
    await moviesNav.click();

    await expect(page).toHaveURL(/\/library\//);
    await expect(page.locator('h1')).toContainText(/Movies/i, { timeout: 10_000 });

    const card = page.getByRole('link', { name: /matrix/i }).first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.click();

    await expect(page.locator('h1')).toContainText(/matrix/i, { timeout: 10_000 });
    await page.getByRole('button', { name: /play|resume/i }).first().click();

    await expect(page.getByRole('application', { name: /video player/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
