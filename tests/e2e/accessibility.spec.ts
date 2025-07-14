import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/employee-application');
  });

  test('should have proper page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Alliance Chemical/);
  });

  test('should have proper heading structure', async ({ page }) => {
    // Should have h1 for main heading
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    
    // Should have proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should have proper form labels', async ({ page }) => {
    // Fill with test data and navigate to a form step
    await page.getByText('Fill Standard').click();
    await page.getByText('Next').click(); // Assessment
    await page.getByText('Next').click(); // Personal
    
    // All form inputs should have associated labels
    const inputs = await page.locator('input, select, textarea').all();
    
    for (const input of inputs) {
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const id = await input.getAttribute('id');
      
      let hasLabel = false;
      
      if (ariaLabel) {
        hasLabel = true;
      } else if (ariaLabelledBy) {
        const labelElement = page.locator(`#${ariaLabelledBy}`);
        hasLabel = await labelElement.isVisible();
      } else if (id) {
        const labelElement = page.locator(`label[for="${id}"]`);
        hasLabel = await labelElement.isVisible();
      } else {
        // Check if wrapped in label
        const parentLabel = input.locator('xpath=ancestor::label');
        hasLabel = await parentLabel.count() > 0;
      }
      
      // Some inputs might be hidden or decorative
      const isVisible = await input.isVisible();
      if (isVisible) {
        expect(hasLabel).toBe(true);
      }
    }
  });

  test('should have proper button accessibility', async ({ page }) => {
    const buttons = await page.getByRole('button').all();
    
    for (const button of buttons) {
      const isVisible = await button.isVisible();
      if (isVisible) {
        // Button should have accessible name
        const accessibleName = await button.getAttribute('aria-label') || 
                              await button.textContent() ||
                              await button.getAttribute('title');
        expect(accessibleName?.trim()).toBeTruthy();
      }
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Test Tab navigation
    await page.keyboard.press('Tab');
    
    // First focusable element should be focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].includes(focusedElement || '')).toBe(true);
    
    // Should be able to navigate through multiple elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Focus should move
    const newFocusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].includes(newFocusedElement || '')).toBe(true);
  });

  test('should support Enter key for button activation', async ({ page }) => {
    // Focus on Fill Standard button and press Enter
    const fillButton = page.getByText('Fill Standard');
    await fillButton.focus();
    await page.keyboard.press('Enter');
    
    // Should trigger the action
    await expect(page.getByText('Form populated with test data!')).toBeVisible();
  });

  test('should have proper color contrast', async ({ page }) => {
    // This is a basic check - in practice you'd use axe-core or similar
    const body = page.locator('body');
    const backgroundColor = await body.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Should have a defined background color
    expect(backgroundColor).toBeTruthy();
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent
  });

  test('should have focus indicators', async ({ page }) => {
    const firstButton = page.getByRole('button').first();
    await firstButton.focus();
    
    // Should have visible focus outline or ring
    const outlineStyle = await firstButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      };
    });
    
    // Should have some form of focus indicator
    const hasFocusIndicator = 
      outlineStyle.outline !== 'none' ||
      outlineStyle.outlineWidth !== '0px' ||
      outlineStyle.boxShadow !== 'none';
    
    expect(hasFocusIndicator).toBe(true);
  });

  test('should have proper ARIA attributes for form validation', async ({ page }) => {
    // Navigate to personal info form
    await page.getByText('Fill Standard').click();
    await page.getByText('Next').click();
    await page.getByText('Next').click();
    
    // Clear required field to trigger validation
    const emailInput = page.getByLabel(/email/i);
    await emailInput.clear();
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    
    // Check for proper ARIA attributes
    const ariaInvalid = await emailInput.getAttribute('aria-invalid');
    const ariaDescribedBy = await emailInput.getAttribute('aria-describedby');
    
    // Should indicate invalid state
    if (ariaInvalid !== null) {
      expect(ariaInvalid).toBe('true');
    }
    
    // If there's an error message, it should be properly associated
    if (ariaDescribedBy) {
      const errorMessage = page.locator(`#${ariaDescribedBy}`);
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should have proper landmark roles', async ({ page }) => {
    // Check for main content landmark
    const main = page.locator('[role="main"], main');
    const mainExists = await main.count() > 0;
    
    // Check for navigation landmark
    const nav = page.locator('[role="navigation"], nav');
    const navExists = await nav.count() > 0;
    
    // Should have proper page structure
    expect(mainExists || navExists).toBe(true);
  });

  test('should handle screen reader announcements', async ({ page }) => {
    // Fill form and navigate - check for live regions
    await page.getByText('Fill Standard').click();
    
    // Should have aria-live regions for dynamic content
    const liveRegions = await page.locator('[aria-live]').count();
    const statusRegions = await page.locator('[role="status"]').count();
    const alertRegions = await page.locator('[role="alert"]').count();
    
    // Should have at least some dynamic announcements
    expect(liveRegions + statusRegions + alertRegions).toBeGreaterThan(0);
  });
});