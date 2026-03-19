import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    // Fill login form
    await page.fill('input[type="email"]', 'luzardi18@gmail.com');
    await page.fill('input[type="password"]', '1234');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1, h2')).toContainText(/Dashboard|Resumo/i);
  });

  test('should navigate to patients list', async ({ page }) => {
    // Login first (simplified, or use storageState)
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'luzardi18@gmail.com');
    await page.fill('input[type="password"]', '1234');
    await page.click('button[type="submit"]');

    // Click on Patients link in sidebar
    await page.click('a[href="/patients"]');
    await expect(page).toHaveURL(/.*patients/);
    await expect(page.locator('h1, h2')).toContainText(/Pacientes/i);
  });
});
