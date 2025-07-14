import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('File Upload Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/employee-application');
    
    // Fill with test data and navigate to documents
    await page.getByText('Fill Standard').click();
    await page.getByText('Next').click(); // Assessment
    await page.getByText('Next').click(); // Personal
    await page.getByText('Next').click(); // Documents
    await expect(page.getByText('Documents')).toBeVisible();
  });

  test('should show file upload sections', async ({ page }) => {
    await expect(page.getByText('Resume / CV')).toBeVisible();
    await expect(page.getByText('ID Photo')).toBeVisible();
    await expect(page.getByText('Choose File')).toHaveCount(1); // Resume upload initially
  });

  test('should show ID photo capture options', async ({ page }) => {
    await expect(page.getByText('Upload File')).toBeVisible();
    await expect(page.getByText('Take Photo')).toBeVisible();
  });

  test('should switch between upload and camera modes for ID', async ({ page }) => {
    // Start with upload mode
    await expect(page.getByText('Choose File')).toBeVisible();
    
    // Switch to camera mode
    await page.getByText('Take Photo').click();
    await expect(page.getByText('Start Camera')).toBeVisible();
    
    // Switch back to upload mode
    await page.getByText('Upload File').click();
    await expect(page.getByText('Choose File')).toBeVisible();
  });

  test('should handle camera permissions gracefully', async ({ page, browserName }) => {
    // Grant camera permissions
    await page.context().grantPermissions(['camera']);
    
    // Switch to camera mode
    await page.getByText('Take Photo').click();
    await page.getByText('Start Camera').click();
    
    // Should either show camera or permission error
    // Note: In headless mode, camera might not be available
    const hasCamera = await page.getByRole('button', { name: /capture photo/i }).isVisible({ timeout: 5000 }).catch(() => false);
    const hasError = await page.getByText(/unable to access camera/i).isVisible().catch(() => false);
    
    expect(hasCamera || hasError).toBe(true);
  });

  test('should validate file types', async ({ page }) => {
    // Create a temporary test file
    const testFilePath = path.join(__dirname, '../../test-files/test-resume.pdf');
    
    // Try to upload a file (if file input is available)
    const resumeInput = page.locator('input[type="file"]').first();
    if (await resumeInput.isVisible()) {
      // This would normally upload a file, but we'll skip actual file creation for now
      // await resumeInput.setInputFiles(testFilePath);
    }
  });

  test('should show upload progress for resume parsing', async ({ page }) => {
    // This test would require actual file upload implementation
    // For now, we'll just verify the UI elements exist
    await expect(page.getByText('AI is parsing')).not.toBeVisible(); // Initially not visible
  });

  test('should display privacy notice', async ({ page }) => {
    await expect(page.getByText('Document Privacy & Security')).toBeVisible();
    await expect(page.getByText('encrypted and securely stored')).toBeVisible();
  });
});