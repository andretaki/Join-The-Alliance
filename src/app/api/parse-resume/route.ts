import { NextRequest, NextResponse } from 'next/server';

// Force this API route to be dynamic to prevent static analysis issues
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Detect build-time calls and return early
  const userAgent = request.headers.get('user-agent') || '';
  if (!userAgent || userAgent.includes('Next.js')) {
    return NextResponse.json({ message: 'Build-time call detected' }, { status: 200 });
  }

  try {
    // Dynamic imports to prevent build-time issues
    const { uploadFileToS3 } = await import('@/lib/s3-utils');
    
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

    // Generate unique filename for S3 storage
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `resumes/${timestamp}_${resumeFile.name}`;
    
    // Upload resume to S3
    const resumeUrl = await uploadFileToS3(resumeFile, 1, filename, resumeFile.type, 'resume');

    // Return success with file URL (skip parsing for now)
    return NextResponse.json({
      success: true,
      fileUrl: resumeUrl,
      message: 'Resume uploaded successfully',
      // Return empty parsed data structure for compatibility
      personalInfo: {},
      workExperience: [],
      education: [],
      keywords: []
    });

  } catch (error) {
    console.error('Error uploading resume:', error);
    return NextResponse.json({ 
      error: 'Failed to upload resume' 
    }, { status: 500 });
  }
}

// These functions are no longer needed since we're just saving to S3
// async function extractTextFromFile(file: File): Promise<string> { ... }
// async function parseResumeWithAI(resumeText: string, openai: any, safeJSONParse: any) { ... }