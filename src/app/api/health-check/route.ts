import { NextResponse } from 'next/server';

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  details?: any;
}

interface HealthReport {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    s3: HealthCheck;
    email: HealthCheck;
    ai: HealthCheck;
    memory: HealthCheck;
  };
}

// Database connection check
async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Dynamic import to prevent build-time issues
    const { db } = await import('@/lib/db');
    const { applications } = await import('@/lib/schema');
    
    // Simple query to test connection
    await db.select().from(applications).limit(1);
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: responseTime > 5000 ? 'degraded' : 'healthy',
      responseTime,
      details: { connectionTime: responseTime }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Database connection failed',
      details: { type: 'database_error' }
    };
  }
}

// S3 connection check
async function checkS3(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Check if AWS credentials are configured
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return {
        status: 'unhealthy',
        error: 'AWS credentials not configured',
        details: { type: 'configuration_error' }
      };
    }
    
    // Dynamic import to prevent build-time issues
    const { S3Client, ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    
    // Test S3 connection with a simple list operation
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME || 'alliance-applications',
      MaxKeys: 1,
    });
    
    await s3Client.send(command);
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: responseTime > 3000 ? 'degraded' : 'healthy',
      responseTime,
      details: { bucket: process.env.AWS_BUCKET_NAME }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'S3 connection failed',
      details: { type: 's3_error' }
    };
  }
}

// Email service check
async function checkEmail(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Check if email configuration is present
    if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
      return {
        status: 'unhealthy',
        error: 'Microsoft Graph credentials not configured',
        details: { type: 'configuration_error' }
      };
    }
    
    // For now, just check if credentials are configured
    // In a real implementation, you might want to test sending an email
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      details: { 
        configured: true,
        provider: 'microsoft_graph'
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Email service check failed',
      details: { type: 'email_error' }
    };
  }
}

// AI service check
async function checkAI(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        status: 'unhealthy',
        error: 'OpenAI API key not configured',
        details: { type: 'configuration_error' }
      };
    }
    
    // Simple check - just verify the API key is configured
    // In production, you might want to make a simple API call
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      details: { 
        configured: true,
        provider: 'openai'
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'AI service check failed',
      details: { type: 'ai_error' }
    };
  }
}

// Memory and performance check
async function checkMemory(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = memoryUsage.rss / 1024 / 1024;
    const memoryLimitMB = 1024; // Vercel limit
    
    const memoryUsagePercent = (memoryUsedMB / memoryLimitMB) * 100;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (memoryUsagePercent > 90) {
      status = 'unhealthy';
    } else if (memoryUsagePercent > 70) {
      status = 'degraded';
    }
    
    const responseTime = Date.now() - startTime;
    
    return {
      status,
      responseTime,
      details: {
        memoryUsedMB: Math.round(memoryUsedMB),
        memoryUsagePercent: Math.round(memoryUsagePercent),
        uptime: process.uptime(),
        nodeVersion: process.version
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Memory check failed',
      details: { type: 'memory_error' }
    };
  }
}

// Main health check function
export async function GET() {
  const startTime = Date.now();
  
  try {
    // Run all health checks in parallel
    const [database, s3, email, ai, memory] = await Promise.all([
      checkDatabase(),
      checkS3(),
      checkEmail(),
      checkAI(),
      checkMemory()
    ]);
    
    const checks = { database, s3, email, ai, memory };
    
    // Determine overall status
    const hasUnhealthy = Object.values(checks).some(check => check.status === 'unhealthy');
    const hasDegraded = Object.values(checks).some(check => check.status === 'degraded');
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    }
    
    const report: HealthReport = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks
    };
    
    // Set appropriate HTTP status code
    let httpStatus = 200;
    if (overallStatus === 'degraded') {
      httpStatus = 200; // Still operational
    } else if (overallStatus === 'unhealthy') {
      httpStatus = 503; // Service unavailable
    }
    
    return NextResponse.json(report, { status: httpStatus });
    
  } catch (error) {
    const errorReport: HealthReport = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: { status: 'unhealthy', error: 'Health check failed' },
        s3: { status: 'unhealthy', error: 'Health check failed' },
        email: { status: 'unhealthy', error: 'Health check failed' },
        ai: { status: 'unhealthy', error: 'Health check failed' },
        memory: { status: 'unhealthy', error: 'Health check failed' }
      }
    };
    
    return NextResponse.json(errorReport, { status: 503 });
  }
}

// Optional: Add a simple ping endpoint
export async function HEAD() {
  return new Response(null, { status: 200 });
}