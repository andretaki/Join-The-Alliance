import { NextRequest, NextResponse } from 'next/server';

// Force this API route to be dynamic to prevent static analysis issues
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Detect build-time calls and return early
  // During build, the request doesn't have a proper user agent
  const userAgent = request.headers.get('user-agent') || '';
  if (!userAgent || userAgent.includes('Next.js')) {
    return NextResponse.json({ message: 'Build-time call detected' }, { status: 200 });
  }

  try {
    // Dynamic imports to prevent build-time issues
    const { OpenAI } = await import('openai');
    const { safeJSONParse } = await import('@/lib/safe-json');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Handle build-time errors gracefully
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (formDataError) {
      console.warn('Failed to parse form data (likely build-time call):', formDataError);
      return NextResponse.json(
        { error: 'Invalid form data' },
        { status: 400 }
      );
    }

    const resumeFile = formData.get('resume') as File;

    if (!resumeFile) {
      return NextResponse.json({ error: 'Resume file is required' }, { status: 400 });
    }

    // Extract text from resume file
    const resumeText = await extractTextFromFile(resumeFile);

    // Use OpenAI to parse the resume
    const parsedData = await parseResumeWithAI(resumeText, openai, safeJSONParse);

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

async function parseResumeWithAI(resumeText: string, openai: any, safeJSONParse: any) {
  // Truncate resume text to prevent token limit issues
  const maxResumeLength = 50000; // Limit to ~50k characters
  const truncatedText = resumeText.length > maxResumeLength 
    ? resumeText.substring(0, maxResumeLength) + "\n\n[Text truncated due to length]"
    : resumeText;

  const prompt = `Parse this resume and return JSON with: personalInfo{firstName,lastName,email,phone,address,city,state,zipCode}, workExperience[{companyName,jobTitle,startDate,endDate,isCurrent,responsibilities}], education[{institutionName,degreeType,fieldOfStudy,graduationDate,isCompleted}], keywords[].

Resume: ${truncatedText}`;

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

  return safeJSONParse(content, {
    personalInfo: {},
    workExperience: [],
    education: []
  });
}