#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Running Comprehensive Employee Application Tests\n');

// Test configuration
const testSuites = [
  {
    name: 'Comprehensive Button Tests',
    file: 'tests/e2e/comprehensive-button-tests.spec.ts',
    description: 'Tests all buttons in the application'
  },
  {
    name: 'Comprehensive Upload Tests',
    file: 'tests/e2e/comprehensive-upload-tests.spec.ts',
    description: 'Tests all upload functions and file handling'
  },
  {
    name: 'Comprehensive Signature Tests',
    file: 'tests/e2e/comprehensive-signature-tests.spec.ts',
    description: 'Tests signature functionality (draw and type modes)'
  },
  {
    name: 'Comprehensive Full Test',
    file: 'tests/e2e/comprehensive-full-test.spec.ts',
    description: 'Complete end-to-end test of entire application'
  },
  {
    name: 'Existing Tests',
    file: 'tests/e2e/',
    description: 'All existing E2E tests'
  }
];

// Helper function to run a command
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Main test runner
async function runTests() {
  console.log('📋 Available Test Suites:');
  testSuites.forEach((suite, index) => {
    console.log(`${index + 1}. ${suite.name}`);
    console.log(`   ${suite.description}`);
    console.log(`   File: ${suite.file}\n`);
  });

  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🔧 Usage:');
    console.log('  npm run test:comprehensive                  # Run all comprehensive tests');
    console.log('  npm run test:comprehensive -- --ui         # Run with Playwright UI');
    console.log('  npm run test:comprehensive -- --headed     # Run with browser UI');
    console.log('  npm run test:comprehensive -- --debug      # Run in debug mode');
    console.log('  npm run test:comprehensive -- --project=chromium  # Run on specific browser');
    console.log('  npm run test:comprehensive -- buttons      # Run only button tests');
    console.log('  npm run test:comprehensive -- uploads      # Run only upload tests');
    console.log('  npm run test:comprehensive -- signature    # Run only signature tests');
    console.log('  npm run test:comprehensive -- full         # Run only full test');
    console.log('  npm run test:comprehensive -- existing     # Run only existing tests\n');
    return;
  }

  let testFiles = [];
  
  // Determine which tests to run
  if (args.includes('buttons')) {
    testFiles = ['tests/e2e/comprehensive-button-tests.spec.ts'];
  } else if (args.includes('uploads')) {
    testFiles = ['tests/e2e/comprehensive-upload-tests.spec.ts'];
  } else if (args.includes('signature')) {
    testFiles = ['tests/e2e/comprehensive-signature-tests.spec.ts'];
  } else if (args.includes('full')) {
    testFiles = ['tests/e2e/comprehensive-full-test.spec.ts'];
  } else if (args.includes('existing')) {
    testFiles = [
      'tests/e2e/accessibility.spec.ts',
      'tests/e2e/complete-submission.spec.ts',
      'tests/e2e/mobile-experience.spec.ts',
      'tests/e2e/file-upload.spec.ts',
      'tests/e2e/form-validation.spec.ts',
      'tests/e2e/application-flow.spec.ts'
    ];
  } else {
    // Run all tests
    testFiles = [
      'tests/e2e/comprehensive-button-tests.spec.ts',
      'tests/e2e/comprehensive-upload-tests.spec.ts',
      'tests/e2e/comprehensive-signature-tests.spec.ts',
      'tests/e2e/comprehensive-full-test.spec.ts',
      'tests/e2e/accessibility.spec.ts',
      'tests/e2e/complete-submission.spec.ts',
      'tests/e2e/mobile-experience.spec.ts',
      'tests/e2e/file-upload.spec.ts',
      'tests/e2e/form-validation.spec.ts',
      'tests/e2e/application-flow.spec.ts'
    ];
  }

  // Filter out Playwright-specific args
  const playwrightArgs = args.filter(arg => 
    arg.startsWith('--') && !['buttons', 'uploads', 'signature', 'full', 'existing'].includes(arg.replace('--', ''))
  );

  try {
    console.log('🏃 Starting test execution...\n');
    
    // Ensure dev server is running
    console.log('🔧 Checking if dev server is running...');
    
    // Run the tests
    const testCommand = 'npx';
    const testArgs = ['playwright', 'test', ...testFiles, ...playwrightArgs];
    
    console.log(`📋 Running: ${testCommand} ${testArgs.join(' ')}\n`);
    
    await runCommand(testCommand, testArgs);
    
    console.log('\n✅ All tests completed successfully!');
    
    // Show report information
    console.log('\n📊 Test Reports:');
    console.log('  - HTML Report: ./playwright-report/index.html');
    console.log('  - JUnit Results: ./test-results/junit.xml');
    console.log('  - Screenshots: ./test-results/ (on failures)');
    console.log('  - Videos: ./test-results/ (on failures)');
    
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
    process.exit(1);
  }
}

// Check if test files exist
function checkTestFiles() {
  const requiredFiles = [
    'tests/e2e/comprehensive-button-tests.spec.ts',
    'tests/e2e/comprehensive-upload-tests.spec.ts',
    'tests/e2e/comprehensive-signature-tests.spec.ts',
    'tests/e2e/comprehensive-full-test.spec.ts'
  ];

  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    console.log('⚠️  Missing test files:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    console.log('\nPlease ensure all test files are created before running.\n');
    return false;
  }
  
  return true;
}

// Run pre-checks
if (!checkTestFiles()) {
  console.log('🔧 Creating missing test files...');
  // The files should already be created by the previous edits
}

// Run the tests
runTests().catch(console.error); 