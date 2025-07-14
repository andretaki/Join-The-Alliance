import { employeeApplicationSchema } from '../lib/employee-validation';

describe('Security Validation Tests', () => {
  describe('XSS Prevention', () => {
    it('detects script tags in text inputs', () => {
      const maliciousData = {
        personalInfo: {
          firstName: '<script>alert("xss")</script>',
          lastName: '<img src="x" onerror="alert(1)">',
          email: 'test@example.com',
          phone: '(555) 123-4567',
          address: '123 Main St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          socialSecurityNumber: '123-45-6789',
          dateOfBirth: '1990-01-01',
          hasDriversLicense: true,
          driversLicenseNumber: '12345678',
          driversLicenseState: 'TX',
          emergencyContactName: 'Jane Doe',
          emergencyContactRelationship: 'Mother',
          emergencyContactPhone: '(555) 987-6543',
          compensationType: 'salary' as const,
          availableStartDate: '2024-01-01',
          hoursAvailable: 'full-time' as const,
          shiftPreference: 'day' as const,
          hasTransportation: true,
          hasBeenConvicted: false,
          hasPreviouslyWorkedHere: false,
        },
        jobPostingId: 1,
        roleAssessment: {
          tmsMyCarrierExperience: 'basic' as const,
          shopifyExperience: 'test',
          amazonSellerCentralExperience: 'none' as const,
          excelProficiency: 'basic' as const,
          canvaExperience: 'test',
          learningUnderPressure: 'test',
          conflictingInformation: 'test',
          workMotivation: 'test',
          delayedShipmentScenario: 'test',
          restrictedChemicalScenario: 'test',
          hazmatFreightScenario: 'test',
          customerQuoteScenario: 'test',
          softwareLearningExperience: 'test',
          customerServiceMotivation: ['solving-problems'],
          stressManagement: 'test',
          automationIdeas: 'test',
          b2bLoyaltyFactor: 'personal-service' as const,
          dataAnalysisApproach: 'test',
          idealWorkEnvironment: 'test',
        },
        workExperience: [],
        education: [],
        references: [],
        eligibility: {
          eligibleToWork: true,
          requiresSponsorship: false,
        },
        termsAgreed: true,
        signatureDataUrl: 'test',
      };

      const result = employeeApplicationSchema.safeParse(maliciousData);
      
      // Should either fail validation or sanitize the input
      if (result.success) {
        // If validation passes, check that dangerous content is not present
        expect(result.data.personalInfo.firstName).not.toContain('<script>');
        expect(result.data.personalInfo.lastName).not.toContain('<img');
      } else {
        // If validation fails, that's also acceptable for security
        expect(result.success).toBe(false);
      }
    });
  });

  describe('Input Validation', () => {
    it('validates email format', () => {
      const invalidData = {
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'not-an-email',
          phone: '(555) 123-4567',
          address: '123 Main St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          socialSecurityNumber: '123-45-6789',
          dateOfBirth: '1990-01-01',
          hasDriversLicense: true,
          driversLicenseNumber: '12345678',
          driversLicenseState: 'TX',
          emergencyContactName: 'Jane Doe',
          emergencyContactRelationship: 'Mother',
          emergencyContactPhone: '(555) 987-6543',
          compensationType: 'salary' as const,
          availableStartDate: '2024-01-01',
          hoursAvailable: 'full-time' as const,
          shiftPreference: 'day' as const,
          hasTransportation: true,
          hasBeenConvicted: false,
          hasPreviouslyWorkedHere: false,
        },
        jobPostingId: 1,
        roleAssessment: {
          tmsMyCarrierExperience: 'basic' as const,
          shopifyExperience: 'test',
          amazonSellerCentralExperience: 'none' as const,
          excelProficiency: 'basic' as const,
          canvaExperience: 'test',
          learningUnderPressure: 'test',
          conflictingInformation: 'test',
          workMotivation: 'test',
          delayedShipmentScenario: 'test',
          restrictedChemicalScenario: 'test',
          hazmatFreightScenario: 'test',
          customerQuoteScenario: 'test',
          softwareLearningExperience: 'test',
          customerServiceMotivation: ['solving-problems'],
          stressManagement: 'test',
          automationIdeas: 'test',
          b2bLoyaltyFactor: 'personal-service' as const,
          dataAnalysisApproach: 'test',
          idealWorkEnvironment: 'test',
        },
        workExperience: [],
        education: [],
        references: [],
        eligibility: {
          eligibleToWork: true,
          requiresSponsorship: false,
        },
        termsAgreed: true,
        signatureDataUrl: 'test',
      };

      const result = employeeApplicationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('email') || issue.message.includes('email')
        )).toBe(true);
      }
    });

    it('validates phone number format', () => {
      const invalidData = {
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '123', // Invalid phone
          address: '123 Main St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          socialSecurityNumber: '123-45-6789',
          dateOfBirth: '1990-01-01',
          hasDriversLicense: true,
          driversLicenseNumber: '12345678',
          driversLicenseState: 'TX',
          emergencyContactName: 'Jane Doe',
          emergencyContactRelationship: 'Mother',
          emergencyContactPhone: '(555) 987-6543',
          compensationType: 'salary' as const,
          availableStartDate: '2024-01-01',
          hoursAvailable: 'full-time' as const,
          shiftPreference: 'day' as const,
          hasTransportation: true,
          hasBeenConvicted: false,
          hasPreviouslyWorkedHere: false,
        },
        jobPostingId: 1,
        roleAssessment: {
          tmsMyCarrierExperience: 'basic' as const,
          shopifyExperience: 'test',
          amazonSellerCentralExperience: 'none' as const,
          excelProficiency: 'basic' as const,
          canvaExperience: 'test',
          learningUnderPressure: 'test',
          conflictingInformation: 'test',
          workMotivation: 'test',
          delayedShipmentScenario: 'test',
          restrictedChemicalScenario: 'test',
          hazmatFreightScenario: 'test',
          customerQuoteScenario: 'test',
          softwareLearningExperience: 'test',
          customerServiceMotivation: ['solving-problems'],
          stressManagement: 'test',
          automationIdeas: 'test',
          b2bLoyaltyFactor: 'personal-service' as const,
          dataAnalysisApproach: 'test',
          idealWorkEnvironment: 'test',
        },
        workExperience: [],
        education: [],
        references: [],
        eligibility: {
          eligibleToWork: true,
          requiresSponsorship: false,
        },
        termsAgreed: true,
        signatureDataUrl: 'test',
      };

      const result = employeeApplicationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('phone') || issue.message.includes('phone')
        )).toBe(true);
      }
    });

    it('validates SSN format', () => {
      const invalidData = {
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '(555) 123-4567',
          address: '123 Main St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          socialSecurityNumber: '123456789', // Invalid SSN format
          dateOfBirth: '1990-01-01',
          hasDriversLicense: true,
          driversLicenseNumber: '12345678',
          driversLicenseState: 'TX',
          emergencyContactName: 'Jane Doe',
          emergencyContactRelationship: 'Mother',
          emergencyContactPhone: '(555) 987-6543',
          compensationType: 'salary' as const,
          availableStartDate: '2024-01-01',
          hoursAvailable: 'full-time' as const,
          shiftPreference: 'day' as const,
          hasTransportation: true,
          hasBeenConvicted: false,
          hasPreviouslyWorkedHere: false,
        },
        jobPostingId: 1,
        roleAssessment: {
          tmsMyCarrierExperience: 'basic' as const,
          shopifyExperience: 'test',
          amazonSellerCentralExperience: 'none' as const,
          excelProficiency: 'basic' as const,
          canvaExperience: 'test',
          learningUnderPressure: 'test',
          conflictingInformation: 'test',
          workMotivation: 'test',
          delayedShipmentScenario: 'test',
          restrictedChemicalScenario: 'test',
          hazmatFreightScenario: 'test',
          customerQuoteScenario: 'test',
          softwareLearningExperience: 'test',
          customerServiceMotivation: ['solving-problems'],
          stressManagement: 'test',
          automationIdeas: 'test',
          b2bLoyaltyFactor: 'personal-service' as const,
          dataAnalysisApproach: 'test',
          idealWorkEnvironment: 'test',
        },
        workExperience: [],
        education: [],
        references: [],
        eligibility: {
          eligibleToWork: true,
          requiresSponsorship: false,
        },
        termsAgreed: true,
        signatureDataUrl: 'test',
      };

      const result = employeeApplicationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('socialSecurityNumber') || 
          issue.message.includes('SSN') ||
          issue.message.includes('social security')
        )).toBe(true);
      }
    });

    it('validates date formats', () => {
      const invalidData = {
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '(555) 123-4567',
          address: '123 Main St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          socialSecurityNumber: '123-45-6789',
          dateOfBirth: '1990-13-45', // Invalid date
          hasDriversLicense: true,
          driversLicenseNumber: '12345678',
          driversLicenseState: 'TX',
          emergencyContactName: 'Jane Doe',
          emergencyContactRelationship: 'Mother',
          emergencyContactPhone: '(555) 987-6543',
          compensationType: 'salary' as const,
          availableStartDate: '2024-01-01',
          hoursAvailable: 'full-time' as const,
          shiftPreference: 'day' as const,
          hasTransportation: true,
          hasBeenConvicted: false,
          hasPreviouslyWorkedHere: false,
        },
        jobPostingId: 1,
        roleAssessment: {
          tmsMyCarrierExperience: 'basic' as const,
          shopifyExperience: 'test',
          amazonSellerCentralExperience: 'none' as const,
          excelProficiency: 'basic' as const,
          canvaExperience: 'test',
          learningUnderPressure: 'test',
          conflictingInformation: 'test',
          workMotivation: 'test',
          delayedShipmentScenario: 'test',
          restrictedChemicalScenario: 'test',
          hazmatFreightScenario: 'test',
          customerQuoteScenario: 'test',
          softwareLearningExperience: 'test',
          customerServiceMotivation: ['solving-problems'],
          stressManagement: 'test',
          automationIdeas: 'test',
          b2bLoyaltyFactor: 'personal-service' as const,
          dataAnalysisApproach: 'test',
          idealWorkEnvironment: 'test',
        },
        workExperience: [],
        education: [],
        references: [],
        eligibility: {
          eligibleToWork: true,
          requiresSponsorship: false,
        },
        termsAgreed: true,
        signatureDataUrl: 'test',
      };

      const result = employeeApplicationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('dateOfBirth') || 
          issue.message.includes('date')
        )).toBe(true);
      }
    });
  });

  describe('Data Sanitization', () => {
    it('handles null bytes and control characters', () => {
      const maliciousData = {
        personalInfo: {
          firstName: 'John\x00\x01\x02Doe',
          lastName: 'Test\x7F\x80\x81Name',
          email: 'john@example.com',
          phone: '(555) 123-4567',
          address: '123 Main St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          socialSecurityNumber: '123-45-6789',
          dateOfBirth: '1990-01-01',
          hasDriversLicense: true,
          driversLicenseNumber: '12345678',
          driversLicenseState: 'TX',
          emergencyContactName: 'Jane Doe',
          emergencyContactRelationship: 'Mother',
          emergencyContactPhone: '(555) 987-6543',
          compensationType: 'salary' as const,
          availableStartDate: '2024-01-01',
          hoursAvailable: 'full-time' as const,
          shiftPreference: 'day' as const,
          hasTransportation: true,
          hasBeenConvicted: false,
          hasPreviouslyWorkedHere: false,
        },
        jobPostingId: 1,
        roleAssessment: {
          tmsMyCarrierExperience: 'basic' as const,
          shopifyExperience: 'test',
          amazonSellerCentralExperience: 'none' as const,
          excelProficiency: 'basic' as const,
          canvaExperience: 'test',
          learningUnderPressure: 'test',
          conflictingInformation: 'test',
          workMotivation: 'test',
          delayedShipmentScenario: 'test',
          restrictedChemicalScenario: 'test',
          hazmatFreightScenario: 'test',
          customerQuoteScenario: 'test',
          softwareLearningExperience: 'test',
          customerServiceMotivation: ['solving-problems'],
          stressManagement: 'test',
          automationIdeas: 'test',
          b2bLoyaltyFactor: 'personal-service' as const,
          dataAnalysisApproach: 'test',
          idealWorkEnvironment: 'test',
        },
        workExperience: [],
        education: [],
        references: [],
        eligibility: {
          eligibleToWork: true,
          requiresSponsorship: false,
        },
        termsAgreed: true,
        signatureDataUrl: 'test',
      };

      const result = employeeApplicationSchema.safeParse(maliciousData);
      
      if (result.success) {
        // If validation passes, check that control characters are handled
        expect(result.data.personalInfo.firstName).not.toMatch(/[\x00-\x1F\x7F-\x9F]/);
        expect(result.data.personalInfo.lastName).not.toMatch(/[\x00-\x1F\x7F-\x9F]/);
      } else {
        // If validation fails, that's also acceptable for security
        expect(result.success).toBe(false);
      }
    });
  });
});