import { NextResponse, type NextRequest } from 'next/server';
import { processEmailQueue, getQueueStats, cleanupQueue } from '@/lib/email-queue';

export const maxDuration = 60; // Increase max duration for email processing

export async function POST(request: NextRequest) {
  console.log('📧 Email queue processing triggered with robust timeout handling');
  
  try {
    // Process queue with extended timeout and aggressive retry
    const processPromise = processEmailQueue();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Queue processing timeout after 50s')), 50000)
    );

    const stats = await Promise.race([processPromise, timeoutPromise]);
    
    console.log('✅ Queue processing completed successfully:', stats);
    
    // Trigger cleanup in background
    cleanupQueue().catch(err => console.warn('⚠️ Background cleanup failed:', err));
    
    return NextResponse.json({
      success: true,
      message: 'Email queue processed successfully',
      stats: stats,
      timestamp: new Date().toISOString(),
      note: stats.sent > 0 ? `Successfully sent ${stats.sent} emails` : 'No emails to process'
    });
  } catch (error) {
    console.error('❌ Queue processing failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Queue processing failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  console.log('📊 Getting email queue stats');
  
  try {
    const stats = await getQueueStats();
    
    return NextResponse.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to get queue stats:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get queue stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 