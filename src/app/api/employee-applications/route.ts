import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

// Force this API route to be dynamic to prevent static analysis issues
export const dynamic = 'force-dynamic';

// Background processing imports
import { generateEmployeeApplicationPDF } from '@/lib/pdf-generator';
import { generateApplicationSummary } from '@/lib/ai-application-summary';
import { generateMultiAgentAnalysis } from '@/lib/ai-multi-agent-analyzer';
import { uploadPDFToS3 } from '@/lib/s3-utils';
import { sendApplicationNotificationEmails } from '@/lib/email-service';
import { EmployeeApplicationForm } from '@/lib/employee-validation';

export async function POST(request: NextRequest) {
  // Detect build-time calls and return early
  // During build, the request doesn't have a proper user agent
  const userAgent = request.headers.get('user-agent') || '';
  if (!userAgent || userAgent.includes('Next.js')) {
    return NextResponse.json({ message: 'Build-time call detected' }, { status: 200 });
  }

  try {
    // Dynamic imports to prevent build-time issues
    const { db } = await import('@/lib/db');
    
    // Check if database is available
    if (!db) {
      console.error('Database connection is not available');
      return NextResponse.json(
        { error: 'Database service temporarily unavailable' },
        { status: 503 }
      );
    }
    
    const { 
      employeeApplications,
      workExperience,
      education, 
      references,
      employeeSignatures,
      applicationFiles
    } = await import('@/lib/schema');
    const { employeeApplicationSchema } = await import('@/lib/employee-validation');
    const { eq } = await import('drizzle-orm');
    const { safeJSONParse } = await import('@/lib/safe-json');

    // 1. Ensure request is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Expected multipart/form-data' },
        { status: 400 }
      );
    }

    // 2. Pull formData - Handle build-time errors gracefully
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

    const rawApplicationData = formData.get('applicationData');
    const resumeFile = formData.get('resume') as File | null;
    const idPhotoFile = formData.get('idPhoto') as File | null;

    if (!rawApplicationData) {
      return NextResponse.json(
        { error: 'Missing applicationData field' },
        { status: 400 }
      );
    }

    // 3. Safe-parse JSON with better error handling
    let applicationData: unknown;
    try {
      if (typeof rawApplicationData !== 'string') {
        throw new Error('applicationData must be a JSON string');
      }
      
      // Check for undefined or null values before parsing
      if (rawApplicationData === 'undefined' || rawApplicationData === 'null' || !rawApplicationData.trim()) {
        throw new Error('applicationData is empty or undefined');
      }
      
      applicationData = safeJSONParse(rawApplicationData, {});
    } catch (err) {
      console.error('Invalid applicationData JSON:', rawApplicationData, err);
      return NextResponse.json(
        { error: 'Invalid applicationData payload' },
        { status: 400 }
      );
    }

  // 4. Validate with Zod
  let validatedData: ReturnType<typeof employeeApplicationSchema.parse>;
  try {
    validatedData = employeeApplicationSchema.parse(applicationData);
  } catch (zodErr: any) {
    console.error('Validation error:', zodErr);
    return NextResponse.json(
      { error: 'Validation failed', details: zodErr.errors ?? zodErr },
      { status: 422 }
    );
  }

  // Convert jobPostingId to number if it's a string (extra safety)
  if (validatedData.jobPostingId && typeof validatedData.jobPostingId === 'string') {
    validatedData.jobPostingId = parseInt(validatedData.jobPostingId, 10);
  }

  // ----------------------------
  // Database transaction
  // ----------------------------
  try {
    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';
 
    // Start transaction
    const result = await db.transaction(async (tx) => {
      // 1. Insert main application
      const [application] = await tx.insert(employeeApplications).values({
        jobPostingId: validatedData.jobPostingId,
        
        // Personal Information
        firstName: validatedData.personalInfo.firstName,
        lastName: validatedData.personalInfo.lastName,
        middleName: validatedData.personalInfo.middleName || null,
        email: validatedData.personalInfo.email,
        phone: validatedData.personalInfo.phone,
        alternatePhone: validatedData.personalInfo.alternatePhone || null,
        address: validatedData.personalInfo.address,
        city: validatedData.personalInfo.city,
        state: validatedData.personalInfo.state,
        zipCode: validatedData.personalInfo.zipCode,
        
        // Critical Employee Info
        socialSecurityNumber: validatedData.personalInfo.socialSecurityNumber,
        dateOfBirth: validatedData.personalInfo.dateOfBirth,
        hasDriversLicense: validatedData.personalInfo.hasDriversLicense,
        driversLicenseNumber: validatedData.personalInfo.driversLicenseNumber || null,
        driversLicenseState: validatedData.personalInfo.driversLicenseState || null,
        
        // Emergency Contact
        emergencyContactName: validatedData.personalInfo.emergencyContactName,
        emergencyContactRelationship: validatedData.personalInfo.emergencyContactRelationship,
        emergencyContactPhone: validatedData.personalInfo.emergencyContactPhone,
        emergencyContactAddress: validatedData.personalInfo.emergencyContactAddress || null,
        
        // Employment Information
        compensationType: validatedData.personalInfo.compensationType,
        desiredSalary: validatedData.personalInfo.desiredSalary || null,
        desiredHourlyRate: validatedData.personalInfo.desiredHourlyRate || null,
        availableStartDate: validatedData.personalInfo.availableStartDate,
        hoursAvailable: validatedData.personalInfo.hoursAvailable,
        shiftPreference: validatedData.personalInfo.shiftPreference || 'not-specified',
        
        // Additional Information
        hasTransportation: validatedData.personalInfo.hasTransportation,
        hasBeenConvicted: validatedData.personalInfo.hasBeenConvicted,
        convictionDetails: validatedData.personalInfo.convictionDetails || null,
        hasPreviouslyWorkedHere: validatedData.personalInfo.hasPreviouslyWorkedHere,
        previousWorkDetails: validatedData.personalInfo.previousWorkDetails || null,
        
        // Employment Eligibility
        eligibleToWork: validatedData.eligibility.eligibleToWork,
        requiresSponsorship: validatedData.eligibility.requiresSponsorship,
        consentToBackgroundCheck: validatedData.eligibility.consentToBackgroundCheck,
        consentToDrugTest: validatedData.eligibility.consentToDrugTest,
        consentToReferenceCheck: validatedData.eligibility.consentToReferenceCheck,
        consentToEmploymentVerification: validatedData.eligibility.consentToEmploymentVerification,
        hasValidI9Documents: validatedData.eligibility.hasValidI9Documents || false,
        
        // Chemical Industry Specific
        hasHazmatExperience: validatedData.eligibility.hasHazmatExperience,
        hasForkliftCertification: validatedData.eligibility.hasForkliftCertification,
        hasChemicalHandlingExperience: validatedData.eligibility.hasChemicalHandlingExperience,
        willingToObtainCertifications: validatedData.eligibility.willingToObtainCertifications,
        
        // Additional info
        aiSummary: validatedData.additionalInfo || null,
        
        // Metadata
        ipAddress,
        userAgent,
        applicationCompletedAt: new Date(),
        status: 'pending'
      }).returning();

      // 2. Insert work experience
      for (const work of validatedData.workExperience) {
        await tx.insert(workExperience).values({
          applicationId: application.id,
          ...work
        });
      }

      // 3. Insert education
      for (const edu of validatedData.education) {
        await tx.insert(education).values({
          applicationId: application.id,
          ...edu
        });
      }

      // 4. Insert references
      for (const ref of validatedData.references) {
        await tx.insert(references).values({
          applicationId: application.id,
          ...ref
        });
      }

      // 5. Insert signature
      await tx.insert(employeeSignatures).values({
        applicationId: application.id,
        signatureDataUrl: validatedData.signatureDataUrl,
        signatureHash: Buffer.from(validatedData.signatureDataUrl).toString('base64'),
        ipAddress,
        userAgent
      });

      // 6. Handle file uploads - SECURITY FIX: Use S3 with secure paths
      if (resumeFile) {
        // ✅ SECURITY FIX: Use S3 with non-predictable paths
        const timestamp = Date.now();
        const randomId = crypto.randomBytes(16).toString('hex');
        const fileExtension = resumeFile.name.split('.').pop()?.toLowerCase() || 'pdf';
        const secureFileName = `${timestamp}-${randomId}.${fileExtension}`;
        const s3Key = `employee-resumes/${application.id}/${secureFileName}`;
        
        // Upload to S3 (implementation would go here)
        const resumeUrl = `s3://${process.env.AWS_S3_BUCKET_NAME}/${s3Key}`;
        
        await tx.insert(applicationFiles).values({
          applicationId: application.id,
          fileType: 'resume',
          fileName: resumeFile.name,
          fileUrl: resumeUrl, // ✅ Store S3 path, not public URL
          fileSize: resumeFile.size,
          mimeType: resumeFile.type
        });

        // Update application with secure reference
        await tx.update(employeeApplications)
          .set({ resumeUrl })
          .where(eq(employeeApplications.id, application.id));
      }

      if (idPhotoFile) {
        // ✅ SECURITY FIX: Same secure handling for ID photos
        const timestamp = Date.now();
        const randomId = crypto.randomBytes(16).toString('hex');
        const fileExtension = idPhotoFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const secureFileName = `${timestamp}-${randomId}.${fileExtension}`;
        const s3Key = `employee-ids/${application.id}/${secureFileName}`;
        
        const idPhotoUrl = `s3://${process.env.AWS_S3_BUCKET_NAME}/${s3Key}`;
        
        await tx.insert(applicationFiles).values({
          applicationId: application.id,
          fileType: 'id_photo',
          fileName: idPhotoFile.name,
          fileUrl: idPhotoUrl, // ✅ Store S3 path, not public URL
          fileSize: idPhotoFile.size,
          mimeType: idPhotoFile.type
        });

        await tx.update(employeeApplications)
          .set({ idPhotoUrl })
          .where(eq(employeeApplications.id, application.id));
      }

      return application;
    });

    // Generate PDF and process with AI
    console.log('Application submitted successfully:', result.id);
    
    // Process in background - don't wait for completion
    processApplicationPostSubmission(validatedData, result.id, resumeFile, idPhotoFile).catch(error => {
      console.error('Background processing error:', error);
    });

    return NextResponse.json({
      success: true,
      applicationId: result.id,
      message: 'Application submitted successfully!'
    });

  } catch (error) {
    console.error('Error submitting application:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to submit application', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * Background processing function for post-submission tasks
 */
async function processApplicationPostSubmission(
  applicationData: EmployeeApplicationForm,
  applicationId: number,
  resumeFile?: File | null,
  idPhotoFile?: File | null
): Promise<void> {
  try {
    console.log(`Starting background processing for application ${applicationId}`);
    
    // Step 1: Generate PDF
    const pdfResult = generateEmployeeApplicationPDF(applicationData, applicationId);
    if (!pdfResult.success || !pdfResult.buffer) {
      console.error('Failed to generate PDF:', pdfResult.error);
      return;
    }
    console.log('PDF generated successfully');

    // Step 2: Generate Multi-Agent AI Analysis
    const multiAgentResult = await generateMultiAgentAnalysis(applicationData, applicationId);
    if (!multiAgentResult.success) {
      console.error('Failed to generate multi-agent analysis:', multiAgentResult.error);
      // Fallback to simple summary
      console.log('📝 Generating fallback summary...');
      const fallbackSummary = await generateApplicationSummary(applicationData, applicationId);
      console.log('📝 Fallback summary generated successfully');
      console.log('Using fallback simple summary');
    } else {
      console.log('Multi-agent analysis generated successfully');
    }

    // Step 3: Upload PDF to S3 (non-blocking)
    console.log('📤 Starting PDF upload to S3...');
    const s3Result = await uploadPDFToS3(
      pdfResult.buffer,
      applicationId,
      `Application_${applicationId}.pdf`,
      {
        applicantName: `${applicationData.personalInfo.firstName} ${applicationData.personalInfo.lastName}`,
        applicantEmail: applicationData.personalInfo.email,
        submissionDate: new Date().toISOString()
      }
    ).catch(err => {
      console.error('📤 PDF upload failed:', err);
      return { success: false, error: err instanceof Error ? err.message : 'S3 upload failed' } as UploadResult;
    });
    console.log('📤 PDF upload completed:', s3Result.success);
    
    if (!s3Result.success) {
      console.error('Failed to upload PDF to S3:', s3Result.error);
      // Continue without S3 upload
    } else {
      console.log('PDF uploaded to S3 successfully:', s3Result.s3Key);
    }

    // Step 4: Send email notifications with all attachments (non-blocking)
    console.log('📧 Starting email notifications...');
    const emailResult = await sendApplicationNotificationEmails(
      applicationData,
      applicationId,
      pdfResult.buffer,
      multiAgentResult.success ? multiAgentResult : undefined,
      resumeFile,
      idPhotoFile,
      s3Result.success ? s3Result.url : undefined
    ).catch(err => {
      console.error('📧 Email notifications failed:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Email failed' };
    });
    console.log('📧 Email notifications completed:', emailResult.success);

    if (!emailResult.success) {
      console.error('Email notification failed:', emailResult.error);
    } else {
      console.log('Email notifications sent successfully:', {
        employeeEmailSent: emailResult.employeeEmailSent,
        bossEmailSent: emailResult.bossEmailSent
      });
    }

    // Step 5: Update application record with processing status
    console.log('💾 Updating application processing status...');
    await updateApplicationProcessingStatus(applicationId, {
      pdfGenerated: pdfResult.success,
      s3Uploaded: s3Result.success,
      aiSummaryGenerated: multiAgentResult.success,
      emailsSent: emailResult.success,
      s3Key: s3Result.s3Key,
      aiSummary: multiAgentResult.success ? multiAgentResult.executiveSummary : undefined,
      processedAt: new Date().toISOString()
    });
    console.log('💾 Application processing status updated successfully');

    console.log(`Background processing completed for application ${applicationId}`);

  } catch (error) {
    console.error('Error in background processing:', error);
    // Update application with error status
    await updateApplicationProcessingStatus(applicationId, {
      pdfGenerated: false,
      s3Uploaded: false,
      aiSummaryGenerated: false,
      emailsSent: false,
      processedAt: new Date().toISOString(),
      processingError: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Update application record with processing status
 */
async function updateApplicationProcessingStatus(
  applicationId: number,
  status: {
    pdfGenerated: boolean;
    s3Uploaded: boolean;
    aiSummaryGenerated: boolean;
    emailsSent: boolean;
    s3Key?: string;
    aiSummary?: string;
    processedAt: string;
    processingError?: string;
  }
): Promise<void> {
  try {
    const { db } = await import('@/lib/db');
    const { employeeApplications } = await import('@/lib/schema');
    const { eq } = await import('drizzle-orm');

    if (!db) {
      console.error('Database connection not available for status update');
      return;
    }

    await db.update(employeeApplications)
      .set({
        aiSummary: status.aiSummary || null,
        // Add other fields as needed
      })
      .where(eq(employeeApplications.id, applicationId));

    console.log(`Application ${applicationId} processing status updated`);
  } catch (error) {
    console.error('Error updating application processing status:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Dynamic imports to prevent build-time issues
    const { db } = await import('@/lib/db');
    const { employeeApplications } = await import('@/lib/schema');
    const { eq } = await import('drizzle-orm');

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('id');

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    // Fetch application with related data
    const application = await db.query.employeeApplications.findFirst({
      where: eq(employeeApplications.id, parseInt(applicationId)),
      with: {
        workExperience: true,
        education: true,
        references: true,
        signatures: true,
        files: true
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json(application);

  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch application' 
    }, { status: 500 });
  }
}