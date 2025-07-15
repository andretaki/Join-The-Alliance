import { EmployeeApplicationForm } from './employee-validation';

export const generateTestData = (): EmployeeApplicationForm => {
  return {
    jobPostingId: 1,
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      middleName: 'Michael',
      email: 'john.doe@email.com',
      phone: '555-123-4567',
      alternatePhone: '555-987-6543',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      socialSecurityNumber: '123-45-6789',
      dateOfBirth: '1990-01-15',
      hasDriversLicense: true,
      driversLicenseNumber: 'D1234567890',
      driversLicenseState: 'NY',
      emergencyContactName: 'Jane Doe',
      emergencyContactRelationship: 'Spouse',
      emergencyContactPhone: '555-111-2222',
      emergencyContactAddress: '123 Main Street, New York, NY 10001',
      compensationType: 'salary' as const,
      desiredSalary: '75000',
      availableStartDate: '2024-03-01',
      hoursAvailable: 'full-time' as const,
      shiftPreference: 'day' as const,
      hasTransportation: true,
      hasBeenConvicted: false,
      hasPreviouslyWorkedHere: false,
    },
    roleAssessment: {
      // Technical Platform Experience
      tmsMyCarrierExperience: 'intermediate',
      shopifyExperience: 'I have 2 years of experience managing Shopify stores, handling order processing, customer inquiries, inventory management, and resolving payment issues. I\'m comfortable with the admin dashboard and can handle complex order modifications.',
      amazonSellerCentralExperience: 'intermediate',
      excelProficiency: 'intermediate',
      canvaExperience: 'I use Canva regularly to create marketing materials, social media posts, and customer-facing documents. I can design professional flyers, infographics, and presentations.',
      
      // Personal Work Style Assessment
      learningUnderPressure: 'I learn best under pressure by breaking down complex tasks into smaller, manageable steps. I take detailed notes, ask questions when unclear, and practice new skills immediately. I also maintain calm communication with customers while learning.',
      conflictingInformation: 'When I receive conflicting information, I first document all sources and details. Then I verify information by checking official systems, consulting with supervisors, and cross-referencing with written policies. I always get confirmation before acting on uncertain information.',
      workMotivation: 'I\'m most motivated by solving complex problems that directly help customers. I enjoy the detective work of figuring out shipping issues, finding solutions for special requests, and building long-term customer relationships. Achieving measurable results like improved response times also drives me.',
      
      // Customer Service Scenarios
      delayedShipmentScenario: 'I would immediately contact the carrier for an updated ETA and tracking details. Next, I\'d call the customer to explain the situation, apologize for the inconvenience, and offer solutions like expedited shipping for the next order or partial delivery if possible. I\'d document everything and follow up until resolved.',
      hazmatFreightScenario: 'Hazmat fees cover specialized packaging designed for dangerous materials, trained driver requirements, DOT compliance documentation, additional insurance coverage, and special handling procedures. These fees ensure safe transport and regulatory compliance, protecting both the customer and the public.',
      customerQuoteScenario: 'I would acknowledge their request and explain our commitment to competitive pricing. I\'d review their order history, volume, and loyalty to identify potential discounts. I\'d consult with sales management about price matching policies and work to find creative solutions like volume discounts or bundling to meet their needs while maintaining profitability.',
      
      // Personal & Professional Assessment
      softwareLearningExperience: 'I recently learned a new CRM system by starting with the training videos, then practicing in the sandbox environment. I created my own reference guide with screenshots and kept notes on common tasks. I also shadowed experienced colleagues and asked questions during slow periods.',
      customerServiceMotivation: ['Building long-term relationships', 'Solving complex problems', 'Learning new technologies', 'Helping customers succeed'],
      stressManagement: 'I manage stress by prioritizing tasks based on urgency and impact, taking brief breaks when overwhelmed, and maintaining open communication with customers about realistic timelines. I also practice deep breathing and stay organized with detailed task lists.',
      automationIdeas: 'I would automate order status updates and tracking notifications to reduce repetitive customer inquiries. I\'d also create automated alerts for delayed shipments and set up templates for common responses, freeing up time for complex problem-solving and relationship building.',
      
      // Advanced Role Assessment
      b2bLoyaltyFactor: 'reliability',
      dataAnalysisApproach: 'I would track key metrics like response times, resolution rates, customer satisfaction scores, and repeat issues. I\'d create monthly reports to identify trends, training needs, and process improvements. I\'d also analyze customer feedback to find opportunities for service enhancement.',
      idealWorkEnvironment: 'I thrive in collaborative teams with clear communication and mutual support. I prefer a moderate pace that allows for both efficiency and attention to detail. I value opportunities to learn from experienced professionals and contribute to process improvements.',
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
      hasForkliftCertification: true,
      hasChemicalHandlingExperience: false,
      willingToObtainCertifications: true,
    },
    workExperience: [
      {
        companyName: 'ABC Chemical Corp',
        jobTitle: 'Chemical Technician',
        startDate: '2020-06',
        endDate: '2023-12',
        isCurrent: false,
        responsibilities: 'Handled chemical inventory, performed quality control tests, maintained safety protocols, and operated laboratory equipment.',
        reasonForLeaving: 'Seeking growth opportunities',
        supervisorName: 'Sarah Johnson',
        supervisorContact: 'sarah.johnson@abcchemical.com',
      },
      {
        companyName: 'XYZ Logistics',
        jobTitle: 'Warehouse Associate',
        startDate: '2018-03',
        endDate: '2020-05',
        isCurrent: false,
        responsibilities: 'Managed inventory, operated forklifts, prepared shipments, and maintained warehouse organization.',
        reasonForLeaving: 'Career advancement',
        supervisorName: 'Mike Wilson',
        supervisorContact: '555-555-5555',
      },
    ],
    education: [
      {
        institutionName: 'State University of New York',
        degreeType: 'Bachelor',
        fieldOfStudy: 'Chemistry',
        graduationDate: '2018-05',
        gpa: '3.5',
        isCompleted: true,
      },
      {
        institutionName: 'Central High School',
        degreeType: 'High School',
        fieldOfStudy: '',
        graduationDate: '2014-06',
        gpa: '3.8',
        isCompleted: true,
      },
    ],
    references: [
      {
        name: 'Robert Smith',
        relationship: 'Former Supervisor',
        company: 'ABC Chemical Corp',
        phone: '555-333-4444',
        email: 'robert.smith@abcchemical.com',
        yearsKnown: 3,
      },
      {
        name: 'Lisa Brown',
        relationship: 'Professor',
        company: 'State University of New York',
        phone: '555-777-8888',
        email: 'lisa.brown@suny.edu',
        yearsKnown: 5,
      },
    ],
    signatureDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    termsAgreed: true,
    additionalInfo: 'I am excited to join Alliance Chemical and contribute to the team with my chemistry background and warehouse experience.',
  };
};

// Alternative test data for different scenarios
export const generateTestDataVariations = () => {
  const baseData = generateTestData();
  
  return [
    // Variation 1: Strong technical background, limited communication
    {
      ...baseData,
      personalInfo: {
        ...baseData.personalInfo,
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@email.com',
      },
      roleAssessment: {
        ...baseData.roleAssessment,
        tmsMyCarrierExperience: 'expert' as const,
        shopifyExperience: 'I have 5 years experience with Shopify, including advanced API integrations, custom app development, and multi-store management. I can handle complex technical issues and train other team members.',
        amazonSellerCentralExperience: 'advanced' as const,
        excelProficiency: 'advanced' as const,
        customerQuoteScenario: 'Barry, we can provide 4 drums of Acetic Acid at $800 each plus $200 shipping to Brooklyn. Total is $3400. Let me know if you want to order.',
        learningUnderPressure: 'I focus on technical documentation and system manuals. I prefer to fully understand all features before using them.',
        stressManagement: 'I prioritize tasks by technical complexity and handle the most technical issues first.',
      }
    },
    
    // Variation 2: Excellent communication skills, limited technical experience
    {
      ...baseData,
      personalInfo: {
        ...baseData.personalInfo,
        firstName: 'Michael',
        lastName: 'Rodriguez',
        email: 'michael.rodriguez@email.com',
      },
      roleAssessment: {
        ...baseData.roleAssessment,
        tmsMyCarrierExperience: 'none' as const,
        shopifyExperience: 'I have not used Shopify professionally, but I have excellent customer service experience and I am very eager to learn. I believe my communication skills and customer focus will help me quickly master any platform.',
        amazonSellerCentralExperience: 'none' as const,
        excelProficiency: 'basic' as const,
        customerQuoteScenario: 'Dear Barry,\n\nThank you for your inquiry regarding Acetic Acid for Widgets Inc. I am pleased to provide you with the following quote:\n\n• Product: Acetic Acid (4 drums)\n• Unit Price: $800 per drum\n• Subtotal: $3,200\n• Shipping to Brooklyn, NY: $200\n• Total: $3,400\n\nThis quote is valid for 30 days. As a chemical distributor, we ensure all products meet industry standards and include proper safety documentation. I would be happy to answer any questions about the product specifications or delivery timeline.\n\nPlease let me know if you would like to proceed with this order or if you need any additional information.\n\nBest regards,\nMichael Rodriguez\nAlliance Chemical',
        learningUnderPressure: 'When learning new systems under pressure, I focus on understanding the customer impact first. I ask colleagues for quick tutorials on essential functions while reading documentation for deeper understanding later. Most importantly, I communicate transparently with customers about any delays while I\'m learning.',
        stressManagement: 'I handle multiple urgent requests by first acknowledging each customer personally, then categorizing requests by urgency and impact. I communicate realistic timelines and provide regular updates. I also practice deep breathing and maintain a calm, professional demeanor.',
        workMotivation: 'I am most motivated by building genuine relationships with customers and solving their problems. I believe that when customers trust you and feel heard, they become long-term partners rather than just transactions. I take pride in turning frustrated customers into loyal advocates.',
        b2bLoyaltyFactor: 'reliability' as const,
        dataAnalysisApproach: 'I focus on patterns in customer feedback and identify opportunities to improve their experience. I believe data should tell the story of how we can serve customers better, not just track metrics.',
        idealWorkEnvironment: 'I thrive in environments where I can build relationships with customers and colleagues. I prefer collaborative settings where I can learn from experienced team members while contributing my communication strengths.',
      }
    },
    
    // Variation 3: Balanced candidate with B2B experience
    {
      ...baseData,
      personalInfo: {
        ...baseData.personalInfo,
        firstName: 'Emily',
        lastName: 'Chen',
        email: 'emily.chen@email.com',
      },
      roleAssessment: {
        ...baseData.roleAssessment,
        tmsMyCarrierExperience: 'intermediate' as const,
        shopifyExperience: 'I have 3 years of B2B e-commerce experience using Shopify Plus for wholesale operations. I\'ve managed bulk orders, custom pricing tiers, and B2B customer accounts. I understand the difference between B2B and B2C customer service requirements.',
        amazonSellerCentralExperience: 'intermediate' as const,
        customerQuoteScenario: 'Hello Barry,\n\nThank you for contacting Alliance Chemical regarding your Acetic Acid requirements.\n\nI\'m happy to provide the following competitive quote for Widgets Inc.:\n\n• Product: Acetic Acid - Industrial Grade\n• Quantity: 4 drums (55 gallons each)\n• Unit Price: $800.00 per drum\n• Product Subtotal: $3,200.00\n• Delivery to Brooklyn, NY: $200.00\n• Total Investment: $3,400.00\n\nThis quote includes:\n- MSDS and safety documentation\n- Proper hazmat labeling and packaging\n- Estimated delivery within 3-5 business days\n- Net 30 payment terms for qualified accounts\n\nI would be happy to discuss volume discounts for future orders or answer any questions about product specifications. We value building long-term partnerships with companies like Widgets Inc.\n\nWould you like to proceed with this order, or would you prefer to schedule a call to discuss your ongoing chemical supply needs?\n\nBest regards,\nEmily Chen\nCustomer Service Specialist\nAlliance Chemical',
        delayedShipmentScenario: 'I would immediately call the customer to proactively inform them of the delay before they call us. I\'d explain the situation honestly, apologize for the inconvenience, and provide a realistic new timeline. I\'d offer solutions like expedited shipping for future orders or a partial delivery if some products are available. Most importantly, I\'d follow up regularly until the issue is resolved and document everything for future reference.',
        b2bLoyaltyFactor: 'reliability' as const,
        dataAnalysisApproach: 'I analyze customer purchase patterns to anticipate their needs and identify opportunities for proactive service. I also track response times and resolution rates to continuously improve our service quality.',
      }
    }
  ];
}; 