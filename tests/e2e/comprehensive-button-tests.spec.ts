import { test, expect } from '@playwright/test';

test.describe('Comprehensive Button Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/employee-application', { timeout: 60000 });
  });

  test('should test all navigation buttons', async ({ page }) => {
    // Fill with test data to enable all navigation
    await page.getByText('📋 Load Complete Application').click();
    await expect(page.getByText('✅ Test data loaded!')).toBeVisible();
    
    // Wait for form to be fully populated and auto-navigate to signature step
    await page.waitForTimeout(2000);

    // We should be on the signature step now (auto-navigated)
    await expect(page.getByText('Signature')).toBeVisible();
    
    // Test Previous button navigation
    const prevButton = page.getByRole('button', { name: /previous/i });
    await expect(prevButton).toBeVisible();
    await expect(prevButton).toBeEnabled();
    await prevButton.click();
    
    // Should be on Review step
    await expect(page.getByText('Review')).toBeVisible();
    
    // Test Next button to go back to signature
    const nextButton = page.getByRole('button', { name: /next/i });
    await expect(nextButton).toBeVisible();
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    
    // Should be back on signature step
    await expect(page.getByRole('heading', { name: 'Digital Signature' })).toBeVisible();
    
    // Test navigation to middle step using step buttons
    await page.getByText('👤').click(); // Click Personal step button
    await expect(page.getByText('Personal')).toBeVisible();
    
    // Test navigation back to signature using step buttons
    await page.getByText('✍️').click(); // Click Signature step button
    await expect(page.getByRole('heading', { name: 'Digital Signature' })).toBeVisible();
  });

  test('should test all test data population buttons', async ({ page }) => {
    // Test Standard test data button
    const fillStandardButton = page.getByText('📋 Load Complete Application');
    await expect(fillStandardButton).toBeVisible();
    await expect(fillStandardButton).toBeEnabled();
    await fillStandardButton.click();
    
    await expect(page.getByText('✅ Test data loaded!')).toBeVisible();
    
    // Wait for form to be fully populated and auto-navigate to signature step
    await page.waitForTimeout(2000);
    
    // Verify we're on the signature step (the test data function auto-navigates there)
    await expect(page.getByRole('heading', { name: 'Digital Signature' })).toBeVisible();
    
    // Navigate back to personal info to verify data was populated
    await page.getByText('👤').click(); // Click Personal step button
    await expect(page.locator('input[name="personalInfo.firstName"]')).toHaveValue('John');
    await expect(page.locator('input[name="personalInfo.lastName"]')).toHaveValue('Doe');
    
    // Go back to test other buttons
    await page.reload();
    
    // Test Entry Level button
    const fillEntryButton = page.getByText('🌱 Load Entry Level Profile');
    await expect(fillEntryButton).toBeVisible();
    await expect(fillEntryButton).toBeEnabled();
    await fillEntryButton.click();
    
    await expect(page.getByText('✅ Test data loaded!')).toBeVisible();
    
    // Go back to test Experienced button
    await page.reload();
    
    // Test Experienced button
    const fillExperiencedButton = page.getByText('🚀 Load Experienced Profile');
    await expect(fillExperiencedButton).toBeVisible();
    await expect(fillExperiencedButton).toBeEnabled();
    await fillExperiencedButton.click();
    
    await expect(page.getByText('✅ Test data loaded!')).toBeVisible();
  });

  test('should test step navigation buttons', async ({ page }) => {
    // Fill with test data to enable step navigation
    await page.getByText('📋 Load Complete Application').click();
    
    // Wait for auto-navigation to signature step
    await page.waitForTimeout(2000);
    
    // Test direct step navigation buttons - all should be enabled after loading test data
    const stepButtons = [
      { icon: '💼', text: 'Job' },
      { icon: '📝', text: 'Test' },
      { icon: '👤', text: 'Info' },
      { icon: '📄', text: 'Files' },
      { icon: '🏢', text: 'Work' },
      { icon: '🎓', text: 'School' },
      { icon: '👥', text: 'Refs' },
      { icon: '🔍', text: 'Check' },
      { icon: '✍️', text: 'Sign' }
    ];

    for (let i = 0; i < stepButtons.length; i++) {
      const stepButton = page.getByRole('button', { name: new RegExp(stepButtons[i].text, 'i') });
      await expect(stepButton).toBeVisible();
      await expect(stepButton).toBeEnabled(); // All steps should be enabled with test data
      await stepButton.click();
      await page.waitForTimeout(500); // Wait for navigation
    }
  });

  test('should test work experience buttons', async ({ page }) => {
    // Navigate to work experience step
    await page.getByText('📋 Load Complete Application').click();
    
    // Wait for auto-navigation to signature step
    await page.waitForTimeout(2000);
    
    // Navigate to experience step using step button
    await page.getByText('🏢').click();
    await expect(page.getByText('Experience')).toBeVisible();
    
    // Test "Add Another Position" button
    const addPositionButton = page.getByText('+ Add Another Position');
    await expect(addPositionButton).toBeVisible();
    await expect(addPositionButton).toBeEnabled();
    await addPositionButton.click();
    
    // Should see additional position form
    await expect(page.getByText('Position 2')).toBeVisible();
    
    // Test remove button
    const removeButton = page.getByText('Remove').first();
    await expect(removeButton).toBeVisible();
    await expect(removeButton).toBeEnabled();
    await removeButton.click();
    
    // Should only have one position left
    await expect(page.getByText('Position 2')).not.toBeVisible();
  });

  test('should test education buttons', async ({ page }) => {
    // Navigate to education step
    await page.getByText('📋 Load Complete Application').click();
    
    // Wait for auto-navigation to signature step
    await page.waitForTimeout(2000);
    
    // Navigate to education step using step button
    await page.getByText('🎓').click();
    await expect(page.getByText('Education')).toBeVisible();
    
    // Test "Add Another Education" button
    const addEducationButton = page.getByText('+ Add Another Education');
    await expect(addEducationButton).toBeVisible();
    await expect(addEducationButton).toBeEnabled();
    await addEducationButton.click();
    
    // Should see additional education form
    await expect(page.getByText('Education 2')).toBeVisible();
    
    // Test remove button
    const removeButton = page.getByText('Remove').first();
    await expect(removeButton).toBeVisible();
    await expect(removeButton).toBeEnabled();
    await removeButton.click();
    
    // Should only have one education left
    await expect(page.getByText('Education 2')).not.toBeVisible();
  });

  test('should test reference buttons', async ({ page }) => {
    // Navigate to references step
    await page.getByText('📋 Load Complete Application').click();
    
    // Wait for auto-navigation to signature step
    await page.waitForTimeout(2000);
    
    // Navigate to references step using step button
    await page.getByText('👥').click();
    await expect(page.getByText('References')).toBeVisible();
    
    // Test "Add Another Reference" button
    const addReferenceButton = page.getByText('+ Add Another Reference');
    await expect(addReferenceButton).toBeVisible();
    await expect(addReferenceButton).toBeEnabled();
    await addReferenceButton.click();
    
    // Should see additional reference form
    await expect(page.getByText('Reference 3')).toBeVisible();
    
    // Test remove button
    const removeButton = page.getByText('Remove').first();
    await expect(removeButton).toBeVisible();
    await expect(removeButton).toBeEnabled();
    await removeButton.click();
    
    // Should have one less reference
    await expect(page.getByText('Reference 3')).not.toBeVisible();
  });

  test('should test signature method buttons', async ({ page }) => {
    // Navigate to signature step
    await page.getByText('📋 Load Complete Application').click();
    
    // Wait for auto-navigation to signature step
    await page.waitForTimeout(2000);
    
    // We should already be on the signature step
    await expect(page.getByRole('heading', { name: 'Digital Signature' })).toBeVisible();
    
    // Test Draw Signature button
    const drawButton = page.getByText('Draw Signature');
    await expect(drawButton).toBeVisible();
    await expect(drawButton).toBeEnabled();
    await drawButton.click();
    
    // Should see signature canvas
    await expect(page.locator('canvas')).toBeVisible();
    
    // Test Clear button
    const clearButton = page.getByText('Clear');
    await expect(clearButton).toBeVisible();
    await expect(clearButton).toBeEnabled();
    await clearButton.click();
    
    // Test Save Signature button
    const saveButton = page.getByText('Save Signature');
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    
    // Test Type Signature button
    const typeButton = page.getByText('Type Signature');
    await expect(typeButton).toBeVisible();
    await expect(typeButton).toBeEnabled();
    await typeButton.click();
    
    // Should see type signature input
    await expect(page.getByPlaceholder('Enter your full name')).toBeVisible();
  });

  test('should test file upload mode buttons', async ({ page }) => {
    // Navigate to documents step
    await page.getByText('📋 Load Complete Application').click();
    
    // Wait for auto-navigation to signature step
    await page.waitForTimeout(2000);
    
    // Navigate to documents step using step button
    await page.getByText('📄').click();
    await expect(page.getByText('Documents')).toBeVisible();
    
    // Test ID photo upload mode buttons
    const uploadFileButton = page.getByText('Upload File');
    await expect(uploadFileButton).toBeVisible();
    await expect(uploadFileButton).toBeEnabled();
    await uploadFileButton.click();
    
    // Should see file upload interface
    await expect(page.getByText('Choose File')).toBeVisible();
    
    // Test Take Photo button
    const takePhotoButton = page.getByText('Take Photo');
    await expect(takePhotoButton).toBeVisible();
    await expect(takePhotoButton).toBeEnabled();
    await takePhotoButton.click();
    
    // Should see camera interface
    await expect(page.getByText('Start Camera')).toBeVisible();
    
    // Test Start Camera button
    const startCameraButton = page.getByText('Start Camera');
    await expect(startCameraButton).toBeVisible();
    await expect(startCameraButton).toBeEnabled();
    
    // Note: Actual camera test would require permissions and might not work in headless mode
    // We'll just verify the button is functional
  });

  test('should test submit button states', async ({ page }) => {
    // Navigate to final step
    await page.getByText('📋 Load Complete Application').click();
    
    // Wait for auto-navigation to signature step
    await page.waitForTimeout(2000);
    
    // We should already be on the signature step
    await expect(page.getByRole('heading', { name: 'Digital Signature' })).toBeVisible();
    
    // Add signature
    await page.getByText('Type Signature').click();
    await page.getByPlaceholder('Enter your full name').fill('John Doe');
    
    // Check terms
    await page.getByRole('checkbox', { name: /certify that all information/i }).check();
    
    // Test Submit Application button
    const submitButton = page.getByText('Submit Application');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    
    // Click submit (this will attempt submission)
    await submitButton.click();
    
    // Should either show loading state or error/success
    await expect(
      page.getByText('Submitting') || 
      page.getByText('Error') || 
      page.getByText('Success')
    ).toBeVisible({ timeout: 10000 });
  });

  test('should test button disabled states', async ({ page }) => {
    // Test Previous button disabled on first step
    const prevButton = page.getByRole('button', { name: /previous/i });
    await expect(prevButton).toBeDisabled();
    
    // Test Next button behavior without filling form
    const nextButton = page.getByRole('button', { name: /next/i });
    await expect(nextButton).toBeVisible();
    // Next button should be enabled but form validation should prevent progression
    
    // Test step navigation buttons disabled for unvisited steps
    const stepButtons = page.locator('button[disabled]');
    const disabledCount = await stepButtons.count();
    expect(disabledCount).toBeGreaterThan(0); // Some steps should be disabled initially
  });

  test('should test all checkbox buttons', async ({ page }) => {
    // Navigate to personal info step
    await page.getByText('📋 Load Complete Application').click();
    
    // Wait for auto-navigation to signature step
    await page.waitForTimeout(2000);
    
    // Navigate to personal step using step button
    await page.getByText('👤').click();
    await expect(page.getByText('Personal')).toBeVisible();
    
    // Test driver's license checkbox
    const driverLicenseCheckbox = page.getByRole('checkbox', { name: /driver's license/i });
    await expect(driverLicenseCheckbox).toBeVisible();
    await expect(driverLicenseCheckbox).toBeEnabled();
    
    // Test conviction checkbox
    const convictionCheckbox = page.getByRole('checkbox', { name: /convicted of a felony/i });
    await expect(convictionCheckbox).toBeVisible();
    await expect(convictionCheckbox).toBeEnabled();
    await convictionCheckbox.check();
    
    // Should show additional text area
    await expect(page.getByPlaceholder('Please provide details...')).toBeVisible();
    
    // Uncheck to hide
    await convictionCheckbox.uncheck();
    await expect(page.getByPlaceholder('Please provide details...')).not.toBeVisible();
    
    // Test previous work checkbox
    const previousWorkCheckbox = page.getByRole('checkbox', { name: /previously worked for Alliance/i });
    await expect(previousWorkCheckbox).toBeVisible();
    await expect(previousWorkCheckbox).toBeEnabled();
    
    // Test all consent checkboxes
    const consentCheckboxes = [
      /eligible to work/i,
      /background check/i,
      /drug testing/i,
      /reference verification/i,
      /employment history/i
    ];
    
    for (const checkboxName of consentCheckboxes) {
      const checkbox = page.getByRole('checkbox', { name: checkboxName });
      await expect(checkbox).toBeVisible();
      await expect(checkbox).toBeEnabled();
      await checkbox.check();
      await expect(checkbox).toBeChecked();
    }
  });
}); 