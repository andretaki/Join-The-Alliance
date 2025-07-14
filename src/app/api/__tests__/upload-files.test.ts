import { POST } from '../upload-files/route';
import { NextRequest } from 'next/server';
import { generateTestData } from '@/lib/test-data';

// Mock S3 utilities
jest.mock('../../../lib/s3-utils', () => ({
  uploadFileToS3: jest.fn().mockResolvedValue('https://example.com/file.pdf'),
}));

// Mock email service
jest.mock('../../../lib/email-service', () => ({
  sendApplicationNotification: jest.fn().mockResolvedValue(true),
}));

describe('/api/upload-files', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully uploads files with proper organization', async () => {
    const testData = generateTestData();
    const formData = new FormData();
    
    formData.append('applicationData', JSON.stringify(testData));
    formData.append('resumeFile', new Blob(['resume content'], { type: 'application/pdf' }), 'resume.pdf');
    formData.append('idFile', new Blob(['id content'], { type: 'image/jpeg' }), 'id.jpg');
    formData.append('pdfDocument', new Blob(['pdf content'], { type: 'application/pdf' }), 'application.pdf');
    formData.append('sendEmailCopy', 'true');
    
    const request = new NextRequest('http://localhost:3000/api/upload-files', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.uploadedFiles).toBeDefined();
    expect(data.folderName).toMatch(/John_Doe_\d{4}-\d{2}-\d{2}/);
  });

  it('creates proper folder structure', async () => {
    const testData = generateTestData();
    const formData = new FormData();
    
    formData.append('applicationData', JSON.stringify(testData));
    formData.append('resumeFile', new Blob(['resume content'], { type: 'application/pdf' }), 'resume.pdf');
    
    const request = new NextRequest('http://localhost:3000/api/upload-files', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    const { uploadFileToS3 } = require('@/lib/s3-utils');
    expect(uploadFileToS3).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.stringMatching(/applications\/John_Doe_\d{4}-\d{2}-\d{2}\/resume_resume\.pdf/),
      'application/pdf'
    );
  });

  it('handles missing application data', async () => {
    const formData = new FormData();
    formData.append('resumeFile', new Blob(['resume content'], { type: 'application/pdf' }), 'resume.pdf');
    
    const request = new NextRequest('http://localhost:3000/api/upload-files', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Application data is required');
  });

  it('sends email notifications correctly', async () => {
    const testData = generateTestData();
    const formData = new FormData();
    
    formData.append('applicationData', JSON.stringify(testData));
    formData.append('resumeFile', new Blob(['resume content'], { type: 'application/pdf' }), 'resume.pdf');
    formData.append('sendEmailCopy', 'true');
    
    const request = new NextRequest('http://localhost:3000/api/upload-files', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    
    const { sendApplicationNotification } = require('@/lib/email-service');
    expect(sendApplicationNotification).toHaveBeenCalledTimes(2); // HR and applicant copy
    
    // Check HR notification
    expect(sendApplicationNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        applicantName: 'John Doe',
        applicantEmail: 'john.doe@email.com',
        position: 'Customer Service Specialist',
        recipientEmail: expect.any(String),
      })
    );
    
    // Check applicant copy
    expect(sendApplicationNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        applicantName: 'John Doe',
        applicantEmail: 'john.doe@email.com',
        position: 'Customer Service Specialist',
        recipientEmail: 'john.doe@email.com',
        isApplicantCopy: true,
      })
    );
  });

  it('handles email sending errors gracefully', async () => {
    const testData = generateTestData();
    const formData = new FormData();
    
    formData.append('applicationData', JSON.stringify(testData));
    formData.append('resumeFile', new Blob(['resume content'], { type: 'application/pdf' }), 'resume.pdf');
    
    // Mock email service to throw error
    const { sendApplicationNotification } = require('@/lib/email-service');
    sendApplicationNotification.mockRejectedValue(new Error('Email service error'));
    
    const request = new NextRequest('http://localhost:3000/api/upload-files', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    // Should still succeed even if email fails
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('handles S3 upload errors', async () => {
    const testData = generateTestData();
    const formData = new FormData();
    
    formData.append('applicationData', JSON.stringify(testData));
    formData.append('resumeFile', new Blob(['resume content'], { type: 'application/pdf' }), 'resume.pdf');
    
    // Mock S3 service to throw error
    const { uploadFileToS3 } = require('@/lib/s3-utils');
    uploadFileToS3.mockRejectedValue(new Error('S3 upload error'));
    
    const request = new NextRequest('http://localhost:3000/api/upload-files', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to upload files');
  });

  it('handles multiple file types correctly', async () => {
    const testData = generateTestData();
    const formData = new FormData();
    
    formData.append('applicationData', JSON.stringify(testData));
    formData.append('resumeFile', new Blob(['resume content'], { type: 'application/pdf' }), 'resume.pdf');
    formData.append('idFile', new Blob(['id content'], { type: 'image/jpeg' }), 'id.jpg');
    formData.append('pdfDocument', new Blob(['pdf content'], { type: 'application/pdf' }), 'application.pdf');
    
    const request = new NextRequest('http://localhost:3000/api/upload-files', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.uploadedFiles).toHaveProperty('resume');
    expect(data.uploadedFiles).toHaveProperty('id');
    expect(data.uploadedFiles).toHaveProperty('application');
  });

  it('works without optional files', async () => {
    const testData = generateTestData();
    const formData = new FormData();
    
    formData.append('applicationData', JSON.stringify(testData));
    // Only required data, no files
    
    const request = new NextRequest('http://localhost:3000/api/upload-files', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.uploadedFiles).toEqual({});
  });

  it('respects email copy preference', async () => {
    const testData = generateTestData();
    const formData = new FormData();
    
    formData.append('applicationData', JSON.stringify(testData));
    formData.append('resumeFile', new Blob(['resume content'], { type: 'application/pdf' }), 'resume.pdf');
    formData.append('sendEmailCopy', 'false');
    
    const request = new NextRequest('http://localhost:3000/api/upload-files', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    
    const { sendApplicationNotification } = require('@/lib/email-service');
    expect(sendApplicationNotification).toHaveBeenCalledTimes(1); // Only HR notification
  });

  it('handles malformed JSON application data', async () => {
    const formData = new FormData();
    formData.append('applicationData', 'invalid json');
    
    const request = new NextRequest('http://localhost:3000/api/upload-files', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to upload files');
  });
});