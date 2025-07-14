import { EmployeeApplicationForm } from './employee-validation';

export interface AISummaryResult {
  success: boolean;
  summary?: string;
  error?: string;
}

/**
 * Generate AI summary of employee application
 */
export async function generateApplicationSummary(
  applicationData: EmployeeApplicationForm,
  applicationId: number
): Promise<AISummaryResult> {
  try {
    // Prepare the application data for AI analysis
    const applicationText = prepareApplicationText(applicationData);
    
    // Temporarily disabled - AI chat endpoint not available
    console.log('🤖 AI Application Summary disabled - would analyze application data');
    return 'Application summary temporarily unavailable - all required data has been collected and stored successfully.';

    const prompt = `
You are an HR professional reviewing an employee application. Please provide a comprehensive summary of the candidate's qualifications, experience, and suitability for the Customer Service Specialist position at Alliance Chemical.

Focus on:
1. Overall qualifications and experience
2. Technical skills relevant to the role (TMS, Shopify, Amazon, Excel, etc.)
3. Assessment responses and problem-solving approach
4. Strengths and potential areas of concern
5. Fit for the chemical industry and customer service role
6. Work history and education relevance
7. Professional references quality

Application Data:
${applicationText}

Please provide a detailed but concise summary (300-500 words) that would help HR make an informed decision.
    `;

    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR professional specializing in candidate evaluation and assessment.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`AI API call failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.response || !data.response.trim()) {
      throw new Error('Empty response from AI');
    }

    return {
      success: true,
      summary: data.response.trim()
    };

  } catch (error) {
    console.error('Error generating AI summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Prepare application data as text for AI analysis
 */
function prepareApplicationText(applicationData: EmployeeApplicationForm): string {
  const sections: string[] = [];

  // Personal Information
  sections.push('PERSONAL INFORMATION:');
  sections.push(`Name: ${applicationData.personalInfo.firstName} ${applicationData.personalInfo.lastName}`);
  sections.push(`Email: ${applicationData.personalInfo.email}`);
  sections.push(`Phone: ${applicationData.personalInfo.phone}`);
  sections.push(`Location: ${applicationData.personalInfo.city}, ${applicationData.personalInfo.state}`);
  sections.push(`Available Start Date: ${applicationData.personalInfo.availableStartDate}`);
  sections.push(`Hours Available: ${applicationData.personalInfo.hoursAvailable}`);
  sections.push(`Shift Preference: ${applicationData.personalInfo.shiftPreference}`);
  sections.push(`Has Transportation: ${applicationData.personalInfo.hasTransportation ? 'Yes' : 'No'}`);

  // Work Experience
  if (applicationData.workExperience && applicationData.workExperience.length > 0) {
    sections.push('\nWORK EXPERIENCE:');
    applicationData.workExperience.forEach((work, index) => {
      sections.push(`${index + 1}. ${work.jobTitle} at ${work.companyName}`);
      sections.push(`   Duration: ${work.startDate} - ${work.isCurrent ? 'Present' : work.endDate}`);
      sections.push(`   Responsibilities: ${work.responsibilities}`);
      sections.push(`   Reason for Leaving: ${work.reasonForLeaving}`);
    });
  }

  // Education
  if (applicationData.education && applicationData.education.length > 0) {
    sections.push('\nEDUCATION:');
    applicationData.education.forEach((edu, index) => {
      sections.push(`${index + 1}. ${edu.degreeType} in ${edu.fieldOfStudy}`);
      sections.push(`   Institution: ${edu.institutionName}`);
      sections.push(`   Graduation: ${edu.graduationDate}`);
      sections.push(`   GPA: ${edu.gpa || 'Not provided'}`);
    });
  }

  // Role Assessment
  if (applicationData.roleAssessment) {
    sections.push('\nROLE ASSESSMENT:');
    
    // Technical Skills
    sections.push('Technical Skills:');
    sections.push(`- TMS MyCarrier Experience: ${applicationData.roleAssessment.tmsMyCarrierExperience || 'Not provided'}`);
    sections.push(`- Shopify Experience: ${applicationData.roleAssessment.shopifyExperience || 'Not provided'}`);
    sections.push(`- Amazon Seller Central Experience: ${applicationData.roleAssessment.amazonSellerCentralExperience || 'Not provided'}`);
    sections.push(`- Excel Proficiency: ${applicationData.roleAssessment.excelProficiency || 'Not provided'}`);
    sections.push(`- Canva Experience: ${applicationData.roleAssessment.canvaExperience || 'Not provided'}`);
    
    // Scenario Responses
    sections.push('\nScenario Responses:');
    if (applicationData.roleAssessment.learningUnderPressure) {
      sections.push(`Learning Under Pressure: ${applicationData.roleAssessment.learningUnderPressure}`);
    }
    if (applicationData.roleAssessment.conflictingInformation) {
      sections.push(`Handling Conflicting Information: ${applicationData.roleAssessment.conflictingInformation}`);
    }
    if (applicationData.roleAssessment.workMotivation) {
      sections.push(`Work Motivation: ${applicationData.roleAssessment.workMotivation}`);
    }
    if (applicationData.roleAssessment.delayedShipmentScenario) {
      sections.push(`Delayed Shipment Scenario: ${applicationData.roleAssessment.delayedShipmentScenario}`);
    }
    if (applicationData.roleAssessment.restrictedChemicalScenario) {
      sections.push(`Restricted Chemical Scenario: ${applicationData.roleAssessment.restrictedChemicalScenario}`);
    }
    if (applicationData.roleAssessment.hazmatFreightScenario) {
      sections.push(`Hazmat Freight Scenario: ${applicationData.roleAssessment.hazmatFreightScenario}`);
    }
    if (applicationData.roleAssessment.customerQuoteScenario) {
      sections.push(`Customer Quote Scenario: ${applicationData.roleAssessment.customerQuoteScenario}`);
    }
    if (applicationData.roleAssessment.stressManagement) {
      sections.push(`Stress Management: ${applicationData.roleAssessment.stressManagement}`);
    }
    if (applicationData.roleAssessment.automationIdeas) {
      sections.push(`Automation Ideas: ${applicationData.roleAssessment.automationIdeas}`);
    }
    if (applicationData.roleAssessment.dataAnalysisApproach) {
      sections.push(`Data Analysis Approach: ${applicationData.roleAssessment.dataAnalysisApproach}`);
    }
    if (applicationData.roleAssessment.idealWorkEnvironment) {
      sections.push(`Ideal Work Environment: ${applicationData.roleAssessment.idealWorkEnvironment}`);
    }
    
    if (applicationData.roleAssessment.customerServiceMotivation && applicationData.roleAssessment.customerServiceMotivation.length > 0) {
      sections.push(`Customer Service Motivation: ${applicationData.roleAssessment.customerServiceMotivation.join(', ')}`);
    }
    
    if (applicationData.roleAssessment.b2bLoyaltyFactor) {
      sections.push(`B2B Loyalty Factor: ${applicationData.roleAssessment.b2bLoyaltyFactor}`);
    }
  }

  // References
  if (applicationData.references && applicationData.references.length > 0) {
    sections.push('\nREFERENCES:');
    applicationData.references.forEach((ref, index) => {
      sections.push(`${index + 1}. ${ref.name} - ${ref.relationship}`);
      sections.push(`   Company: ${ref.company}`);
      sections.push(`   Contact: ${ref.phone} / ${ref.email}`);
      sections.push(`   Years Known: ${ref.yearsKnown || 'Not provided'}`);
    });
  }

  // Eligibility and Consents
  sections.push('\nELIGIBILITY & CONSENTS:');
  sections.push(`Eligible to Work: ${applicationData.eligibility.eligibleToWork ? 'Yes' : 'No'}`);
  sections.push(`Requires Sponsorship: ${applicationData.eligibility.requiresSponsorship ? 'Yes' : 'No'}`);
  sections.push(`Background Check Consent: ${applicationData.eligibility.consentToBackgroundCheck ? 'Yes' : 'No'}`);
  sections.push(`Drug Test Consent: ${applicationData.eligibility.consentToDrugTest ? 'Yes' : 'No'}`);
  sections.push(`Has Hazmat Experience: ${applicationData.eligibility.hasHazmatExperience ? 'Yes' : 'No'}`);
  sections.push(`Has Forklift Certification: ${applicationData.eligibility.hasForkliftCertification ? 'Yes' : 'No'}`);
  sections.push(`Has Chemical Handling Experience: ${applicationData.eligibility.hasChemicalHandlingExperience ? 'Yes' : 'No'}`);
  sections.push(`Willing to Obtain Certifications: ${applicationData.eligibility.willingToObtainCertifications ? 'Yes' : 'No'}`);

  return sections.join('\n');
}

/**
 * Generate a quick summary for email notifications
 */
export async function generateQuickSummary(
  applicationData: EmployeeApplicationForm,
  applicationId: number
): Promise<AISummaryResult> {
  try {
    const applicationText = prepareApplicationText(applicationData);
    
    const prompt = `
Provide a brief summary (2-3 sentences) of this job application for a Customer Service Specialist position at Alliance Chemical:

${applicationText}

Focus on the candidate's name, key qualifications, and overall fit for the role.
    `;

    // Temporarily disabled - AI chat endpoint not available
    console.log('🤖 AI Quick Summary disabled - using fallback');
    return `Quick summary temporarily unavailable for ${applicationData.personalInfo?.firstName || 'candidate'}.`;

    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an HR assistant providing brief candidate summaries.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error(`AI API call failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.response || !data.response.trim()) {
      throw new Error('Empty response from AI');
    }

    return {
      success: true,
      summary: data.response.trim()
    };

  } catch (error) {
    console.error('Error generating quick summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 