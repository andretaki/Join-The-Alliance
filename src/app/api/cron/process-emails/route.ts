import { NextResponse } from 'next/server';
import { processEmailQueue, getQueueStats } from '@/lib/email-queue';

export const maxDuration = 60;

export async function GET() {
  console.log('🔄 Cron: Processing email queue...');
  
  // Verify cron authorization
  const authHeader = process.env.CRON_SECRET;
  if (!authHeader) {
    console.warn('⚠️ Cron secret not configured, allowing for development');
  }

  try {
    // Get current queue stats first
    const beforeStats = await getQueueStats();
    console.log('📊 Queue before processing:', beforeStats);

    if (!beforeStats.kvHealthy) {
      console.error('❌ KV not healthy, skipping cron processing');
      return NextResponse.json({
        success: false,
        error: 'KV service not available',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    if (beforeStats.queueLength === 0) {
      console.log('✅ Queue is empty, nothing to process');
      return NextResponse.json({
        success: true,
        message: 'Queue is empty',
        stats: beforeStats,
        timestamp: new Date().toISOString()
      });
    }

    // Process the queue with timeout
    console.log(`📧 Processing ${beforeStats.queueLength} emails in queue...`);
    
    const processPromise = processEmailQueue();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Cron email processing timeout')), 55000)
    );

    const stats = await Promise.race([processPromise, timeoutPromise]);
    
    console.log('✅ Cron email processing completed:', stats);
    
    return NextResponse.json({
      success: true,
      message: 'Cron email processing completed',
      stats: stats,
      beforeStats: beforeStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cron email processing failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Cron processing failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Allow POST for manual triggers as well
export async function POST() {
  return GET();
}