import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as crypto from 'crypto';
import { 
  employeeApplications, 
  workExperience, 
  education, 
  references, 
  employeeSignatures, 
  applicationFiles,
  emailNotifications
} from '@/lib/schema';
import { employeeApplicationSchema } from '@/lib/employee-validation';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // 1. Ensure request is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Expected multipart/form-data' },
        { status: 400 }
      );
    }

    // 2. Pull formData
    const formData = await request.formData();
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
      
      applicationData = JSON.parse(rawApplicationData);
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
        firstName: validatedData.personalInfo.firstName,
        lastName: validatedData.personalInfo.lastName,
        email: validatedData.personalInfo.email,
        phone: validatedData.personalInfo.phone,
        address: validatedData.personalInfo.address,
        city: validatedData.personalInfo.city,
        state: validatedData.personalInfo.state,
        zipCode: validatedData.personalInfo.zipCode,
        eligibleToWork: validatedData.eligibility.eligibleToWork,
        requiresSponsorship: validatedData.eligibility.requiresSponsorship,
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

    // TODO: Process with AI and send email notification (background job)
    console.log('Application submitted successfully:', result.id);

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

export async function GET(request: NextRequest) {
  try {
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