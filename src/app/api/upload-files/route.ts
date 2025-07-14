import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToS3 } from '@/lib/s3-utils';
import { sendApplicationNotificationEmails } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const applicationData = formData.get('applicationData') as string;
    const resumeFile = formData.get('resumeFile') as File;
    const idFile = formData.get('idFile') as File;
    const pdfDocument = formData.get('pdfDocument') as File;
    const sendEmailCopy = formData.get('sendEmailCopy') === 'true';

    if (!applicationData) {
      return NextResponse.json({ error: 'Application data is required' }, { status: 400 });
    }

    const parsedData = JSON.parse(applicationData);
    const { personalInfo } = parsedData;
    const applicantName = `${personalInfo.firstName}_${personalInfo.lastName}`;
    const applicationDate = new Date().toISOString().split('T')[0];
    const folderName = `${applicantName}_${applicationDate}`;

    const uploadedFiles: Record<string, string> = {};

    // Upload resume if provided
    if (resumeFile) {
      const resumeUrl = await uploadFileToS3(
        resumeFile,
        `applications/${folderName}/resume_${resumeFile.name}`,
        'application/pdf'
      );
      uploadedFiles.resume = resumeUrl;
    }

    // Upload ID photo if provided
    if (idFile) {
      const idUrl = await uploadFileToS3(
        idFile,
        `applications/${folderName}/id_${idFile.name}`,
        idFile.type
      );
      uploadedFiles.id = idUrl;
    }

    // Upload PDF application if provided
    if (pdfDocument) {
      const pdfUrl = await uploadFileToS3(
        pdfDocument,
        `applications/${folderName}/application_${pdfDocument.name}`,
        'application/pdf'
      );
      uploadedFiles.application = pdfUrl;
    }

    // Send email notifications
    try {
      // Send to HR/boss
      // Create a simple notification structure
      const applicationId = Date.now(); // Simple ID for now
      const pdfBuffer = Buffer.from('placeholder pdf content'); // Would need actual PDF generation
      
      await sendApplicationNotificationEmails(
        parsedData,
        applicationId,
        pdfBuffer,
        'Application submitted successfully'
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the entire request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Files uploaded successfully',
      uploadedFiles,
      folderName
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'File upload endpoint' });
}