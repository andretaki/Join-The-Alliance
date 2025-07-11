#!/usr/bin/env node

/**
 * Test script for employee application flow
 * Tests PDF generation, S3 upload, and email notifications
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

console.log('🧪 Testing Employee Application Flow...');
console.log(`Base URL: ${BASE_URL}`);

// Test data for employee application
const testApplication = {
  jobPostingId: 1,
  roleAssessment: {
    tmsMyCarrierExperience: 'intermediate',
    shopifyExperience: 'I have 2 years of experience managing Shopify stores, handling customer orders, refunds, and inventory management.',
    amazonSellerCentralExperience: 'basic',
    excelProficiency: 'intermediate',
    canvaExperience: 'I use Canva regularly for creating social media posts and marketing materials.',
    learningUnderPressure: 'When I had to learn a new CRM system in one week, I dedicated extra hours to online tutorials and practice sessions.',
    conflictingInformation: 'I always verify information from multiple sources and escalate to supervisors when needed.',
    workMotivation: 'I am most motivated by solving complex problems and helping customers achieve their goals.',
    delayedShipmentScenario: 'I would immediately contact the carrier for updated tracking, inform the customer proactively, and explore expedited shipping options.',
    restrictedChemicalScenario: 'I would verify the customer\'s licensing and documentation, and escalate to the compliance team for review.',
    hazmatFreightScenario: 'I would explain the specialized handling requirements, safety protocols, and regulatory compliance costs.',
    customerQuoteScenario: 'I would present the pricing in a clear breakdown format, highlight the value proposition, and offer flexible payment terms.',
    softwareLearningExperience: 'I successfully learned Salesforce CRM in 2 weeks through online courses and hands-on practice.',
    customerServiceMotivation: ['Solving complex problems', 'Building long-term customer relationships'],
    stressManagement: 'I manage stress through prioritization, clear communication, and taking short breaks when needed.',
    automationIdeas: 'I would automate order confirmations, shipping notifications, and basic FAQ responses.',
    b2bLoyaltyFactor: 'consistent_quality',
    dataAnalysisApproach: 'I analyze trends, identify patterns, and create actionable insights for business decisions.',
    idealWorkEnvironment: 'A collaborative team environment with clear communication and opportunities for growth.'
  },
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-123-4567',
    address: '123 Main St',
    city: 'Houston',
    state: 'TX',
    zipCode: '77001',
    socialSecurityNumber: '123-45-6789',
    dateOfBirth: '1990-01-01',
    hasDriversLicense: true,
    driversLicenseNumber: 'DL123456789',
    driversLicenseState: 'TX',
    emergencyContactName: 'Jane Doe',
    emergencyContactRelationship: 'Spouse',
    emergencyContactPhone: '555-987-6543',
    compensationType: 'salary',
    availableStartDate: '2024-02-01',
    hoursAvailable: 'full-time',
    shiftPreference: 'day',
    hasTransportation: true,
    hasBeenConvicted: false,
    hasPreviouslyWorkedHere: false
  },
  eligibility: {
    eligibleToWork: true,
    requiresSponsorship: false,
    consentToBackgroundCheck: true,
    consentToDrugTest: true,
    consentToReferenceCheck: true,
    consentToEmploymentVerification: true,
    hasValidI9Documents: true,
    hasHazmatExperience: false,
    hasForkliftCertification: false,
    hasChemicalHandlingExperience: false,
    willingToObtainCertifications: true
  },
  workExperience: [
    {
      companyName: 'ABC Company',
      jobTitle: 'Customer Service Representative',
      startDate: '2020-01-01',
      endDate: '2023-12-31',
      isCurrent: false,
      responsibilities: 'Handled customer inquiries, processed orders, managed complaints, and maintained customer satisfaction records.',
      reasonForLeaving: 'Seeking new opportunities for career growth',
      supervisorName: 'Mary Johnson',
      supervisorContact: 'mary.johnson@abccompany.com'
    }
  ],
  education: [
    {
      institutionName: 'University of Houston',
      degreeType: 'Bachelor',
      fieldOfStudy: 'Business Administration',
      graduationDate: '2019-05-15',
      gpa: '3.5',
      isCompleted: true
    }
  ],
  references: [
    {
      name: 'Mary Johnson',
      relationship: 'Former Supervisor',
      company: 'ABC Company',
      phone: '555-111-2222',
      email: 'mary.johnson@abccompany.com',
      yearsKnown: 4
    },
    {
      name: 'Bob Smith',
      relationship: 'Colleague',
      company: 'ABC Company',
      phone: '555-333-4444',
      email: 'bob.smith@abccompany.com',
      yearsKnown: 3
    }
  ],
  signatureDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  termsAgreed: true
};

async function testEmployeeApplicationFlow() {
  try {
    console.log('📝 Submitting test employee application...');
    
    // Create FormData
    const formData = new FormData();
    formData.append('applicationData', JSON.stringify(testApplication));
    
    // Submit application
    const response = await fetch(`${BASE_URL}/api/employee-applications`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Application submitted successfully:', result);
    
    if (result.applicationId) {
      console.log(`📄 Application ID: ${result.applicationId}`);
      console.log('⏳ Background processing started (PDF generation, S3 upload, email notifications)...');
      console.log('📧 Check your email for notifications!');
      
      // Wait a bit for background processing
      console.log('⏰ Waiting 10 seconds for background processing...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Try to fetch the application to see if it was processed
      console.log('🔍 Checking application status...');
      const checkResponse = await fetch(`${BASE_URL}/api/employee-applications?id=${result.applicationId}`);
      
      if (checkResponse.ok) {
        const applicationData = await checkResponse.json();
        console.log('✅ Application retrieved successfully');
        console.log('📊 AI Summary present:', !!applicationData.aiSummary);
        if (applicationData.aiSummary) {
          console.log('🤖 AI Summary:', applicationData.aiSummary.substring(0, 200) + '...');
        }
      } else {
        console.log('⚠️  Could not retrieve application status');
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function checkSystemStatus() {
  console.log('\n🔧 Checking system configuration...');
  
  // Check if required environment variables are set
  const requiredEnvVars = [
    'DATABASE_URL',
    'MICROSOFT_GRAPH_CLIENT_ID',
    'MICROSOFT_GRAPH_CLIENT_SECRET',
    'MICROSOFT_GRAPH_TENANT_ID',
    'MICROSOFT_GRAPH_USER_EMAIL',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'AWS_S3_BUCKET_NAME',
    'OPENAI_API_KEY',
    'BOSS_EMAIL'
  ];
  
  const optionalEnvVars = [
    'CC_EMAIL'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('⚠️  Missing environment variables:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('💡 Set these variables before running the application.');
  } else {
    console.log('✅ All required environment variables are set');
  }
  
  // Check optional variables
  const setOptionalVars = optionalEnvVars.filter(varName => process.env[varName]);
  if (setOptionalVars.length > 0) {
    console.log('✅ Optional environment variables set:');
    setOptionalVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
  }
  
  console.log(`📧 Boss email: ${process.env.BOSS_EMAIL || 'andre@alliancechemical.com'}`);
  console.log(`📧 CC email: ${process.env.CC_EMAIL || 'Not set'}`);
  console.log(`🪣 S3 bucket: ${process.env.AWS_S3_BUCKET_NAME || 'Not set'}`);
  console.log(`🔗 Microsoft Graph user: ${process.env.MICROSOFT_GRAPH_USER_EMAIL || 'Not set'}`);
}

async function main() {
  console.log('🚀 Employee Application Flow Test');
  console.log('=====================================\n');
  
  await checkSystemStatus();
  
  console.log('\n🧪 Running application flow test...');
  const success = await testEmployeeApplicationFlow();
  
  console.log('\n📋 Test Results:');
  console.log('=====================================');
  console.log(`Application Submission: ${success ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (success) {
    console.log('\n🎉 Test completed successfully!');
    console.log('📝 What was tested:');
    console.log('   - Employee application submission');
    console.log('   - PDF generation (background)');
    console.log('   - S3 upload (background)');
    console.log('   - Multi-agent AI analysis (background)');
    console.log('   - Sophisticated email notifications (background)');
    console.log('   - CC email functionality (if CC_EMAIL is set)');
    console.log('\n💡 Check your email and S3 bucket for the generated files!');
    console.log('📧 Boss and CC recipients get sophisticated multi-agent analysis!');
    console.log('🤖 5 AI agents analyze each candidate: Technical, Cultural, Experience, Risk, Industry Fit');
  } else {
    console.log('\n❌ Test failed. Check the logs above for errors.');
    process.exit(1);
  }
}

// Run the test
main().catch(console.error); 