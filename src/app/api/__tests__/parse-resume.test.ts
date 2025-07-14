import { POST } from '../parse-resume/route';
import { NextRequest } from 'next/server';

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                personalInfo: {
                  firstName: 'John',
                  lastName: 'Doe',
                  email: 'john.doe@example.com',
                  phone: '(555) 123-4567',
                },
                workExperience: [{
                  company: 'Tech Corp',
                  position: 'Software Engineer',
                  startDate: '2020-01',
                  endDate: '2023-12',
                  responsibilities: 'Developed web applications',
                }],
                education: [{
                  institutionName: 'University of Texas',
                  degree: 'Bachelor of Science',
                  fieldOfStudy: 'Computer Science',
                  graduationDate: '2020-05',
                }],
              }),
            },
          }],
        }),
      },
    },
  })),
}));

describe('/api/parse-resume', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully parses a valid PDF resume', async () => {
    const formData = new FormData();
    const pdfFile = new Blob(['%PDF-1.4 fake pdf content'], { type: 'application/pdf' });
    formData.append('file', pdfFile, 'resume.pdf');

    const request = new NextRequest('http://localhost:3000/api/parse-resume', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.personalInfo).toBeDefined();
    expect(data.workExperience).toBeDefined();
    expect(data.education).toBeDefined();
    expect(data.personalInfo.firstName).toBe('John');
    expect(data.personalInfo.lastName).toBe('Doe');
  });

  it('successfully parses a valid DOCX resume', async () => {
    const formData = new FormData();
    const docxFile = new Blob(['fake docx content'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    formData.append('file', docxFile, 'resume.docx');

    const request = new NextRequest('http://localhost:3000/api/parse-resume', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.personalInfo).toBeDefined();
    expect(data.workExperience).toBeDefined();
    expect(data.education).toBeDefined();
  });

  it('rejects invalid file types', async () => {
    const formData = new FormData();
    const invalidFile = new Blob(['invalid content'], { type: 'text/plain' });
    formData.append('file', invalidFile, 'resume.txt');

    const request = new NextRequest('http://localhost:3000/api/parse-resume', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid file type');
  });

  it('rejects files that are too large', async () => {
    const formData = new FormData();
    const largeFile = new Blob(['x'.repeat(11 * 1024 * 1024)], { type: 'application/pdf' });
    formData.append('file', largeFile, 'large-resume.pdf');

    const request = new NextRequest('http://localhost:3000/api/parse-resume', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('File size exceeds limit');
  });

  it('handles missing file', async () => {
    const formData = new FormData();
    // No file attached

    const request = new NextRequest('http://localhost:3000/api/parse-resume', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('No file provided');
  });

  it('handles OpenAI API errors', async () => {
    // Mock OpenAI error
    const { OpenAI } = require('openai');
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('OpenAI API error')),
        },
      },
    }));

    const formData = new FormData();
    const pdfFile = new Blob(['%PDF-1.4 fake pdf content'], { type: 'application/pdf' });
    formData.append('file', pdfFile, 'resume.pdf');

    const request = new NextRequest('http://localhost:3000/api/parse-resume', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed to parse resume');
  });

  it('handles invalid JSON response from OpenAI', async () => {
    // Mock OpenAI with invalid JSON
    const { OpenAI } = require('openai');
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Invalid JSON response',
              },
            }],
          }),
        },
      },
    }));

    const formData = new FormData();
    const pdfFile = new Blob(['%PDF-1.4 fake pdf content'], { type: 'application/pdf' });
    formData.append('file', pdfFile, 'resume.pdf');

    const request = new NextRequest('http://localhost:3000/api/parse-resume', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed to parse resume');
  });

  it('extracts work experience correctly', async () => {
    const formData = new FormData();
    const pdfFile = new Blob(['%PDF-1.4 fake pdf content'], { type: 'application/pdf' });
    formData.append('file', pdfFile, 'resume.pdf');

    const request = new NextRequest('http://localhost:3000/api/parse-resume', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.workExperience).toHaveLength(1);
    expect(data.workExperience[0]).toMatchObject({
      company: 'Tech Corp',
      position: 'Software Engineer',
      startDate: '2020-01',
      endDate: '2023-12',
      responsibilities: 'Developed web applications',
    });
  });

  it('extracts education correctly', async () => {
    const formData = new FormData();
    const pdfFile = new Blob(['%PDF-1.4 fake pdf content'], { type: 'application/pdf' });
    formData.append('file', pdfFile, 'resume.pdf');

    const request = new NextRequest('http://localhost:3000/api/parse-resume', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.education).toHaveLength(1);
    expect(data.education[0]).toMatchObject({
      institutionName: 'University of Texas',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science',
      graduationDate: '2020-05',
    });
  });

  it('extracts personal information correctly', async () => {
    const formData = new FormData();
    const pdfFile = new Blob(['%PDF-1.4 fake pdf content'], { type: 'application/pdf' });
    formData.append('file', pdfFile, 'resume.pdf');

    const request = new NextRequest('http://localhost:3000/api/parse-resume', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.personalInfo).toMatchObject({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
    });
  });
});