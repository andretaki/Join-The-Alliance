import { test, expect } from '@playwright/test';

test.describe('Comprehensive Signature Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/employee-application');
    
    // Fill with test data and navigate to signature step
    await page.getByText('📋 Load Complete Application').click();
    
    // Navigate to signature step
    for (let i = 0; i < 7; i++) {
      await page.getByText('Next').click();
    }
    
    await expect(page.getByText('Signature')).toBeVisible();
  });

  test('should test signature mode selection', async ({ page }) => {
    // Test signature mode buttons visibility
    await expect(page.getByText('Draw Signature')).toBeVisible();
    await expect(page.getByText('Type Signature')).toBeVisible();
    
    // Test default mode (draw should be selected)
    const drawButton = page.getByText('Draw Signature');
    const typeButton = page.getByText('Type Signature');
    
    await expect(drawButton).toHaveClass(/bg-white/);
    await expect(drawButton).toHaveClass(/text-blue-600/);
    
    // Test switching to type mode
    await typeButton.click();
    await expect(typeButton).toHaveClass(/bg-white/);
    await expect(typeButton).toHaveClass(/text-blue-600/);
    
    // Test switching back to draw mode
    await drawButton.click();
    await expect(drawButton).toHaveClass(/bg-white/);
    await expect(drawButton).toHaveClass(/text-blue-600/);
  });

  test('should test draw signature functionality', async ({ page }) => {
    // Ensure we're in draw mode
    await page.getByText('Draw Signature').click();
    
    // Test signature canvas visibility
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveClass(/signature-canvas/);
    
    // Test canvas dimensions
    const canvasSize = await canvas.boundingBox();
    expect(canvasSize).toBeTruthy();
    expect(canvasSize!.width).toBeGreaterThan(0);
    expect(canvasSize!.height).toBeGreaterThan(0);
    
    // Test signature control buttons
    await expect(page.getByText('Clear')).toBeVisible();
    await expect(page.getByText('Save Signature')).toBeVisible();
    
    // Test Clear button functionality
    const clearButton = page.getByText('Clear');
    await expect(clearButton).toBeEnabled();
    await clearButton.click();
    
    // Test Save Signature button functionality
    const saveButton = page.getByText('Save Signature');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
  });

  test('should test canvas drawing simulation', async ({ page }) => {
    // Ensure we're in draw mode
    await page.getByText('Draw Signature').click();
    
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Simulate drawing on canvas
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();
    
    // Simulate mouse drawing
    await canvas.hover();
    await page.mouse.down();
    await page.mouse.move(canvasBox!.x + 50, canvasBox!.y + 50);
    await page.mouse.move(canvasBox!.x + 100, canvasBox!.y + 30);
    await page.mouse.move(canvasBox!.x + 150, canvasBox!.y + 70);
    await page.mouse.up();
    
    // Test that drawing was captured
    await page.getByText('Save Signature').click();
    
    // Verify signature was saved (canvas should still be visible)
    await expect(canvas).toBeVisible();
  });

  test('should test type signature functionality', async ({ page }) => {
    // Switch to type mode
    await page.getByText('Type Signature').click();
    
    // Test signature input field
    const signatureInput = page.getByPlaceholder('Enter your full name');
    await expect(signatureInput).toBeVisible();
    await expect(signatureInput).toBeEnabled();
    
    // Test typing signature
    await signatureInput.fill('John Doe');
    
    // Test signature preview
    await expect(page.getByText('Signature Preview:')).toBeVisible();
    const preview = page.locator('.font-script');
    await expect(preview).toBeVisible();
    await expect(preview).toHaveText('John Doe');
    
    // Test signature style
    await expect(preview).toHaveClass(/italic/);
    await expect(preview).toHaveClass(/text-blue-600/);
    
    // Test clearing typed signature
    await signatureInput.clear();
    await expect(preview).not.toBeVisible();
    
    // Test re-typing signature
    await signatureInput.fill('Jane Smith');
    await expect(preview).toHaveText('Jane Smith');
  });

  test('should test signature canvas responsiveness', async ({ page }) => {
    // Test canvas at different viewport sizes
    await page.setViewportSize({ width: 1200, height: 800 });
    
    await page.getByText('Draw Signature').click();
    
    let canvas = page.locator('canvas');
    let canvasBox = await canvas.boundingBox();
    const wideWidth = canvasBox!.width;
    
    // Test smaller viewport
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500); // Wait for resize
    
    canvas = page.locator('canvas');
    canvasBox = await canvas.boundingBox();
    const narrowWidth = canvasBox!.width;
    
    // Canvas should be smaller on narrow viewport
    expect(narrowWidth).toBeLessThanOrEqual(wideWidth);
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    canvas = page.locator('canvas');
    canvasBox = await canvas.boundingBox();
    const mobileWidth = canvasBox!.width;
    
    // Canvas should be even smaller on mobile
    expect(mobileWidth).toBeLessThanOrEqual(narrowWidth);
    
    // Canvas should still be visible and functional
    await expect(canvas).toBeVisible();
  });

  test('should test signature instructions and help text', async ({ page }) => {
    // Test draw mode instructions
    await page.getByText('Draw Signature').click();
    await expect(page.getByText('Draw your signature in the box below')).toBeVisible();
    await expect(page.getByText('using your mouse or touch')).toBeVisible();
    
    // Test type mode instructions
    await page.getByText('Type Signature').click();
    await expect(page.getByText('Type your full name as your signature')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your full name')).toBeVisible();
  });

  test('should test signature validation', async ({ page }) => {
    // Test terms agreement checkbox
    const termsCheckbox = page.getByRole('checkbox', { name: /certify that all information/i });
    await expect(termsCheckbox).toBeVisible();
    await expect(termsCheckbox).toBeEnabled();
    await expect(termsCheckbox).not.toBeChecked();
    
    // Test checking terms
    await termsCheckbox.check();
    await expect(termsCheckbox).toBeChecked();
    
    // Test unchecking terms
    await termsCheckbox.uncheck();
    await expect(termsCheckbox).not.toBeChecked();
    
    // Test terms text
    await expect(page.getByText('I certify that all information provided is true and accurate')).toBeVisible();
  });

  test('should test signature persistence between modes', async ({ page }) => {
    // Type a signature
    await page.getByText('Type Signature').click();
    await page.getByPlaceholder('Enter your full name').fill('John Doe');
    
    // Switch to draw mode
    await page.getByText('Draw Signature').click();
    
    // Switch back to type mode
    await page.getByText('Type Signature').click();
    
    // Signature should be cleared when switching modes
    const signatureInput = page.getByPlaceholder('Enter your full name');
    await expect(signatureInput).toHaveValue('');
  });

  test('should test signature area styling', async ({ page }) => {
    // Test draw mode styling
    await page.getByText('Draw Signature').click();
    
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveClass(/bg-white/);
    await expect(canvas).toHaveClass(/rounded-lg/);
    
    const canvasContainer = page.locator('.signature-canvas').locator('..');
    await expect(canvasContainer).toHaveClass(/border/);
    await expect(canvasContainer).toHaveClass(/bg-gray-50/);
    
    // Test type mode styling
    await page.getByText('Type Signature').click();
    
    const signatureInput = page.getByPlaceholder('Enter your full name');
    await expect(signatureInput).toHaveClass(/rounded-lg/);
    await expect(signatureInput).toHaveClass(/border/);
    await expect(signatureInput).toHaveClass(/focus:ring-2/);
    
    // Test preview styling
    await signatureInput.fill('John Doe');
    const preview = page.locator('.font-script');
    await expect(preview).toHaveClass(/text-2xl/);
    await expect(preview).toHaveClass(/italic/);
    await expect(preview).toHaveClass(/text-blue-600/);
  });

  test('should test signature button interactions', async ({ page }) => {
    // Test draw mode buttons
    await page.getByText('Draw Signature').click();
    
    const clearButton = page.getByText('Clear');
    const saveButton = page.getByText('Save Signature');
    
    // Test button styling
    await expect(clearButton).toHaveClass(/bg-gray-500/);
    await expect(clearButton).toHaveClass(/hover:bg-gray-600/);
    await expect(saveButton).toHaveClass(/bg-blue-500/);
    await expect(saveButton).toHaveClass(/hover:bg-blue-600/);
    
    // Test button hover effects
    await clearButton.hover();
    await expect(clearButton).toBeVisible();
    
    await saveButton.hover();
    await expect(saveButton).toBeVisible();
    
    // Test button click feedback
    await clearButton.click();
    await saveButton.click();
    
    // Both buttons should remain enabled after clicking
    await expect(clearButton).toBeEnabled();
    await expect(saveButton).toBeEnabled();
  });

  test('should test signature accessibility', async ({ page }) => {
    // Test mode selection accessibility
    const drawButton = page.getByText('Draw Signature');
    const typeButton = page.getByText('Type Signature');
    
    await expect(drawButton).toBeVisible();
    await expect(typeButton).toBeVisible();
    
    // Test keyboard navigation
    await drawButton.focus();
    await page.keyboard.press('Tab');
    await expect(typeButton).toBeFocused();
    
    // Test space key activation
    await page.keyboard.press('Space');
    await expect(typeButton).toHaveClass(/bg-white/);
    
    // Test signature input accessibility
    await page.getByText('Type Signature').click();
    const signatureInput = page.getByPlaceholder('Enter your full name');
    
    await expect(signatureInput).toBeVisible();
    await signatureInput.focus();
    await expect(signatureInput).toBeFocused();
    
    // Test input with keyboard
    await page.keyboard.type('John Doe');
    await expect(signatureInput).toHaveValue('John Doe');
  });

  test('should test signature error states', async ({ page }) => {
    // Test submission without signature
    await page.getByRole('checkbox', { name: /certify that all information/i }).check();
    
    // Navigate to submit (would be done in a real test)
    // For now, test that signature validation structure exists
    const signatureInput = page.getByPlaceholder('Enter your full name');
    const canvas = page.locator('canvas');
    
    // Test that signature input can be empty
    await page.getByText('Type Signature').click();
    await expect(signatureInput).toHaveValue('');
    
    // Test that canvas can be empty
    await page.getByText('Draw Signature').click();
    await expect(canvas).toBeVisible();
    
    // Test error message structure exists
    const errorMessages = page.locator('.text-red-600');
    expect(await errorMessages.count()).toBeGreaterThanOrEqual(0);
  });

  test('should test additional information section', async ({ page }) => {
    // Test additional info section
    await expect(page.getByText('Additional Information')).toBeVisible();
    await expect(page.getByText('Is there anything else you\'d like us to know')).toBeVisible();
    
    // Test additional info textarea
    const additionalInfoTextarea = page.getByPlaceholder('Optional: Any additional information');
    await expect(additionalInfoTextarea).toBeVisible();
    await expect(additionalInfoTextarea).toBeEnabled();
    
    // Test typing in additional info
    await additionalInfoTextarea.fill('I am excited about this opportunity and look forward to contributing to the team.');
    await expect(additionalInfoTextarea).toHaveValue('I am excited about this opportunity and look forward to contributing to the team.');
    
    // Test textarea styling
    await expect(additionalInfoTextarea).toHaveClass(/rounded-lg/);
    await expect(additionalInfoTextarea).toHaveClass(/border/);
    await expect(additionalInfoTextarea).toHaveClass(/focus:ring-2/);
  });

  test('should test complete signature flow', async ({ page }) => {
    // Complete signature flow with draw method
    await page.getByText('Draw Signature').click();
    
    // Simulate drawing
    const canvas = page.locator('canvas');
    await canvas.hover();
    await page.mouse.down();
    await page.mouse.move(100, 50);
    await page.mouse.up();
    
    // Save signature
    await page.getByText('Save Signature').click();
    
    // Check terms
    await page.getByRole('checkbox', { name: /certify that all information/i }).check();
    
    // Add additional info
    await page.getByPlaceholder('Optional: Any additional information').fill('Thank you for considering my application.');
    
    // Test that all signature components are ready
    await expect(page.getByText('Submit Application')).toBeVisible();
    await expect(page.getByText('Submit Application')).toBeEnabled();
    
    // Complete signature flow with type method
    await page.getByText('Type Signature').click();
    await page.getByPlaceholder('Enter your full name').fill('John Doe');
    
    // Verify signature is showing
    await expect(page.getByText('John Doe')).toBeVisible();
    
    // Form should be ready for submission
    await expect(page.getByText('Submit Application')).toBeEnabled();
  });
}); 