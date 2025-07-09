import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const resumeFile = formData.get('resume') as File;

    if (!resumeFile) {
      return NextResponse.json({ error: 'Resume file is required' }, { status: 400 });
    }

    // Extract text from resume file
    const resumeText = await extractTextFromFile(resumeFile);

    // Use OpenAI to parse the resume
    const parsedData = await parseResumeWithAI(resumeText);

    return NextResponse.json(parsedData);

  } catch (error) {
    console.error('Error parsing resume:', error);
    return NextResponse.json({ 
      error: 'Failed to parse resume' 
    }, { status: 500 });
  }
}

async function extractTextFromFile(file: File): Promise<string> {
  // In a real application, you would use a proper PDF/DOC parser
  // For now, we'll simulate text extraction
  const buffer = await file.arrayBuffer();
  const text = new TextDecoder().decode(buffer);
  
  // This is a simplified version - in production you'd use:
  // - PDF.js for PDF files
  // - mammoth.js for DOCX files  
  // - A proper text extraction service
  
  return text;
}

async function parseResumeWithAI(resumeText: string) {
  const prompt = `
    Parse the following resume and extract structured information. Return a JSON object with the following structure:

    {
      "personalInfo": {
        "firstName": "string",
        "lastName": "string", 
        "email": "string",
        "phone": "string",
        "address": "string",
        "city": "string",
        "state": "string",
        "zipCode": "string"
      },
      "workExperience": [
        {
          "companyName": "string",
          "jobTitle": "string",
          "startDate": "YYYY-MM",
          "endDate": "YYYY-MM or null if current",
          "isCurrent": boolean,
          "responsibilities": "string"
        }
      ],
      "education": [
        {
          "institutionName": "string",
          "degreeType": "High School|Associate|Bachelor|Master|PhD|Certificate|Other",
          "fieldOfStudy": "string",
          "graduationDate": "YYYY-MM",
          "isCompleted": boolean
        }
      ],
      "keywords": ["array of relevant keywords found in resume"]
    }

    Resume text:
    ${resumeText}
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that extracts structured information from resumes. Always return valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.1,
    max_tokens: 2000
  });

  const content = response.choices[0].message.content;
  
  if (!content) {
    throw new Error('No response from AI');
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', content);
    throw new Error('Invalid response format from AI');
  }
}