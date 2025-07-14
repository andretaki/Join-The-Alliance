import { test, expect } from '@playwright/test';

test.describe('Mobile Experience', () => {
  test.describe('iPhone Safari', () => {
    test.use({ 
      ...test.playwright.devices['iPhone 12'],
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    });

    test('should fix dropdown auto-open issue', async ({ page }) => {
      await page.goto('/employee-application');
      
      // Fill with test data and navigate to assessment
      await page.getByText('Fill Standard').click();
      await page.getByText('Next').click();
      
      await expect(page.getByText('Assessment')).toBeVisible();
      
      // Check that dropdowns are not auto-opened
      const dropdown = page.locator('select').first();
      if (await dropdown.isVisible()) {
        // Verify dropdown is closed by checking if options are not visible
        const dropdownBox = await dropdown.boundingBox();
        expect(dropdownBox?.height).toBeLessThan(100); // Closed dropdown should be small
      }
    });

    test('should have touch-friendly interface', async ({ page }) => {
      await page.goto('/employee-application');
      
      // Check button sizes are touch-friendly (minimum 44px)
      const buttons = page.getByRole('button');
      const firstButton = buttons.first();
      
      if (await firstButton.isVisible()) {
        const box = await firstButton.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
    });

    test('should support camera access for ID photo', async ({ page }) => {
      await page.goto('/employee-application');
      
      // Grant camera permissions
      await page.context().grantPermissions(['camera']);
      
      // Navigate to documents section
      await page.getByText('Fill Standard').click();
      await page.getByText('Next').click(); // Assessment
      await page.getByText('Next').click(); // Personal
      await page.getByText('Next').click(); // Documents
      
      // Switch to camera mode
      await page.getByText('Take Photo').click();
      await expect(page.getByText('Start Camera')).toBeVisible();
    });
  });

  test.describe('Android Chrome', () => {
    test.use({ ...test.playwright.devices['Pixel 5'] });

    test('should work properly on Android', async ({ page }) => {
      await page.goto('/employee-application');
      
      await expect(page.getByText('Employment Application')).toBeVisible();
      
      // Test navigation
      await page.getByText('Fill Standard').click();
      await page.getByText('Next').click();
      
      await expect(page.getByText('Assessment')).toBeVisible();
    });

    test('should handle viewport changes', async ({ page }) => {
      await page.goto('/employee-application');
      
      // Change viewport to landscape
      await page.setViewportSize({ width: 800, height: 600 });
      await expect(page.getByText('Employment Application')).toBeVisible();
      
      // Change back to portrait
      await page.setViewportSize({ width: 360, height: 800 });
      await expect(page.getByText('Employment Application')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to different screen sizes', async ({ page }) => {
      const viewports = [
        { width: 320, height: 568 }, // iPhone SE
        { width: 375, height: 667 }, // iPhone 8
        { width: 414, height: 896 }, // iPhone 11
        { width: 768, height: 1024 }, // iPad
        { width: 1024, height: 768 }, // iPad Landscape
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/employee-application');
        
        // Should be visible and functional at all sizes
        await expect(page.getByText('Employment Application')).toBeVisible();
        
        // Navigation should work
        await page.getByText('Fill Standard').click();
        await expect(page.getByText('Form populated with test data!')).toBeVisible();
      }
    });

    test('should have readable text at all sizes', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 }); // Smallest size
      await page.goto('/employee-application');
      
      // Text should not be too small
      const heading = page.getByText('Employment Application');
      const fontSize = await heading.evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      
      // Font size should be reasonable (at least 14px)
      expect(parseFloat(fontSize)).toBeGreaterThan(14);
    });

    test('should have proper touch targets', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/employee-application');
      
      // All interactive elements should be at least 44px tall
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const box = await button.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });
});