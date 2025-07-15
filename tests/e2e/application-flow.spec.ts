import { test, expect } from '@playwright/test';

test.describe('Employee Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/employee-application');
  });

  test('should load the application form', async ({ page }) => {
    await expect(page).toHaveTitle(/Alliance Chemical/);
    await expect(page.getByText('Employment Application')).toBeVisible();
    await expect(page.getByText('Position')).toBeVisible();
  });

  test('should show test mode in development', async ({ page }) => {
    await expect(page.getByText('🧪 Development Mode')).toBeVisible();
    await expect(page.getByText('📋 Load Complete Application')).toBeVisible();
    await expect(page.getByText('🌱 Load Entry Level Profile')).toBeVisible();
    await expect(page.getByText('🚀 Load Experienced Profile')).toBeVisible();
  });

  test('should fill form with test data', async ({ page }) => {
    await page.getByText('📋 Load Complete Application').click();
    await expect(page.getByText('✅ Test data loaded!')).toBeVisible();
  });

  test('should navigate through all form steps', async ({ page }) => {
    // Fill with test data first
    await page.getByText('📋 Load Complete Application').click();
    await expect(page.getByText('✅ Test data loaded!')).toBeVisible();

    // Step 1: Position (already filled)
    await expect(page.getByText('Position')).toBeVisible();
    await page.getByText('Next').click();

    // Step 2: Assessment
    await expect(page.getByText('Assessment')).toBeVisible();
    await page.getByText('Next').click();

    // Step 3: Personal Information
    await expect(page.getByText('Personal')).toBeVisible();
    await expect(page.getByDisplayValue('John')).toBeVisible();
    await expect(page.getByDisplayValue('Doe')).toBeVisible();
    await page.getByText('Next').click();

    // Step 4: Documents
    await expect(page.getByText('Documents')).toBeVisible();
    await page.getByText('Next').click();

    // Step 5: Experience
    await expect(page.getByText('Experience')).toBeVisible();
    await expect(page.getByDisplayValue('Tech Corp')).toBeVisible();
    await page.getByText('Next').click();

    // Step 6: Education
    await expect(page.getByText('Education')).toBeVisible();
    await expect(page.getByDisplayValue('University of Texas')).toBeVisible();
    await page.getByText('Next').click();

    // Step 7: References
    await expect(page.getByText('References')).toBeVisible();
    await expect(page.getByDisplayValue('Jane Manager')).toBeVisible();
    await page.getByText('Next').click();

    // Step 8: Signature
    await expect(page.getByText('Signature')).toBeVisible();
    await expect(page.getByTestId('signature-canvas') || page.getByText('Type')).toBeVisible();
  });

  test('should allow navigation back and forth', async ({ page }) => {
    // Fill with test data
    await page.getByText('📋 Load Complete Application').click();
    await expect(page.getByText('✅ Test data loaded!')).toBeVisible();

    // Go forward
    await page.getByText('Next').click();
    await expect(page.getByText('Assessment')).toBeVisible();

    await page.getByText('Next').click();
    await expect(page.getByText('Personal')).toBeVisible();

    // Go back
    await page.getByText('Back').click();
    await expect(page.getByText('Assessment')).toBeVisible();

    await page.getByText('Back').click();
    await expect(page.getByText('Position')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to proceed without filling anything
    await page.getByText('Next').click();
    
    // Should stay on the same step
    await expect(page.getByText('Position')).toBeVisible();
  });

  test('should show progress indicator', async ({ page }) => {
    await expect(page.locator('.stepper') || page.getByText('Step 1 of 8')).toBeVisible();
  });
});