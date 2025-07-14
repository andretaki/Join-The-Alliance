import { ApplicationPDFGenerator } from '../pdf-application-generator';
import { generateTestData } from '../test-data';

// Mock jsPDF
jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    text: jest.fn(),
    addPage: jest.fn(),
    setFont: jest.fn(),
    addImage: jest.fn(),
    output: jest.fn().mockReturnValue(new Blob(['pdf content'], { type: 'application/pdf' })),
  })),
}));

describe('PDF Generator Simple Tests', () => {
  it('creates a PDF generator instance', () => {
    const generator = new ApplicationPDFGenerator();
    expect(generator).toBeInstanceOf(ApplicationPDFGenerator);
  });

  it('generates a PDF blob', async () => {
    const testData = generateTestData();
    const generator = new ApplicationPDFGenerator();
    
    const result = await generator.generateApplicationPDF(testData);
    
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('application/pdf');
  });

  it('handles missing data gracefully', async () => {
    const incompleteData = {
      ...generateTestData(),
      workExperience: [],
      education: [],
      references: [],
    };
    
    const generator = new ApplicationPDFGenerator();
    
    const result = await generator.generateApplicationPDF(incompleteData);
    
    expect(result).toBeInstanceOf(Blob);
  });

  it('handles signature data', async () => {
    const testData = {
      ...generateTestData(),
      signatureDataUrl: 'John Doe',
    };
    
    const generator = new ApplicationPDFGenerator();
    
    const result = await generator.generateApplicationPDF(testData, { includeSignature: true });
    
    expect(result).toBeInstanceOf(Blob);
  });
});