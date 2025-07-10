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
      restrictedChemicalScenario: 'I would first check our compliance database and the customer\'s certification status. I\'d verify their business license and proper storage capabilities. If they lack proper certifications, I\'d explain the requirements and provide guidance on obtaining them. I\'d document all communications and escalate to management for approval.',
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
  return {
    // Scenario 1: Entry-level candidate
    entryLevel: {
      ...generateTestData(),
      personalInfo: {
        ...generateTestData().personalInfo,
        firstName: 'Emily',
        lastName: 'Johnson',
        email: 'emily.johnson@email.com',
        phone: '555-222-3333',
        compensationType: 'hourly' as const,
        desiredHourlyRate: '18.50',
        dateOfBirth: '1999-03-15',
        availableStartDate: '2024-02-15',
      },
      roleAssessment: {
        // Technical Platform Experience - Entry Level
        tmsMyCarrierExperience: 'none',
        shopifyExperience: 'I have basic experience with Shopify from a part-time job at a small retail store. I can process orders, check inventory, and handle basic customer questions, but I\'m still learning the more advanced features.',
        amazonSellerCentralExperience: 'none',
        excelProficiency: 'basic',
        canvaExperience: 'I use Canva for personal projects and school assignments. I can create simple designs and social media posts, but I\'m still learning the more professional features.',
        
        // Personal Work Style Assessment - Entry Level
        learningUnderPressure: 'I learn well under pressure by staying calm and asking for help when needed. I take notes during training and practice new skills during quieter moments. I\'m comfortable admitting when I don\'t know something and asking questions.',
        conflictingInformation: 'When I receive conflicting information, I would ask clarifying questions to understand the differences and check with my supervisor or training materials. I believe it\'s better to ask questions than to make assumptions.',
        workMotivation: 'I\'m motivated by learning new skills and helping customers solve their problems. I enjoy the satisfaction of turning a frustrated customer into a happy one and building my knowledge of the industry.',
        
        // Customer Service Scenarios - Entry Level
        delayedShipmentScenario: 'I would apologize to the customer for the delay and look up the tracking information to see what happened. I would call the shipping company to get more details and keep the customer updated. If needed, I would ask my supervisor about options for expedited shipping.',
        restrictedChemicalScenario: 'I would need to check our procedures and possibly ask my supervisor about the proper process for restricted chemicals. I would make sure to document everything and follow all safety and legal requirements before processing the order.',
        hazmatFreightScenario: 'Hazmat fees are required for shipping dangerous materials safely. They cover special packaging, trained drivers, and extra insurance to protect everyone during transport. These fees help ensure we follow all safety regulations.',
        customerQuoteScenario: 'I would listen to the customer\'s concerns and check if we have any current promotions or discounts that might help. I would also ask my supervisor about our price matching policy and see what options we have to work with the customer.',
        
        // Personal & Professional Assessment - Entry Level
        softwareLearningExperience: 'When I learned our point-of-sale system at my retail job, I started by watching the training videos and taking notes. I practiced during slow periods and asked experienced coworkers for tips. I also created my own cheat sheet for common tasks.',
        customerServiceMotivation: ['Learning new skills', 'Helping customers', 'Building relationships', 'Growing professionally'],
        stressManagement: 'I manage stress by taking deep breaths and focusing on one task at a time. I\'m not afraid to ask for help when I need it, and I try to learn from each challenging situation to handle it better next time.',
        automationIdeas: 'I think automatic email updates about order status would be helpful so customers don\'t have to call to check. Maybe also automatic reminders for follow-up calls or tasks so nothing gets forgotten.',
        
        // Advanced Role Assessment - Entry Level
        b2bLoyaltyFactor: 'communication',
        dataAnalysisApproach: 'I would track basic metrics like how many calls I handle and customer satisfaction. I would look for patterns in common questions or problems to help improve our processes and training.',
        idealWorkEnvironment: 'I work best in a supportive team environment where I can learn from experienced colleagues. I prefer clear instructions and regular feedback to help me grow and improve my skills.',
      },
      workExperience: [
        {
          companyName: 'Local Retail Store',
          jobTitle: 'Sales Associate',
          startDate: '2023-01',
          endDate: '2023-12',
          isCurrent: false,
          responsibilities: 'Customer service, cash handling, inventory management, and assisting with online orders.',
          reasonForLeaving: 'Seeking career growth in a professional environment',
          supervisorName: 'Tom Davis',
          supervisorContact: '555-444-5555',
        },
        {
          companyName: 'Campus Bookstore',
          jobTitle: 'Part-time Clerk',
          startDate: '2022-08',
          endDate: '2022-12',
          isCurrent: false,
          responsibilities: 'Helped students find textbooks, processed returns, and maintained inventory.',
          reasonForLeaving: 'Seasonal position ended',
          supervisorName: 'Maria Garcia',
          supervisorContact: '555-666-7777',
        },
      ],
      education: [
        {
          institutionName: 'Community College of New York',
          degreeType: 'Associate',
          fieldOfStudy: 'Business Administration',
          graduationDate: '2023-05',
          gpa: '3.2',
          isCompleted: true,
        },
        {
          institutionName: 'Roosevelt High School',
          degreeType: 'High School',
          fieldOfStudy: '',
          graduationDate: '2021-06',
          gpa: '3.6',
          isCompleted: true,
        },
      ],
      references: [
        {
          name: 'Tom Davis',
          relationship: 'Former Supervisor',
          company: 'Local Retail Store',
          phone: '555-444-5555',
          email: 'tom.davis@localretail.com',
          yearsKnown: 1,
        },
        {
          name: 'Professor Jennifer Wong',
          relationship: 'Business Professor',
          company: 'Community College of New York',
          phone: '555-888-9999',
          email: 'j.wong@ccny.edu',
          yearsKnown: 2,
        },
      ],
      additionalInfo: 'I am eager to start my career in the chemical industry and am committed to learning and growing with Alliance Chemical. I am a quick learner and dedicated to providing excellent customer service.',
    },

    // Scenario 2: Experienced professional
    experienced: {
      ...generateTestData(),
      personalInfo: {
        ...generateTestData().personalInfo,
        firstName: 'Michael',
        lastName: 'Rodriguez',
        email: 'michael.rodriguez@email.com',
        phone: '555-999-8888',
        dateOfBirth: '1985-07-22',
        desiredSalary: '95000',
        availableStartDate: '2024-01-15',
      },
      roleAssessment: {
        // Technical Platform Experience - Experienced
        tmsMyCarrierExperience: 'expert',
        shopifyExperience: 'I have 5+ years of advanced Shopify experience managing multiple stores with complex product catalogs. I\'ve handled custom integrations, automated workflows, inventory management across multiple channels, and complex order modifications. I can troubleshoot technical issues and train other team members.',
        amazonSellerCentralExperience: 'advanced',
        excelProficiency: 'advanced',
        canvaExperience: 'I\'ve used Canva professionally for creating marketing materials, product catalogs, training documentation, and customer-facing presentations. I can work with brand guidelines, create templates, and design professional layouts for various business needs.',
        
        // Personal Work Style Assessment - Experienced
        learningUnderPressure: 'I excel at learning under pressure by quickly identifying the core functions needed immediately versus nice-to-have features. I leverage my experience with similar systems, find the best documentation sources, and identify key experts to consult. I can become productive quickly while continuing to learn advanced features.',
        conflictingInformation: 'I have a systematic approach to conflicting information: I document all sources with timestamps, verify information through multiple channels including system data and written policies, escalate to appropriate authorities when needed, and always get written confirmation before making significant decisions that affect customers or compliance.',
        workMotivation: 'I\'m driven by complex problem-solving that has real business impact. I enjoy being the expert customers and colleagues turn to for difficult situations. I\'m motivated by optimizing processes, mentoring junior team members, and contributing to strategic improvements that benefit the entire organization.',
        
        // Customer Service Scenarios - Experienced
        delayedShipmentScenario: 'I would immediately pull up the shipment tracking and carrier communication logs to understand the root cause. I\'d contact the carrier directly with our account rep to explore expedited options. I\'d call the customer with a detailed explanation, multiple solution options, and proactive measures to prevent future delays. I\'d document everything and follow our escalation procedures if needed.',
        restrictedChemicalScenario: 'I would immediately check our compliance database and the customer\'s certification status. I\'d verify their DEA registration if applicable, confirm their business license and proper storage capabilities. If they lack certifications, I\'d provide detailed guidance on requirements and connect them with our compliance team. I\'d document all communications and get management approval before processing.',
        hazmatFreightScenario: 'Hazmat fees cover specialized packaging engineered for dangerous materials, drivers certified in hazmat transport, DOT compliance documentation and placarding, additional insurance coverage for liability protection, and specialized handling procedures throughout the supply chain. These fees ensure regulatory compliance and public safety while protecting our customers from liability.',
        customerQuoteScenario: 'I would acknowledge their loyalty and review their complete order history and volume trends. I\'d analyze their total relationship value including payment terms and growth potential. I\'d present a comprehensive proposal including volume discounts, bundling opportunities, improved payment terms, or value-added services. I\'d work with sales management to create a win-win solution that retains the customer while maintaining profitability.',
        
        // Personal & Professional Assessment - Experienced
        softwareLearningExperience: 'When implementing a new ERP system, I led the customer service module evaluation and training. I created comprehensive documentation, developed training materials, and established best practices. I became the go-to expert for troubleshooting and trained other departments on customer-facing features.',
        customerServiceMotivation: ['Solving complex problems', 'Building strategic relationships', 'Mentoring team members', 'Process optimization', 'Driving business results'],
        stressManagement: 'I manage stress through structured prioritization using impact/urgency matrices, clear communication with all stakeholders about realistic timelines, and maintaining detailed documentation. I also practice delegation for routine tasks while personally handling the most complex issues.',
        automationIdeas: 'I would implement intelligent routing based on customer history and issue complexity, automated escalation workflows for time-sensitive issues, predictive analytics to identify at-risk customers, and self-service portals for routine inquiries. I\'d also create automated reporting dashboards for real-time performance monitoring.',
        
        // Advanced Role Assessment - Experienced
        b2bLoyaltyFactor: 'expertise',
        dataAnalysisApproach: 'I would establish comprehensive KPI dashboards tracking response times, resolution rates, customer satisfaction scores, and revenue impact. I\'d implement cohort analysis to understand customer behavior patterns, create predictive models for churn risk, and develop actionable insights for process improvements and strategic initiatives.',
        idealWorkEnvironment: 'I thrive in fast-paced, results-driven environments where I can leverage my expertise to make strategic contributions. I prefer collaborative teams with clear accountability, opportunities to mentor others, and the authority to make decisions that improve customer outcomes and business performance.',
      },
      eligibility: {
        ...generateTestData().eligibility,
        hasHazmatExperience: true,
        hasChemicalHandlingExperience: true,
      },
      workExperience: [
        {
          companyName: 'Global Chemical Solutions',
          jobTitle: 'Senior Customer Service Manager',
          startDate: '2015-08',
          endDate: '2023-11',
          isCurrent: false,
          responsibilities: 'Led customer service operations for B2B chemical distribution, managed complex compliance issues, optimized processes using data analytics, supervised team of 8 representatives, and collaborated with sales and logistics teams.',
          reasonForLeaving: 'Seeking new challenges and growth opportunities',
          supervisorName: 'Dr. Jennifer Lee',
          supervisorContact: 'jennifer.lee@globalchem.com',
        },
        {
          companyName: 'Industrial Chemical Corp',
          jobTitle: 'Customer Service Representative',
          startDate: '2010-06',
          endDate: '2015-07',
          isCurrent: false,
          responsibilities: 'Handled complex B2B customer inquiries, managed hazmat shipping requirements, resolved compliance issues, and maintained customer relationships in the chemical industry.',
          reasonForLeaving: 'Promotion opportunity',
          supervisorName: 'David Chen',
          supervisorContact: '555-666-7777',
        },
      ],
      education: [
        {
          institutionName: 'State University of New York',
          degreeType: 'Bachelor',
          fieldOfStudy: 'Chemistry',
          graduationDate: '2010-05',
          gpa: '3.7',
          isCompleted: true,
        },
        {
          institutionName: 'Professional Development Institute',
          degreeType: 'Certificate',
          fieldOfStudy: 'Hazmat Transportation',
          graduationDate: '2016-03',
          gpa: '',
          isCompleted: true,
        },
      ],
      references: [
        {
          name: 'Dr. Jennifer Lee',
          relationship: 'Former Supervisor',
          company: 'Global Chemical Solutions',
          phone: '555-111-2222',
          email: 'jennifer.lee@globalchem.com',
          yearsKnown: 8,
        },
        {
          name: 'David Chen',
          relationship: 'Former Manager',
          company: 'Industrial Chemical Corp',
          phone: '555-333-4444',
          email: 'david.chen@industrialchem.com',
          yearsKnown: 10,
        },
      ],
      additionalInfo: 'I bring extensive experience in chemical industry customer service and compliance management. I am passionate about leveraging technology and data analytics to improve customer experiences and drive business results.',
    },
  };
}; 