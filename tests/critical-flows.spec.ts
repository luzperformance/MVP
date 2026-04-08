import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test('deve permitir fazer login com sucesso', async ({ page }) => {
    // Navigate to local dev server (default vite port)
    await page.goto('http://localhost:5173/login');
    
    // Fill the login form
    await page.fill('input[name="email"]', 'drluzardi93@gmail.com');
    await page.fill('input[name="password"]', 'teste1');
    
    // Click the login button
    await page.click('button[type="submit"]');
    
    // Check if navigated to dashboard or showing welcome message
    // (Actual check depends on the app implementation)
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
