# Testing Guide for Employee Application Form

## Overview

This project includes comprehensive testing features for the employee application form to make development and testing easier.

## Test Button (Development Mode)

When running in development mode (`npm run dev`), you'll see a **Test Mode** panel at the top of the employee application form with three buttons:

### Test Button Options

1. **Fill Standard** - Populates the form with standard test data:
   - Name: John Doe
   - Email: john.doe@email.com
   - Experience: Chemical technician background
   - Education: Bachelor's in Chemistry

2. **Fill Entry Level** - Populates the form with entry-level candidate data:
   - Name: Emily Johnson
   - Email: emily.johnson@email.com
   - Experience: Retail/customer service background
   - Education: Associate degree

3. **Fill Experienced** - Populates the form with experienced professional data:
   - Name: Michael Rodriguez
   - Email: michael.rodriguez@email.com
   - Experience: Senior chemical engineer background
   - Education: Bachelor's in Engineering

### How to Use

1. Start the development server: `npm run dev`
2. Navigate to `/employee-application`
3. Click any of the test buttons to auto-fill the form
4. Navigate through all form steps to verify everything works
5. Submit the form to test the complete workflow

## Unit Tests

The project includes comprehensive unit tests for the form functionality.

### Running Tests

```bash
# Run all tests
npm test

# Run only the employee application form tests
npm test -- src/components/__tests__/EmployeeApplicationForm.test.tsx

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

The unit tests cover:

- **Form Rendering** - Ensures all form steps render correctly
- **Test Data Population** - Verifies test buttons work properly
- **Form Navigation** - Tests step-by-step navigation
- **Form Validation** - Tests required field validation
- **Form Submission** - Tests successful form submission
- **Error Handling** - Tests error scenarios
- **Data Generation** - Tests test data utility functions

### Test Data Structure

The test data includes all required fields:

- **Personal Information**: Name, email, phone, address, SSN, DOB
- **Employment Eligibility**: Work authorization, consents, certifications
- **Work Experience**: Previous jobs with detailed information
- **Education**: Academic background
- **References**: Professional references
- **Digital Signature**: Mock signature data

## Benefits

### For Developers
- **Faster Testing**: No need to manually fill 50+ form fields
- **Consistent Data**: Same test data across all testing scenarios
- **Multiple Scenarios**: Test different user types (standard, entry-level, experienced)
- **Automated Validation**: Unit tests catch regressions automatically

### For QA/Testing
- **Comprehensive Coverage**: Tests all form functionality
- **Edge Cases**: Tests various data scenarios
- **Regression Prevention**: Automated tests prevent bugs
- **Easy Verification**: Simple button clicks to test complete workflows

## Production Notes

- Test buttons only appear in development mode
- Test data is not included in production builds
- All test functionality is automatically disabled in production
- No performance impact on production builds

## Adding New Test Scenarios

To add new test scenarios:

1. Edit `src/lib/test-data.ts`
2. Add new test data variations
3. Update the test button options in `src/components/EmployeeApplicationForm.tsx`
4. Add corresponding unit tests

## Troubleshooting

### Test Button Not Showing
- Ensure you're running in development mode (`npm run dev`)
- Check that `NODE_ENV` is set to 'development'

### Tests Failing
- Run `npm install` to ensure all dependencies are installed
- Check that Jest configuration is correct
- Verify all mocks are properly set up

### Form Validation Issues
- Ensure test data matches validation schema
- Check that all required fields are included
- Verify date formats and field constraints 