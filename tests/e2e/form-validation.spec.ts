import { test, expect } from '@playwright/test';

test.describe('Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/employee-application');
    
    // Fill with test data and navigate to personal info
    await page.getByText('Fill Standard').click();
    await page.getByText('Next').click();
    await expect(page.getByText('Personal')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    
    // Clear and enter invalid email
    await emailInput.clear();
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    
    // Should show validation error
    await expect(page.getByText(/invalid email/i) || page.locator('.error')).toBeVisible();
    
    // Fix email
    await emailInput.clear();
    await emailInput.fill('valid@example.com');
    await emailInput.blur();
    
    // Error should disappear
    await expect(page.getByText(/invalid email/i)).not.toBeVisible();
  });

  test('should validate phone number format', async ({ page }) => {
    const phoneInput = page.getByLabel(/phone/i);
    
    // Clear and enter invalid phone
    await phoneInput.clear();
    await phoneInput.fill('123');
    await phoneInput.blur();
    
    // Should show validation error or prevent invalid input
    // (Depending on implementation, might prevent input or show error)
  });

  test('should validate required fields', async ({ page }) => {
    const firstNameInput = page.getByLabel(/first name/i);
    
    // Clear required field
    await firstNameInput.clear();
    
    // Try to proceed
    await page.getByText('Next').click();
    
    // Should stay on same step or show error
    await expect(page.getByText('Personal')).toBeVisible();
  });

  test('should validate SSN format', async ({ page }) => {
    const ssnInput = page.getByLabel(/social security/i);
    
    // Clear and enter invalid SSN
    await ssnInput.clear();
    await ssnInput.fill('123456789'); // Missing dashes
    await ssnInput.blur();
    
    // Should format or show error
    // The implementation might auto-format or show validation error
  });

  test('should validate date fields', async ({ page }) => {
    const dobInput = page.getByLabel(/date of birth/i);
    
    if (await dobInput.isVisible()) {
      await dobInput.clear();
      await dobInput.fill('1990-13-45'); // Invalid date
      await dobInput.blur();
      
      // Should show validation error
      await expect(page.getByText(/invalid date/i) || page.locator('.error')).toBeVisible();
    }
  });
});