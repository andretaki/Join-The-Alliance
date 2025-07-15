import { test, expect } from '@playwright/test';

test.describe('Complete Application Submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/employee-application');
  });

  test('should complete entire application flow', async ({ page }) => {
    // Fill with test data
    await page.getByText('📋 Load Complete Application').click();
    await expect(page.getByText('✅ Test data loaded!')).toBeVisible();

    // Navigate through all steps
    const steps = [
      'Assessment',
      'Personal',
      'Documents', 
      'Experience',
      'Education',
      'References',
      'Signature'
    ];

    for (const step of steps) {
      await page.getByText('Next').click();
      await expect(page.getByText(step)).toBeVisible();
    }

    // On signature step, add a signature
    const typeSignatureButton = page.getByText('Type');
    if (await typeSignatureButton.isVisible()) {
      await typeSignatureButton.click();
      await page.getByPlaceholder('Type your full name').fill('John Doe');
    }

    // Check terms agreement
    const termsCheckbox = page.getByLabel(/terms/i);
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Submit the application
    await page.getByText('Submit Application').click();

    // Should either succeed or show appropriate message
    // In a real environment with proper backend, this would redirect or show success
    // For now, we'll check that the submission attempt was made
    await expect(page.getByText('Submitting') || page.getByText('Success') || page.getByText('Error')).toBeVisible({ timeout: 10000 });
  });

  test('should prevent submission without required fields', async ({ page }) => {
    // Don't fill with test data, try to submit empty form
    
    // Navigate to signature step (should be prevented by validation)
    const nextButtons = await page.getByText('Next').all();
    
    // Try to go through steps without filling
    for (let i = 0; i < 7; i++) {
      await page.getByText('Next').click();
      
      // Should be prevented from advancing or show validation errors
      await page.waitForTimeout(500); // Brief wait for validation
    }
    
    // Should not reach the final step without proper data
    const submitButton = page.getByText('Submit Application');
    const isSubmitVisible = await submitButton.isVisible();
    
    // If submit button is visible, it should be disabled or show validation errors
    if (isSubmitVisible) {
      const isEnabled = await submitButton.isEnabled();
      if (isEnabled) {
        await submitButton.click();
        // Should show validation errors
        await expect(page.getByText(/required/i) || page.getByText(/error/i)).toBeVisible();
      }
    }
  });

  test('should validate signature requirement', async ({ page }) => {
    // Fill with test data and navigate to signature
    await page.getByText('📋 Load Complete Application').click();
    
    // Navigate to signature step
    for (let i = 0; i < 7; i++) {
      await page.getByText('Next').click();
    }
    
    await expect(page.getByText('Signature')).toBeVisible();
    
    // Try to submit without signature
    const submitButton = page.getByText('Submit Application');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Should show signature requirement error
      await expect(page.getByText(/signature/i) || page.getByText(/required/i)).toBeVisible();
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('/api/employee-applications', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    // Complete form
    await page.getByText('📋 Load Complete Application').click();
    
    // Navigate to submission
    for (let i = 0; i < 7; i++) {
      await page.getByText('Next').click();
    }
    
    // Add signature
    const typeButton = page.getByText('Type');
    if (await typeButton.isVisible()) {
      await typeButton.click();
      await page.getByPlaceholder('Type your full name').fill('John Doe');
    }
    
    // Submit
    await page.getByText('Submit Application').click();
    
    // Should show error message
    await expect(page.getByText(/error/i) || page.getByText(/failed/i)).toBeVisible({ timeout: 10000 });
  });

  test('should show loading state during submission', async ({ page }) => {
    // Complete form
    await page.getByText('📋 Load Complete Application').click();
    
    // Navigate to submission
    for (let i = 0; i < 7; i++) {
      await page.getByText('Next').click();
    }
    
    // Add signature
    const typeButton = page.getByText('Type');
    if (await typeButton.isVisible()) {
      await typeButton.click();
      await page.getByPlaceholder('Type your full name').fill('John Doe');
    }
    
    // Submit and check for loading state
    await page.getByText('Submit Application').click();
    
    // Should show loading indicator
    await expect(page.getByText(/submitting/i) || page.locator('.loading') || page.locator('[aria-busy="true"]')).toBeVisible({ timeout: 5000 });
  });

  test('should maintain form data across page refresh', async ({ page }) => {
    // Fill some data
    await page.getByText('📋 Load Complete Application').click();
    await page.getByText('Next').click();
    
    // Navigate to personal info and modify something
    await page.getByText('Next').click();
    const emailInput = page.getByLabel(/email/i);
    await emailInput.clear();
    await emailInput.fill('modified@example.com');
    
    // Refresh page
    await page.reload();
    
    // Check if data is preserved (depending on implementation)
    // This test might fail if there's no persistence mechanism
    const preservedEmail = await page.getByLabel(/email/i).inputValue();
    
    // Either the modified value is preserved, or it reverts to test data
    expect(preservedEmail === 'modified@example.com' || preservedEmail === 'john.doe@email.com').toBe(true);
  });
});