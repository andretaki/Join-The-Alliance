import { jsPDF } from 'jspdf';
import { EmployeeApplicationForm } from './employee-validation';
import * as fs from 'fs';
import * as path from 'path';

export interface PDFGenerationResult {
  success: boolean;
  buffer?: Buffer;
  error?: string;
}

/**
 * Load logo file and convert to base64 data URL
 */
function loadLogoBase64(): string | null {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'WIDE - Color on Transparent _RGB-01.png');
    
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const base64Logo = logoBuffer.toString('base64');
      return `data:image/png;base64,${base64Logo}`;
    }
    
    return null;
  } catch (error) {
    console.error('Error loading logo:', error);
    return null;
  }
}

/**
 * Generate a comprehensive PDF of the employee application
 */
export function generateEmployeeApplicationPDF(
  applicationData: EmployeeApplicationForm,
  applicationId: number,
  submissionDate: Date = new Date()
): PDFGenerationResult {
  try {
    // Create PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const maxWidth = pageWidth - 2 * margin;
    let currentY = margin;

    // Helper function to add text with automatic page break
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
      if (currentY > pageHeight - margin - 20) {
        pdf.addPage();
        currentY = margin;
      }
      
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, margin, currentY);
      currentY += (lines.length * fontSize * 1.2) + 5;
    };

    // Helper function to add section header
    const addSectionHeader = (title: string) => {
      currentY += 10;
      addText(title, 14, true);
      currentY += 5;
    };

    // Helper function to add field
    const addField = (label: string, value: string | number | boolean | undefined | null) => {
      if (value === undefined || value === null || value === '') return;
      
      const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
      addText(`${label}: ${displayValue}`, 10, false);
    };

    // Add Alliance Chemical logo
    try {
      const logoDataUrl = loadLogoBase64();
      if (logoDataUrl) {
        // Add logo image
        pdf.addImage(logoDataUrl, 'PNG', margin, currentY, 120, 45);
        currentY += 55;
      } else {
        // Fallback to text if logo can't be loaded
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Alliance Chemical', margin, currentY);
        currentY += 20;
      }
    } catch (error) {
      console.warn('Logo could not be added to PDF:', error);
      // Fallback to text
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Alliance Chemical', margin, currentY);
      currentY += 20;
    }

    // Document header
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Employee Application', margin, currentY);
    currentY += 30;

    // Application info
    addText(`Application ID: ${applicationId}`, 12, true);
    addText(`Submitted: ${submissionDate.toLocaleDateString()} at ${submissionDate.toLocaleTimeString()}`, 12, false);
    currentY += 15;

    // Personal Information
    addSectionHeader('Personal Information');
    addField('Name', `${applicationData.personalInfo.firstName} ${applicationData.personalInfo.middleName || ''} ${applicationData.personalInfo.lastName}`.trim());
    addField('Email', applicationData.personalInfo.email);
    addField('Phone', applicationData.personalInfo.phone);
    addField('Address', `${applicationData.personalInfo.address}, ${applicationData.personalInfo.city}, ${applicationData.personalInfo.state} ${applicationData.personalInfo.zipCode}`);
    addField('Date of Birth', applicationData.personalInfo.dateOfBirth);
    addField('Social Security Number', applicationData.personalInfo.socialSecurityNumber);
    addField('Driver\'s License', applicationData.personalInfo.hasDriversLicense ? 
      `${applicationData.personalInfo.driversLicenseNumber} (${applicationData.personalInfo.driversLicenseState})` : 'No');

    // Emergency Contact
    addSectionHeader('Emergency Contact');
    addField('Name', applicationData.personalInfo.emergencyContactName);
    addField('Relationship', applicationData.personalInfo.emergencyContactRelationship);
    addField('Phone', applicationData.personalInfo.emergencyContactPhone);

    // Employment Preferences
    addSectionHeader('Employment Preferences');
    addField('Position Applied For', getJobTitle(applicationData.jobPostingId));
    addField('Compensation Type', applicationData.personalInfo.compensationType);
    addField('Desired Salary', applicationData.personalInfo.desiredSalary);
    addField('Desired Hourly Rate', applicationData.personalInfo.desiredHourlyRate);
    addField('Available Start Date', applicationData.personalInfo.availableStartDate);
    addField('Hours Available', applicationData.personalInfo.hoursAvailable);
    addField('Shift Preference', applicationData.personalInfo.shiftPreference);
    addField('Has Transportation', applicationData.personalInfo.hasTransportation);

    // Work Experience
    if (applicationData.workExperience && applicationData.workExperience.length > 0) {
      addSectionHeader('Work Experience');
      applicationData.workExperience.forEach((work, index) => {
        addText(`${index + 1}. ${work.jobTitle} at ${work.companyName}`, 12, true);
        addField('  Duration', `${work.startDate} - ${work.isCurrent ? 'Present' : work.endDate}`);
        addField('  Responsibilities', work.responsibilities);
        addField('  Reason for Leaving', work.reasonForLeaving);
        addField('  Supervisor', `${work.supervisorName} (${work.supervisorContact})`);
        currentY += 10;
      });
    }

    // Education
    if (applicationData.education && applicationData.education.length > 0) {
      addSectionHeader('Education');
      applicationData.education.forEach((edu, index) => {
        addText(`${index + 1}. ${edu.degreeType} in ${edu.fieldOfStudy}`, 12, true);
        addField('  Institution', edu.institutionName);
        addField('  Graduation Date', edu.graduationDate);
        addField('  GPA', edu.gpa);
        addField('  Completed', edu.isCompleted);
        currentY += 10;
      });
    }

    // References
    if (applicationData.references && applicationData.references.length > 0) {
      addSectionHeader('References');
      applicationData.references.forEach((ref, index) => {
        addText(`${index + 1}. ${ref.name}`, 12, true);
        addField('  Relationship', ref.relationship);
        addField('  Company', ref.company);
        addField('  Phone', ref.phone);
        addField('  Email', ref.email);
        addField('  Years Known', ref.yearsKnown);
        currentY += 10;
      });
    }

    // Role Assessment (if available)
    if (applicationData.roleAssessment) {
      addSectionHeader('Role Assessment Responses');
      
      // Technical Experience
      addField('TMS MyCarrier Experience', applicationData.roleAssessment.tmsMyCarrierExperience);
      addField('Shopify Experience', applicationData.roleAssessment.shopifyExperience);
      addField('Amazon Seller Central Experience', applicationData.roleAssessment.amazonSellerCentralExperience);
      addField('Excel Proficiency', applicationData.roleAssessment.excelProficiency);
      addField('Canva Experience', applicationData.roleAssessment.canvaExperience);
      
      // Scenario Responses
      addField('Learning Under Pressure', applicationData.roleAssessment.learningUnderPressure);
      addField('Handling Conflicting Information', applicationData.roleAssessment.conflictingInformation);
      addField('Work Motivation', applicationData.roleAssessment.workMotivation);
      addField('Delayed Shipment Scenario', applicationData.roleAssessment.delayedShipmentScenario);
      addField('Hazmat Freight Scenario', applicationData.roleAssessment.hazmatFreightScenario);
      addField('Customer Quote Scenario', applicationData.roleAssessment.customerQuoteScenario);
      addField('Software Learning Experience', applicationData.roleAssessment.softwareLearningExperience);
      addField('Stress Management', applicationData.roleAssessment.stressManagement);
      addField('Automation Ideas', applicationData.roleAssessment.automationIdeas);
      addField('B2B Loyalty Factor', applicationData.roleAssessment.b2bLoyaltyFactor);
      addField('Data Analysis Approach', applicationData.roleAssessment.dataAnalysisApproach);
      addField('Ideal Work Environment', applicationData.roleAssessment.idealWorkEnvironment);
      
      if (applicationData.roleAssessment.customerServiceMotivation && applicationData.roleAssessment.customerServiceMotivation.length > 0) {
        addField('Customer Service Motivation', applicationData.roleAssessment.customerServiceMotivation.join(', '));
      }
    }

    // Eligibility and Consents
    addSectionHeader('Eligibility and Consents');
    addField('Eligible to Work in US', applicationData.eligibility.eligibleToWork);
    addField('Requires Sponsorship', applicationData.eligibility.requiresSponsorship);
    addField('Consent to Background Check', applicationData.eligibility.consentToBackgroundCheck);
    addField('Consent to Drug Test', applicationData.eligibility.consentToDrugTest);
    addField('Consent to Reference Check', applicationData.eligibility.consentToReferenceCheck);
    addField('Consent to Employment Verification', applicationData.eligibility.consentToEmploymentVerification);
    addField('Has Valid I-9 Documents', applicationData.eligibility.hasValidI9Documents);
    addField('Has Hazmat Experience', applicationData.eligibility.hasHazmatExperience);
    addField('Has Forklift Certification', applicationData.eligibility.hasForkliftCertification);
    addField('Has Chemical Handling Experience', applicationData.eligibility.hasChemicalHandlingExperience);
    addField('Willing to Obtain Certifications', applicationData.eligibility.willingToObtainCertifications);

    // Additional Information
    addField('Has Been Convicted', applicationData.personalInfo.hasBeenConvicted);
    addField('Previously Worked Here', applicationData.personalInfo.hasPreviouslyWorkedHere);

    // Digital Signature
    addSectionHeader('Digital Signature');
    
    // Add actual signature if available
    if (applicationData.signatureDataUrl) {
      try {
        if (applicationData.signatureDataUrl.startsWith('data:image')) {
          // It's a drawn signature (image)
          if (currentY > pageHeight - margin - 60) {
            pdf.addPage();
            currentY = margin;
          }
          
          // Add signature image
          pdf.addImage(applicationData.signatureDataUrl, 'PNG', margin, currentY, 120, 40);
          currentY += 50;
          
          addText(`Digitally signed on: ${new Date().toLocaleDateString()}`, 10, false);
        } else {
          // It's a typed signature
          addText(`Digital Signature: ${applicationData.signatureDataUrl}`, 12, true);
          addText(`Signed on: ${new Date().toLocaleDateString()}`, 10, false);
        }
      } catch (error) {
        console.error('Error adding signature to PDF:', error);
        addText('Digital signature could not be displayed', 10, false);
      }
    } else {
      addText('Application digitally signed and submitted.', 10, false);
    }
    
    addText('Terms and conditions accepted.', 10, false);

    // Footer
    currentY = pageHeight - margin;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text('This document was generated electronically and contains confidential information.', margin, currentY);

    // Convert to buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    return {
      success: true,
      buffer: pdfBuffer
    };

  } catch (error) {
    console.error('Error generating PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get job title by ID
 */
function getJobTitle(jobPostingId: number): string {
  // Based on the schema, there's only one job posting (Customer Service Specialist)
  switch (jobPostingId) {
    case 1:
      return 'Customer Service Specialist';
    default:
      return 'Unknown Position';
  }
}

/**
 * Generate a quick PDF summary
 */
export function generateApplicationSummaryPDF(
  applicationData: EmployeeApplicationForm,
  applicationId: number,
  aiSummary?: string
): PDFGenerationResult {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 40;
    const maxWidth = pageWidth - 2 * margin;
    let currentY = margin;

    // Header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Employee Application Summary', margin, currentY);
    currentY += 40;

    // Basic info
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Application ID: ${applicationId}`, margin, currentY);
    currentY += 20;
    pdf.text(`Applicant: ${applicationData.personalInfo.firstName} ${applicationData.personalInfo.lastName}`, margin, currentY);
    currentY += 15;
    pdf.text(`Email: ${applicationData.personalInfo.email}`, margin, currentY);
    currentY += 15;
    pdf.text(`Phone: ${applicationData.personalInfo.phone}`, margin, currentY);
    currentY += 15;
    pdf.text(`Position: ${getJobTitle(applicationData.jobPostingId)}`, margin, currentY);
    currentY += 30;

    // AI Summary
    if (aiSummary) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AI Summary', margin, currentY);
      currentY += 20;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const summaryLines = pdf.splitTextToSize(aiSummary, maxWidth);
      pdf.text(summaryLines, margin, currentY);
    }

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    return {
      success: true,
      buffer: pdfBuffer
    };

  } catch (error) {
    console.error('Error generating summary PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 