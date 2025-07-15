import { test, expect } from '@playwright/test';

test.describe('Simple Test', () => {
  test('should load page', async ({ page }) => {
    console.log('Starting test...');
    
    // Set longer timeout for navigation
    await page.goto('/employee-application', { timeout: 60000 });
    
    console.log('Page loaded');
    
    // Check if page loaded
    await expect(page).toHaveTitle(/Alliance Chemical/);
    
    console.log('Test completed');
  });
}); 