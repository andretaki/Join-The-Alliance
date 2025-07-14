import { jsPDF } from 'jspdf';
import { EmployeeApplicationForm } from './employee-validation';

export interface PDFGenerationOptions {
  includeSignature?: boolean;
  includeResume?: boolean;
  includeIdPhoto?: boolean;
  companyLogo?: string;
}

export class ApplicationPDFGenerator {
  private doc: jsPDF;
  private yPosition: number = 20;
  private pageHeight: number = 280;
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF();
  }

  private addHeader(applicantName: string, position: string) {
    // Add Alliance Chemical logo
    try {
      // Convert logo file to base64 data URL for embedding
      const logoDataUrl = this.getLogoDataUrl();
      if (logoDataUrl) {
        this.doc.addImage(logoDataUrl, 'PNG', this.margin, this.yPosition, 80, 30);
        this.yPosition += 40;
      }
    } catch (error) {
      console.warn('Logo could not be added to PDF:', error);
    }

    this.doc.setFontSize(20);
    this.doc.text('Employment Application', this.margin, this.yPosition);
    this.yPosition += 10;

    this.doc.setFontSize(12);
    this.doc.text('Alliance Chemical', this.margin, this.yPosition);
    this.yPosition += 5;
    
    this.doc.text(`Position: ${position}`, this.margin, this.yPosition);
    this.yPosition += 5;
    
    this.doc.text(`Applicant: ${applicantName}`, this.margin, this.yPosition);
    this.yPosition += 5;
    
    this.doc.text(`Date: ${new Date().toLocaleDateString()}`, this.margin, this.yPosition);
    this.yPosition += 15;
  }

  private checkPageBreak(requiredSpace: number = 20) {
    if (this.yPosition + requiredSpace > this.pageHeight) {
      this.doc.addPage();
      this.yPosition = 20;
    }
  }

  private addSection(title: string, content: Record<string, any>) {
    this.checkPageBreak(30);
    
    this.doc.setFontSize(14);
    this.doc.text(title, this.margin, this.yPosition);
    this.yPosition += 8;

    this.doc.setFontSize(10);
    Object.entries(content).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        this.checkPageBreak(5);
        
        const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
        
        this.doc.text(`${displayKey}: ${displayValue}`, this.margin, this.yPosition);
        this.yPosition += 5;
      }
    });
    
    this.yPosition += 10;
  }

  private addArraySection(title: string, items: any[]) {
    if (!items || items.length === 0) return;

    this.checkPageBreak(30);
    
    this.doc.setFontSize(14);
    this.doc.text(title, this.margin, this.yPosition);
    this.yPosition += 8;

    this.doc.setFontSize(10);
    items.forEach((item, index) => {
      this.checkPageBreak(25);
      
      this.doc.text(`${index + 1}.`, this.margin, this.yPosition);
      this.yPosition += 5;
      
      Object.entries(item).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          this.checkPageBreak(5);
          
          const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
          
          this.doc.text(`  ${displayKey}: ${displayValue}`, this.margin + 5, this.yPosition);
          this.yPosition += 5;
        }
      });
      
      this.yPosition += 5;
    });
    
    this.yPosition += 10;
  }

  private addSignature(signatureDataUrl: string) {
    if (!signatureDataUrl) return;

    this.checkPageBreak(40);
    
    this.doc.setFontSize(12);
    this.doc.text('Digital Signature:', this.margin, this.yPosition);
    this.yPosition += 10;

    try {
      if (signatureDataUrl.startsWith('data:image')) {
        this.doc.addImage(signatureDataUrl, 'PNG', this.margin, this.yPosition, 60, 20);
        this.yPosition += 25;
      } else {
        // Typed signature
        this.doc.setFontSize(18);
        this.doc.setFont('helvetica', 'italic');
        this.doc.text(signatureDataUrl, this.margin, this.yPosition);
        this.doc.setFont('helvetica', 'normal');
        this.yPosition += 15;
      }
    } catch (error) {
      console.error('Error adding signature to PDF:', error);
      this.doc.text('Signature could not be displayed', this.margin, this.yPosition);
      this.yPosition += 15;
    }

    this.doc.setFontSize(10);
    this.doc.text(`Signed on: ${new Date().toLocaleDateString()}`, this.margin, this.yPosition);
    this.yPosition += 5;
  }

  private addIdPhoto(idFile: File) {
    if (!idFile) return;

    return new Promise<void>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imageData = e.target?.result as string;
          this.checkPageBreak(60);
          
          this.doc.setFontSize(12);
          this.doc.text('ID Photo:', this.margin, this.yPosition);
          this.yPosition += 10;
          
          this.doc.addImage(imageData, 'JPEG', this.margin, this.yPosition, 40, 30);
          this.yPosition += 35;
          
          resolve();
        } catch (error) {
          console.error('Error adding ID photo to PDF:', error);
          this.doc.text('ID photo could not be displayed', this.margin, this.yPosition);
          this.yPosition += 15;
          resolve();
        }
      };
      reader.readAsDataURL(idFile);
    });
  }

  public async generateApplicationPDF(
    applicationData: EmployeeApplicationForm,
    options: PDFGenerationOptions = {}
  ): Promise<Blob> {
    const applicantName = `${applicationData.personalInfo.firstName} ${applicationData.personalInfo.lastName}`;
    const position = 'Customer Service Specialist';

    // Add header
    this.addHeader(applicantName, position);

    // Add personal information
    this.addSection('Personal Information', applicationData.personalInfo);

    // Add role assessment
    if (applicationData.roleAssessment) {
      this.addSection('Role Assessment', applicationData.roleAssessment);
    }

    // Add work experience
    if (applicationData.workExperience) {
      this.addArraySection('Work Experience', applicationData.workExperience);
    }

    // Add education
    if (applicationData.education) {
      this.addArraySection('Education', applicationData.education);
    }

    // Add references
    if (applicationData.references) {
      this.addArraySection('References', applicationData.references);
    }

    // Add eligibility information
    if (applicationData.eligibility) {
      this.addSection('Eligibility', applicationData.eligibility);
    }

    // Add signature
    if (options.includeSignature && applicationData.signatureDataUrl) {
      this.addSignature(applicationData.signatureDataUrl);
    }

    // Add footer
    this.checkPageBreak(20);
    this.doc.setFontSize(8);
    this.doc.text('This application was generated electronically and is legally binding.', this.margin, this.yPosition);
    this.yPosition += 5;
    this.doc.text(`Generated on: ${new Date().toISOString()}`, this.margin, this.yPosition);

    return this.doc.output('blob');
  }

  public async generateCompleteApplicationPackage(
    applicationData: EmployeeApplicationForm,
    resumeFile?: File,
    idFile?: File,
    options: PDFGenerationOptions = {}
  ): Promise<Blob> {
    // Generate main application PDF
    const applicationPDF = await this.generateApplicationPDF(applicationData, options);

    // If we have additional files, we'd need to use a PDF library that supports merging
    // For now, return the main application PDF
    return applicationPDF;
  }
}

export async function generateApplicationPDF(
  applicationData: EmployeeApplicationForm,
  options: PDFGenerationOptions = {}
): Promise<Blob> {
  const generator = new ApplicationPDFGenerator();
  return generator.generateApplicationPDF(applicationData, options);
}

export async function generateCompleteApplicationPackage(
  applicationData: EmployeeApplicationForm,
  resumeFile?: File,
  idFile?: File,
  options: PDFGenerationOptions = {}
): Promise<Blob> {
  const generator = new ApplicationPDFGenerator();
  return generator.generateCompleteApplicationPackage(applicationData, resumeFile, idFile, options);
}