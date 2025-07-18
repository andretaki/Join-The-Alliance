import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET_NAME } from './config';

// Initialize S3 client
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID || '',
    secretAccessKey: AWS_SECRET_ACCESS_KEY || '',
  },
});

export interface UploadResult {
  success: boolean;
  s3Key?: string;
  url?: string;
  error?: string;
}

/**
 * Upload a file to S3
 */
export async function uploadToS3(
  file: Buffer | Uint8Array,
  key: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<UploadResult> {
  try {
    if (!AWS_S3_BUCKET_NAME) {
      throw new Error('AWS S3 bucket name is not configured');
    }

    // Ensure we have a proper Buffer
    const bodyBuffer = Buffer.isBuffer(file) ? file : Buffer.from(file);
    
    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
      Body: bodyBuffer,
      ContentType: contentType,
      Metadata: metadata,
      ServerSideEncryption: 'AES256', // Enable server-side encryption
      ContentLength: bodyBuffer.length, // Explicitly set content length
    });

    await s3Client.send(command);

    return {
      success: true,
      s3Key: key,
      url: `s3://${AWS_S3_BUCKET_NAME}/${key}`,
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Upload a PDF file to S3
 */
export async function uploadPDFToS3(
  pdfBuffer: Buffer,
  applicationId: number,
  fileName: string,
  metadata?: Record<string, string>
): Promise<UploadResult> {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const s3Key = `employee-applications/${applicationId}/pdfs/${timestamp}-${randomId}-${sanitizedFileName}`;

  return uploadToS3(pdfBuffer, s3Key, 'application/pdf', {
    applicationId: applicationId.toString(),
    originalFileName: fileName,
    uploadType: 'application_pdf',
    ...metadata,
  });
}

/**
 * Upload a general file to S3
 */
export async function uploadFileToS3(
  fileBuffer: Buffer,
  applicationId: number,
  fileName: string,
  contentType: string,
  fileType: 'resume' | 'id_photo' | 'other' = 'other',
  metadata?: Record<string, string>
): Promise<UploadResult> {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'bin';
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  const folder = fileType === 'resume' ? 'resumes' : fileType === 'id_photo' ? 'id-photos' : 'other';
  const s3Key = `employee-applications/${applicationId}/${folder}/${timestamp}-${randomId}-${sanitizedFileName}`;

  return uploadToS3(fileBuffer, s3Key, contentType, {
    applicationId: applicationId.toString(),
    originalFileName: fileName,
    fileType,
    uploadType: 'application_file',
    ...metadata,
  });
}

/**
 * Check if S3 is properly configured
 */
export function isS3Configured(): boolean {
  return !!(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && AWS_REGION && AWS_S3_BUCKET_NAME);
}

/**
 * Get S3 configuration status
 */
export function getS3ConfigStatus() {
  return {
    isConfigured: isS3Configured(),
    hasAccessKey: !!AWS_ACCESS_KEY_ID,
    hasSecretKey: !!AWS_SECRET_ACCESS_KEY,
    hasRegion: !!AWS_REGION,
    hasBucketName: !!AWS_S3_BUCKET_NAME,
    bucketName: AWS_S3_BUCKET_NAME,
    region: AWS_REGION,
  };
} 