import { POST } from '../employee-applications/route';
import { NextRequest } from 'next/server';
import { generateTestData } from '@/lib/test-data';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue([{ id: 1 }]),
    }),
  },
  applicationsTable: {},
}));

// Mock S3 utilities
jest.mock('@/lib/s3-utils', () => ({
  uploadFileToS3: jest.fn().mockResolvedValue('https://example.com/resume.pdf'),
}));

// Mock email service
jest.mock('@/lib/email-service', () => ({
  sendApplicationNotification: jest.fn().mockResolvedValue(true),
}));

describe('/api/employee-applications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully processes a valid application', async () => {
    const testData = generateTestData();
    const formData = new FormData();
    
    // Add test data to form
    formData.append('applicationData', JSON.stringify(testData));
    formData.append('resumeFile', new Blob(['resume content'], { type: 'application/pdf' }), 'resume.pdf');
    
    const request = new NextRequest('http://localhost:3000/api/employee-applications', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.applicationId).toBeDefined();
  });

  it('validates required fields', async () => {
    const incompleteData = {
      personalInfo: {
        firstName: 'John',
        // Missing required fields
      },
    };
    
    const formData = new FormData();
    formData.append('applicationData', JSON.stringify(incompleteData));
    
    const request = new NextRequest('http://localhost:3000/api/employee-applications', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('handles file upload errors', async () => {
    const testData = generateTestData();
    const formData = new FormData();
    
    formData.append('applicationData', JSON.stringify(testData));
    // Add invalid file
    formData.append('resumeFile', new Blob([''], { type: 'text/plain' }), 'invalid.txt');
    
    const request = new NextRequest('http://localhost:3000/api/employee-applications', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid file type');
  });

  it('handles database errors gracefully', async () => {
    // Mock database error
    const { db } = require('@/lib/db');
    db.insert.mockReturnValue({
      values: jest.fn().mockRejectedValue(new Error('Database error')),
    });

    const testData = generateTestData();
    const formData = new FormData();
    formData.append('applicationData', JSON.stringify(testData));
    
    const request = new NextRequest('http://localhost:3000/api/employee-applications', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Database error');
  });

  it('validates file size limits', async () => {
    const testData = generateTestData();
    const formData = new FormData();
    
    formData.append('applicationData', JSON.stringify(testData));
    // Create a large file (>10MB)
    const largeFile = new Blob(['x'.repeat(11 * 1024 * 1024)], { type: 'application/pdf' });
    formData.append('resumeFile', largeFile, 'large-resume.pdf');
    
    const request = new NextRequest('http://localhost:3000/api/employee-applications', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('File size exceeds limit');
  });

  it('sanitizes input data', async () => {
    const maliciousData = {
      ...generateTestData(),
      personalInfo: {
        ...generateTestData().personalInfo,
        firstName: '<script>alert("xss")</script>',
        email: 'test@example.com<script>',
      },
    };
    
    const formData = new FormData();
    formData.append('applicationData', JSON.stringify(maliciousData));
    
    const request = new NextRequest('http://localhost:3000/api/employee-applications', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Should sanitize the malicious input
    expect(data.applicationData.personalInfo.firstName).not.toContain('<script>');
  });

  it('handles missing application data', async () => {
    const formData = new FormData();
    // Missing applicationData
    
    const request = new NextRequest('http://localhost:3000/api/employee-applications', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Application data is required');
  });

  it('validates email format', async () => {
    const testData = {
      ...generateTestData(),
      personalInfo: {
        ...generateTestData().personalInfo,
        email: 'invalid-email',
      },
    };
    
    const formData = new FormData();
    formData.append('applicationData', JSON.stringify(testData));
    
    const request = new NextRequest('http://localhost:3000/api/employee-applications', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid email format');
  });

  it('validates phone number format', async () => {
    const testData = {
      ...generateTestData(),
      personalInfo: {
        ...generateTestData().personalInfo,
        phone: '123',
      },
    };
    
    const formData = new FormData();
    formData.append('applicationData', JSON.stringify(testData));
    
    const request = new NextRequest('http://localhost:3000/api/employee-applications', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid phone number format');
  });
});