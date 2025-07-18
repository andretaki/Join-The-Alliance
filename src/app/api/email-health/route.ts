import { NextResponse } from 'next/server';
import { getQueueStats, checkKVConnection } from '@/lib/email-queue';
import { verifyGraphConfiguration } from '@/lib/microsoft-graph';

export async function GET() {
  console.log('🏥 Comprehensive email system health check...');
  
  try {
    // Check all email service components in parallel
    const [queueStats, kvHealth, graphConfig] = await Promise.allSettled([
      getQueueStats(),
      checkKVConnection(),
      Promise.resolve(verifyGraphConfiguration())
    ]);

    const health = {
      timestamp: new Date().toISOString(),
      overall: 'checking',
      services: {
        kv: {
          status: kvHealth.status === 'fulfilled' && kvHealth.value ? 'healthy' : 'unhealthy',
          connected: kvHealth.status === 'fulfilled' ? kvHealth.value : false,
          error: kvHealth.status === 'rejected' ? kvHealth.reason?.message : null
        },
        microsoftGraph: {
          status: graphConfig.status === 'fulfilled' && graphConfig.value.isValid ? 'healthy' : 'configuration_issues',
          configured: graphConfig.status === 'fulfilled' ? graphConfig.value.isValid : false,
          issues: graphConfig.status === 'fulfilled' ? graphConfig.value.issues : ['Configuration check failed'],
          config: graphConfig.status === 'fulfilled' ? graphConfig.value.config : {}
        },
        queue: {
          status: queueStats.status === 'fulfilled' && queueStats.value.kvHealthy ? 'healthy' : 'degraded',
          stats: queueStats.status === 'fulfilled' ? queueStats.value : null,
          error: queueStats.status === 'rejected' ? queueStats.reason?.message : null
        }
      },
      environment: {
        hasEmailForm: !!process.env.EMAIL_FORM,
        hasKvUrl: !!process.env.KV_URL,
        hasMicrosoftGraphCreds: !!(process.env.MICROSOFT_GRAPH_CLIENT_ID && process.env.MICROSOFT_GRAPH_CLIENT_SECRET),
        runtime: 'vercel',
        nodeVersion: process.version
      }
    };

    // Determine overall health
    const healthyServices = Object.values(health.services).filter(service => service.status === 'healthy').length;
    const totalServices = Object.keys(health.services).length;
    
    if (healthyServices === totalServices) {
      health.overall = 'healthy';
    } else if (healthyServices > 0) {
      health.overall = 'degraded';
    } else {
      health.overall = 'unhealthy';
    }

    const statusCode = health.overall === 'healthy' ? 200 : 
                      health.overall === 'degraded' ? 207 : 503;

    console.log(`🏥 Email system health: ${health.overall} (${healthyServices}/${totalServices} services healthy)`);
    
    return NextResponse.json(health, { status: statusCode });

  } catch (error) {
    console.error('❌ Email health check failed:', error);
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overall: 'error',
      error: error instanceof Error ? error.message : 'Health check failed',
      services: {}
    }, { status: 503 });
  }
} 