import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getSupabaseAdminClient } from '@/lib/supabase-server';
import { isR2Configured } from '@/lib/r2';

/**
 * Health Watchdog Endpoint for External Uptime Pingers (UptimeRobot / BetterUptime)
 * Pings every 5 minutes at $0/month.
 */
export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'unconfigured_local_fallback';
  let dbLatencyMs = 0;

  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const dbStart = Date.now();
      const { error } = await supabase.from('store_branches').select('id').limit(1);
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = error ? `error: ${error.message}` : 'healthy';
    }
  }

  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  const isHealthy = dbStatus !== 'error';

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'DhobiGhat LMS Cloud',
      version: '2.0.0-enterprise',
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      latencyMs: Date.now() - startTime,
      database: {
        configured: isSupabaseConfigured,
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      objectStorage: {
        cloudflareR2Configured: isR2Configured,
      },
      memory: {
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      },
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
