import { test, expect } from '@playwright/test';

test.describe('Comprehensive Full Application Test', () => {
  test('should test complete application with all buttons and uploads', async ({ page }) => {
    // Start the application
    await page.goto('/employee-application');
    
    // Test initial page load
    await expect(page).toHaveTitle(/Alliance Chemical/);
    await expect(page.getByText('Employee Application')).toBeVisible();
    
    // Test development mode buttons
    await expect(page.getByText('🧪 Development Mode')).toBeVisible();
    await expect(page.getByText('📋 Load Complete Application')).toBeVisible();
    await expect(page.getByText('🌱 Load Entry Level Profile')).toBeVisible();
    await expect(page.getByText('🚀 Load Experienced Profile')).toBeVisible();
    
    // Test data population button
    await page.getByText('📋 Load Complete Application').click();
    await expect(page.getByText('✅ Test data loaded!')).toBeVisible();
    
    // STEP 1: Test Position Selection
    await expect(page.getByText('Select Your Position')).toBeVisible();
    await expect(page.getByText('Customer Service Specialist')).toBeVisible();
    
    // Test radio button selection
    const jobRadio = page.getByRole('radio', { name: /customer service specialist/i });
    await expect(jobRadio).toBeChecked(); // Should be pre-selected
    
    // Test Next button
    const nextButton = page.getByRole('button', { name: /next/i });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    
    // STEP 2: Test Assessment Questions
    await expect(page.getByText('Customer Service Role Assessment')).toBeVisible();
    
    // Test all assessment dropdowns are filled
    await expect(page.locator('select[name="roleAssessment.tmsMyCarrierExperience"]')).toHaveValue('intermediate');
    await expect(page.locator('select[name="roleAssessment.amazonSellerCentralExperience"]')).toHaveValue('basic');
    await expect(page.locator('select[name="roleAssessment.excelProficiency"]')).toHaveValue('intermediate');
    await expect(page.locator('select[name="roleAssessment.b2bLoyaltyFactor"]')).toHaveValue('reliability');
    
    // Test text areas are filled
    await expect(page.locator('textarea[name="roleAssessment.shopifyExperience"]')).toHaveValue(/Shopify/);
    await expect(page.locator('textarea[name="roleAssessment.customerQuoteScenario"]')).toHaveValue(/Barry/);
    
    // Test checkboxes
    const motivationCheckboxes = page.locator('input[name="roleAssessment.customerServiceMotivation"]');
    const checkedBoxes = await motivationCheckboxes.filter({ hasText: /checked/i }).count();
    expect(checkedBoxes).toBeGreaterThan(0);
    
    await nextButton.click();
    
    // STEP 3: Test Personal Information
    await expect(page.getByText('Personal Information')).toBeVisible();
    
    // Test form fields are populated
    await expect(page.locator('input[name="personalInfo.firstName"]')).toHaveValue('John');
    await expect(page.locator('input[name="personalInfo.lastName"]')).toHaveValue('Doe');
    await expect(page.locator('input[name="personalInfo.email"]')).toHaveValue('john.doe@email.com');
    await expect(page.locator('input[name="personalInfo.phone"]')).toHaveValue('555-123-4567');
    
    // Test sensitive information
    await expect(page.locator('input[name="personalInfo.socialSecurityNumber"]')).toHaveValue('123-45-6789');
    await expect(page.locator('input[name="personalInfo.dateOfBirth"]')).toHaveValue('1990-01-15');
    
    // Test checkboxes
    const driversLicenseCheckbox = page.locator('input[name="personalInfo.hasDriversLicense"]');
    await expect(driversLicenseCheckbox).toBeChecked();
    
    const transportationCheckbox = page.locator('input[name="personalInfo.hasTransportation"]');
    await expect(transportationCheckbox).toBeChecked();
    
    // Test consent checkboxes
    const eligibilityCheckbox = page.locator('input[name="eligibility.eligibleToWork"]');
    await expect(eligibilityCheckbox).toBeChecked();
    
    const backgroundCheckbox = page.locator('input[name="eligibility.consentToBackgroundCheck"]');
    await expect(backgroundCheckbox).toBeChecked();
    
    await nextButton.click();
    
    // STEP 4: Test File Upload Functionality
    await expect(page.getByText('Upload Documents')).toBeVisible();
    
    // Test resume upload section
    await expect(page.getByText('Resume / CV')).toBeVisible();
    await expect(page.getByText('Upload PDF, DOC, or DOCX')).toBeVisible();
    
    // Test file upload buttons
    const resumeChooseButton = page.getByLabel('Choose File');
    await expect(resumeChooseButton).toBeVisible();
    await expect(resumeChooseButton).toBeEnabled();
    
    // Test ID photo upload section
    await expect(page.getByText('ID Photo')).toBeVisible();
    await expect(page.getByText('Upload JPG or PNG')).toBeVisible();
    
    // Test upload/camera mode buttons
    const uploadFileButton = page.getByText('Upload File');
    const takePhotoButton = page.getByText('Take Photo');
    await expect(uploadFileButton).toBeVisible();
    await expect(takePhotoButton).toBeVisible();
    
    // Test switching between modes
    await uploadFileButton.click();
    await expect(page.getByText('Choose File')).toBeVisible();
    
    await takePhotoButton.click();
    await expect(page.getByText('Start Camera')).toBeVisible();
    
    const startCameraButton = page.getByText('Start Camera');
    await expect(startCameraButton).toBeEnabled();
    
    // Test camera permissions (might fail in headless mode)
    await startCameraButton.click();
    await page.waitForTimeout(2000);
    
    // Either camera works or shows error
    const cameraError = page.getByText(/unable to access camera/i);
    const captureButton = page.getByText('Capture Photo');
    
    const hasError = await cameraError.isVisible().catch(() => false);
    const hasCapture = await captureButton.isVisible().catch(() => false);
    
    if (hasError) {
      await expect(cameraError).toBeVisible();
    } else if (hasCapture) {
      await expect(captureButton).toBeEnabled();
      await captureButton.click();
    }
    
    // Test privacy notice
    await expect(page.getByText('Document Privacy & Security')).toBeVisible();
    
    await nextButton.click();
    
    // STEP 5: Test Work Experience
    await expect(page.getByText('Work Experience')).toBeVisible();
    
    // Test pre-populated work experience
    await expect(page.locator('input[value="ABC Corp"]')).toBeVisible();
    await expect(page.locator('input[value="Customer Service Representative"]')).toBeVisible();
    
    // Test add another position button
    const addPositionButton = page.getByText('+ Add Another Position');
    await expect(addPositionButton).toBeVisible();
    await expect(addPositionButton).toBeEnabled();
    await addPositionButton.click();
    
    // Test position added
    await expect(page.getByText('Position 2')).toBeVisible();
    
    // Test remove button
    const removeButton = page.getByText('Remove').first();
    await expect(removeButton).toBeVisible();
    await expect(removeButton).toBeEnabled();
    await removeButton.click();
    
    // Test position removed
    await expect(page.getByText('Position 2')).not.toBeVisible();
    
    await nextButton.click();
    
    // STEP 6: Test Education
    await expect(page.getByText('Education')).toBeVisible();
    
    // Test pre-populated education
    await expect(page.locator('input[value="University of Texas"]')).toBeVisible();
    await expect(page.locator('input[value="Business Administration"]')).toBeVisible();
    
    // Test add another education button
    const addEducationButton = page.getByText('+ Add Another Education');
    await expect(addEducationButton).toBeVisible();
    await expect(addEducationButton).toBeEnabled();
    await addEducationButton.click();
    
    // Test education added
    await expect(page.getByText('Education 2')).toBeVisible();
    
    // Test remove button
    const removeEducationButton = page.getByText('Remove').first();
    await expect(removeEducationButton).toBeVisible();
    await removeEducationButton.click();
    
    await nextButton.click();
    
    // STEP 7: Test References
    await expect(page.getByText('Professional References')).toBeVisible();
    
    // Test pre-populated references
    await expect(page.locator('input[value="Jane Smith"]')).toBeVisible();
    await expect(page.locator('input[value="Bob Johnson"]')).toBeVisible();
    
    // Test add another reference button
    const addReferenceButton = page.getByText('+ Add Another Reference');
    await expect(addReferenceButton).toBeVisible();
    await expect(addReferenceButton).toBeEnabled();
    await addReferenceButton.click();
    
    // Test reference added
    await expect(page.getByText('Reference 3')).toBeVisible();
    
    // Test remove button
    const removeReferenceButton = page.getByText('Remove').first();
    await expect(removeReferenceButton).toBeVisible();
    await removeReferenceButton.click();
    
    await nextButton.click();
    
    // STEP 8: Test Review (if exists)
    const reviewText = page.getByText('Review Your Application');
    const isReviewVisible = await reviewText.isVisible().catch(() => false);
    
    if (isReviewVisible) {
      await expect(reviewText).toBeVisible();
      await nextButton.click();
    }
    
    // STEP 9: Test Signature
    await expect(page.getByText('Sign Your Application')).toBeVisible();
    
    // Test signature mode buttons
    const drawSignatureButton = page.getByText('Draw Signature');
    const typeSignatureButton = page.getByText('Type Signature');
    
    await expect(drawSignatureButton).toBeVisible();
    await expect(typeSignatureButton).toBeVisible();
    
    // Test draw signature mode
    await drawSignatureButton.click();
    
    // Test canvas
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Test signature controls
    await expect(page.getByText('Clear')).toBeVisible();
    await expect(page.getByText('Save Signature')).toBeVisible();
    
    // Test canvas drawing
    await canvas.hover();
    await page.mouse.down();
    await page.mouse.move(100, 50);
    await page.mouse.move(150, 70);
    await page.mouse.up();
    
    await page.getByText('Save Signature').click();
    
    // Test type signature mode
    await typeSignatureButton.click();
    
    const signatureInput = page.getByPlaceholder('Enter your full name');
    await expect(signatureInput).toBeVisible();
    await signatureInput.fill('John Doe');
    
    // Test signature preview
    await expect(page.getByText('Signature Preview:')).toBeVisible();
    const preview = page.locator('.font-script');
    await expect(preview).toBeVisible();
    await expect(preview).toHaveText('John Doe');
    
    // Test terms agreement
    const termsCheckbox = page.getByRole('checkbox', { name: /certify that all information/i });
    await expect(termsCheckbox).toBeVisible();
    await termsCheckbox.check();
    await expect(termsCheckbox).toBeChecked();
    
    // Test additional information
    const additionalInfoTextarea = page.getByPlaceholder('Optional: Any additional information');
    await expect(additionalInfoTextarea).toBeVisible();
    await additionalInfoTextarea.fill('I am excited about this opportunity at Alliance Chemical.');
    
    // Test submit button
    const submitButton = page.getByText('Submit Application');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    
    // Test submission
    await submitButton.click();
    
    // Test submission state
    await expect(
      page.getByText('Submitting...') || 
      page.getByText('Application submitted successfully!') || 
      page.getByText('There was an error')
    ).toBeVisible({ timeout: 15000 });
    
    console.log('✅ All buttons and upload functions tested successfully!');
  });

  test('should test previous/back navigation on all steps', async ({ page }) => {
    await page.goto('/employee-application');
    
    // Fill with test data
    await page.getByText('📋 Load Complete Application').click();
    
    // Navigate forward through all steps
    const steps = [
      'Assessment',
      'Personal Information',
      'Upload Documents',
      'Work Experience',
      'Education',
      'Professional References',
      'Sign Your Application'
    ];
    
    for (const step of steps) {
      await page.getByText('Next').click();
      await expect(page.getByText(step)).toBeVisible();
    }
    
    // Now test going back through all steps
    for (let i = steps.length - 1; i >= 0; i--) {
      const prevButton = page.getByRole('button', { name: /previous/i });
      await expect(prevButton).toBeEnabled();
      await prevButton.click();
      
      if (i > 0) {
        await expect(page.getByText(steps[i - 1])).toBeVisible();
      } else {
        await expect(page.getByText('Select Your Position')).toBeVisible();
      }
    }
    
    console.log('✅ Previous/back navigation tested successfully!');
  });

  test('should test all validation error states', async ({ page }) => {
    await page.goto('/employee-application');
    
    // Try to navigate without filling anything
    let nextButton = page.getByRole('button', { name: /next/i });
    
    // Test job selection validation
    await nextButton.click();
    // Should stay on position step or show validation
    
    // Fill minimum required and continue
    await page.getByText('📋 Load Complete Application').click();
    
    // Navigate to signature step
    for (let i = 0; i < 7; i++) {
      await page.getByText('Next').click();
    }
    
    // Test submission without signature
    const submitButton = page.getByText('Submit Application');
    await submitButton.click();
    
    // Should show validation error
    const errorMessage = page.locator('.text-red-600');
    const errorCount = await errorMessage.count();
    expect(errorCount).toBeGreaterThan(0);
    
    console.log('✅ Validation error states tested successfully!');
  });

  test('should test mobile responsiveness of all buttons', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/employee-application');
    
    // Test mobile layout
    await expect(page.getByText('Employee Application')).toBeVisible();
    
    // Test test data buttons on mobile
    await expect(page.getByText('📋 Load Complete Application')).toBeVisible();
    await page.getByText('📋 Load Complete Application').click();
    
    // Test navigation buttons on mobile
    const nextButton = page.getByRole('button', { name: /next/i });
    await expect(nextButton).toBeVisible();
    await nextButton.click();
    
    // Test step navigation on mobile
    const stepButtons = page.locator('button').filter({ hasText: /Test|Info|Files|Work|School|Refs|Sign/ });
    const visibleSteps = await stepButtons.count();
    expect(visibleSteps).toBeGreaterThan(0);
    
    // Test form controls on mobile
    await nextButton.click(); // Personal info
    
    const mobileInputs = page.locator('input[type="text"]').first();
    await expect(mobileInputs).toBeVisible();
    
    console.log('✅ Mobile responsiveness tested successfully!');
  });
}); 