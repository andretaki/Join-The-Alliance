import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET_NAME } from './config';

// 💣 Fail fast if any secret is missing
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !AWS_S3_BUCKET_NAME) {
  throw new Error('S3 is not configured – missing one or more AWS_* env vars');
}

// Initialize S3 client
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
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
  file: Buffer | Uint8Array | File,
  key: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<UploadResult> {
  try {
    if (!AWS_S3_BUCKET_NAME) {
      throw new Error('AWS S3 bucket name is not configured');
    }
    
    // Log S3 configuration status (redacted for security)
    console.log('S3 Configuration:', {
      hasAccessKey: !!AWS_ACCESS_KEY_ID,
      hasSecretKey: !!AWS_SECRET_ACCESS_KEY,
      hasRegion: !!AWS_REGION,
      hasBucketName: !!AWS_S3_BUCKET_NAME,
      region: AWS_REGION,
      bucket: AWS_S3_BUCKET_NAME,
      accessKeyPrefix: AWS_ACCESS_KEY_ID?.slice(0, 4) + '***'
    });

    // Ensure we have a proper Buffer
    let bodyBuffer: Buffer;
    if (Buffer.isBuffer(file)) {
      bodyBuffer = file;
    } else if (file instanceof File) {
      bodyBuffer = Buffer.from(await file.arrayBuffer());
    } else if (file instanceof Uint8Array) {
      // Zero-copy path for Uint8Array
      bodyBuffer = Buffer.from(file.buffer, file.byteOffset, file.byteLength);
    } else {
      bodyBuffer = Buffer.from(file);
    }
    
    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
      Body: bodyBuffer,
      ContentType: contentType,
      Metadata: metadata,
      ServerSideEncryption: 'AES256', // Enable server-side encryption
      ContentLength: bodyBuffer.length, // Explicitly set content length
    });

    // Add timeout with AbortController
    const controller = new AbortController();
    const timeoutMs = parseInt(process.env.UPLOAD_TIMEOUT_MS || '30000', 10);
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      await s3Client.send(command, { abortSignal: controller.signal });
    } catch (err) {
      if ((err as any).name === 'AbortError') {
        return { success: false, error: `S3 upload timeout after ${timeoutMs / 1000} seconds` };
      }
      throw err; // genuine S3 error, outer catch will log
    } finally {
      clearTimeout(timer);
    }

    return {
      success: true,
      s3Key: key,
      url: `s3://${AWS_S3_BUCKET_NAME}/${key}`,
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    
    // Log specific error details
    if (error instanceof Error) {
      console.error('S3 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
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
  const sanitizedFileName = fileName.replace(/[^\p{L}\d.\-]/gu, '_');
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
  fileBuffer: Buffer | File,
  applicationId: number,
  fileName: string,
  contentType: string,
  fileType: 'resume' | 'id_photo' | 'other' = 'other',
  metadata?: Record<string, string>
): Promise<UploadResult> {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'bin';
  const sanitizedFileName = fileName.replace(/[^\p{L}\d.\-]/gu, '_');
  
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