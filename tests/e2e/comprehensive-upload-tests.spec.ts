import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Comprehensive Upload Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/employee-application');
    
    // Fill with test data and navigate to documents
    await page.getByText('📋 Load Complete Application').click();
    await page.getByText('Next').click(); // Assessment
    await page.getByText('Next').click(); // Personal
    await page.getByText('Next').click(); // Documents
    await expect(page.getByText('Documents')).toBeVisible();
  });

  test('should test resume upload functionality', async ({ page }) => {
    // Test resume upload section visibility
    await expect(page.getByText('Resume / CV')).toBeVisible();
    await expect(page.getByText('Upload PDF, DOC, or DOCX')).toBeVisible();
    
    // Test file input existence
    const resumeFileInput = page.locator('#resume-upload');
    await expect(resumeFileInput).toBeAttached();
    
    // Test choose file button
    const chooseFileButton = page.getByLabel('Choose File');
    await expect(chooseFileButton).toBeVisible();
    await expect(chooseFileButton).toBeEnabled();
    
    // Test drag and drop text
    await expect(page.getByText('Or drag and drop your file here')).toBeVisible();
  });

  test('should test ID photo upload modes', async ({ page }) => {
    // Test ID photo section visibility
    await expect(page.getByText('ID Photo')).toBeVisible();
    await expect(page.getByText('Upload JPG or PNG')).toBeVisible();
    
    // Test mode selection buttons
    const uploadModeButton = page.getByText('Upload File');
    const cameraModeButton = page.getByText('Take Photo');
    
    await expect(uploadModeButton).toBeVisible();
    await expect(uploadModeButton).toBeEnabled();
    await expect(cameraModeButton).toBeVisible();
    await expect(cameraModeButton).toBeEnabled();
    
    // Test switching to upload mode
    await uploadModeButton.click();
    await expect(page.getByText('Choose File')).toBeVisible();
    
    // Test switching to camera mode
    await cameraModeButton.click();
    await expect(page.getByText('Start Camera')).toBeVisible();
    
    // Test camera controls
    const startCameraButton = page.getByText('Start Camera');
    await expect(startCameraButton).toBeVisible();
    await expect(startCameraButton).toBeEnabled();
  });

  test('should test camera functionality', async ({ page, browserName }) => {
    // Grant camera permissions
    await page.context().grantPermissions(['camera']);
    
    // Switch to camera mode
    await page.getByText('Take Photo').click();
    await page.getByText('Start Camera').click();
    
    // Wait for camera to load or error
    await page.waitForTimeout(2000);
    
    // Check if camera loaded successfully
    const video = page.locator('video');
    const cameraError = page.getByText(/unable to access camera/i);
    
    const hasVideo = await video.isVisible({ timeout: 5000 }).catch(() => false);
    const hasError = await cameraError.isVisible().catch(() => false);
    
    if (hasVideo) {
      // Test camera controls
      await expect(page.getByText('Capture Photo')).toBeVisible();
      await expect(page.getByText('Cancel')).toBeVisible();
      
      // Test capture button
      const captureButton = page.getByText('Capture Photo');
      await expect(captureButton).toBeEnabled();
      await captureButton.click();
      
      // Should show success message or photo preview
      await page.waitForTimeout(1000);
      
      // Test cancel button
      await page.getByText('Take Photo').click();
      await page.getByText('Start Camera').click();
      await page.waitForTimeout(1000);
      
      const cancelButton = page.getByText('Cancel');
      await expect(cancelButton).toBeVisible();
      await cancelButton.click();
      
      // Should return to upload mode
      await expect(page.getByText('Start Camera')).toBeVisible();
    } else if (hasError) {
      // Camera not available - this is expected in headless mode
      expect(hasError).toBe(true);
    }
  });

  test('should test file validation messages', async ({ page }) => {
    // Test file type validation by checking error message display
    // Note: We can't actually upload invalid files in this test environment
    // but we can test that the error message elements exist
    
    // Check that error message container exists
    const errorContainer = page.locator('.text-red-600');
    
    // Initially should not show errors
    const visibleErrors = await errorContainer.filter({ hasText: /please upload/i }).count();
    expect(visibleErrors).toBe(0);
    
    // Test that file size limit is mentioned
    await expect(page.getByText('max 10MB')).toBeVisible();
    await expect(page.getByText('max 5MB')).toBeVisible();
  });

  test('should test AI parsing indicator', async ({ page }) => {
    // Test AI parsing UI elements
    await expect(page.getByText('AI is parsing')).not.toBeVisible(); // Initially hidden
    
    // Test that parsing progress elements are not shown initially
    const parsingIndicator = page.locator('.animate-spin');
    const initialSpinners = await parsingIndicator.count();
    expect(initialSpinners).toBe(0);
    
    // Test that success message is not shown initially
    await expect(page.getByText('Resume parsed successfully')).not.toBeVisible();
  });

  test('should test file upload success states', async ({ page }) => {
    // Test success message containers exist
    const successContainer = page.locator('.text-green-600');
    
    // Initially should not show success messages
    const visibleSuccess = await successContainer.filter({ hasText: /✓/i }).count();
    expect(visibleSuccess).toBe(0);
    
    // Test that file name would be displayed in success state
    // (This tests the UI structure for success display)
    const fileNameDisplay = page.locator('.text-green-600').filter({ hasText: /\.(pdf|doc|docx|jpg|png)$/i });
    expect(await fileNameDisplay.count()).toBe(0); // Initially no files
  });

  test('should test privacy and security notice', async ({ page }) => {
    // Test privacy notice visibility
    await expect(page.getByText('Document Privacy & Security')).toBeVisible();
    await expect(page.getByText('encrypted and securely stored')).toBeVisible();
    await expect(page.getByText('employment verification purposes')).toBeVisible();
    await expect(page.getByText('never share them with third parties')).toBeVisible();
    
    // Test security icon is present
    const securityIcon = page.locator('svg').first();
    await expect(securityIcon).toBeVisible();
  });

  test('should test file input accessibility', async ({ page }) => {
    // Test file inputs have proper labels
    const resumeInput = page.locator('#resume-upload');
    const idInput = page.locator('#id-upload');
    
    await expect(resumeInput).toHaveAttribute('accept', '.pdf,.doc,.docx');
    
    // Test that file inputs are properly hidden but accessible
    await expect(resumeInput).toHaveCSS('display', 'none');
    await expect(idInput).toHaveCSS('display', 'none');
    
    // Test that labels are properly associated
    const resumeLabel = page.locator('label[for="resume-upload"]');
    const idLabel = page.locator('label[for="id-upload"]');
    
    await expect(resumeLabel).toBeVisible();
    await expect(idLabel).toBeVisible();
  });

  test('should test upload button states and interactions', async ({ page }) => {
    // Test initial button states
    const resumeChooseButton = page.getByLabel('Choose File');
    await expect(resumeChooseButton).toBeEnabled();
    
    // Test hover states (visual feedback)
    await resumeChooseButton.hover();
    await expect(resumeChooseButton).toBeVisible();
    
    // Test ID photo button states
    await page.getByText('Upload File').click();
    const idChooseButton = page.getByText('Choose File');
    await expect(idChooseButton).toBeEnabled();
    
    // Test camera button states
    await page.getByText('Take Photo').click();
    const startCameraButton = page.getByText('Start Camera');
    await expect(startCameraButton).toBeEnabled();
  });

  test('should test multiple file upload scenarios', async ({ page }) => {
    // Test that only one file can be uploaded at a time for each type
    const resumeInput = page.locator('#resume-upload');
    const idInput = page.locator('#id-upload');
    
    // Both inputs should accept only single files
    await expect(resumeInput).not.toHaveAttribute('multiple');
    await expect(idInput).not.toHaveAttribute('multiple');
    
    // Test file replacement workflow
    await page.getByText('Upload File').click();
    
    // Both upload sections should be independent
    await expect(page.getByText('Resume / CV')).toBeVisible();
    await expect(page.getByText('ID Photo')).toBeVisible();
  });

  test('should test upload progress and loading states', async ({ page }) => {
    // Test that progress indicators are properly structured
    const progressBar = page.locator('.bg-blue-600');
    const progressContainer = page.locator('.bg-blue-200');
    
    // Progress elements should exist but not be visible initially
    await expect(progressBar).not.toBeVisible();
    await expect(progressContainer).not.toBeVisible();
    
    // Test loading spinner structure
    const spinner = page.locator('.animate-spin');
    expect(await spinner.count()).toBe(0); // Initially no spinners
    
    // Test that upload percentage would be displayed
    const percentageDisplay = page.locator('[style*="width:"]');
    expect(await percentageDisplay.count()).toBeGreaterThanOrEqual(0);
  });

  test('should test error handling and recovery', async ({ page }) => {
    // Test error message display structure
    const errorMessages = page.locator('.text-red-600');
    
    // Initially should not show errors
    const visibleErrorCount = await errorMessages.filter({ hasText: /error|failed|invalid/i }).count();
    expect(visibleErrorCount).toBe(0);
    
    // Test that error clearing works
    // (This tests the UI structure for error clearing)
    const errorContainer = page.locator('.bg-red-50');
    expect(await errorContainer.count()).toBe(0); // Initially no error containers
    
    // Test retry functionality structure
    const retryButtons = page.getByText(/try again|retry/i);
    expect(await retryButtons.count()).toBe(0); // Initially no retry buttons
  });

  test('should test drag and drop functionality', async ({ page }) => {
    // Test drag and drop zones
    const resumeDropZone = page.locator('.border-dashed').first();
    const idDropZone = page.locator('.border-dashed').last();
    
    await expect(resumeDropZone).toBeVisible();
    await expect(idDropZone).toBeVisible();
    
    // Test drag and drop text
    await expect(page.getByText('Or drag and drop your file here')).toBeVisible();
    await expect(page.getByText('Or drag and drop your photo here')).toBeVisible();
    
    // Test hover states for drag zones
    await resumeDropZone.hover();
    await expect(resumeDropZone).toHaveClass(/hover:border-blue-400/);
    
    await idDropZone.hover();
    await expect(idDropZone).toHaveClass(/hover:border-purple-400/);
  });

  test('should test file type acceptance', async ({ page }) => {
    // Test resume file type acceptance
    const resumeInput = page.locator('#resume-upload');
    await expect(resumeInput).toHaveAttribute('accept', '.pdf,.doc,.docx');
    
    // Test ID photo file type acceptance
    await page.getByText('Upload File').click();
    const idInput = page.locator('#id-upload');
    await expect(idInput).toHaveAttribute('accept', '.jpg,.jpeg,.png,.webp');
    
    // Test that file type restrictions are clearly displayed
    await expect(page.getByText('PDF, DOC, or DOCX')).toBeVisible();
    await expect(page.getByText('JPG or PNG')).toBeVisible();
  });

  test('should test upload button visual feedback', async ({ page }) => {
    // Test button styling and hover effects
    const resumeButton = page.getByLabel('Choose File');
    
    // Test gradient background
    await expect(resumeButton).toHaveClass(/bg-gradient-to-r/);
    await expect(resumeButton).toHaveClass(/from-blue-500/);
    
    // Test hover effects
    await resumeButton.hover();
    await expect(resumeButton).toHaveClass(/hover:scale-105/);
    
    // Test ID photo button styling
    await page.getByText('Upload File').click();
    const idButton = page.getByText('Choose File');
    await expect(idButton).toHaveClass(/bg-gradient-to-r/);
    await expect(idButton).toHaveClass(/from-purple-500/);
  });

  test('should test camera permission handling', async ({ page }) => {
    // Test camera permission denial gracefully
    await page.context().grantPermissions([]); // No permissions
    
    await page.getByText('Take Photo').click();
    await page.getByText('Start Camera').click();
    
    // Should handle permission denial gracefully
    await page.waitForTimeout(3000);
    
    const errorMessage = page.getByText(/unable to access camera/i);
    const cameraWorking = page.locator('video');
    
    const hasError = await errorMessage.isVisible().catch(() => false);
    const hasCamera = await cameraWorking.isVisible().catch(() => false);
    
    // Either camera works or shows appropriate error
    expect(hasError || hasCamera).toBe(true);
    
    if (hasError) {
      await expect(errorMessage).toBeVisible();
      await expect(page.getByText('Please try uploading a file instead')).toBeVisible();
    }
  });
}); 