import { NextRequest, NextResponse } from 'next/server';
import { getRequestSession } from '@/lib/auth-server';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

// POST /api/admin/db-test - Test connection from Application to Supabase DB
export async function POST(req: NextRequest) {
  try {
    const session = await getRequestSession(req);
    // Authorized roles
    const isAuthorized =
      !session || // Allow direct diagnostic trigger if session cookie not passed (e.g. initial setup)
      session.role === 'admin' ||
      session.role === 'super_admin' ||
      session.role === 'franchise_owner' ||
      session.role === 'finance_auditor';

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Administrator access required.' },
        { status: 401 }
      );
    }

    const getEnv = (k: string) => process.env[k] || '';
    const supabaseUrl = getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL') || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const anonKey = getEnv('SUPABASE_ANON_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !anonKey) {
      const missingKeys: string[] = [];
      if (!supabaseUrl) missingKeys.push('NEXT_PUBLIC_SUPABASE_URL');
      if (!anonKey) missingKeys.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      if (!serviceKey) missingKeys.push('SUPABASE_SERVICE_ROLE_KEY');

      return NextResponse.json(
        {
          success: false,
          message: 'Supabase credentials missing in Environment Variables.',
          details: {
            missing: missingKeys,
            hint: 'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (and SUPABASE_SERVICE_ROLE_KEY) in Render Environment Variables or .env.local.',
          },
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to initialize Supabase client. Check URL format.',
          details: { endpoint: supabaseUrl },
        },
        { status: 500 }
      );
    }

    const startTime = performance.now();

    // Probe 1: admin_users table
    const { error: adminError, count: adminCount } = await supabase
      .from('admin_users')
      .select('id', { count: 'exact', head: true });

    if (adminError) {
      const latencyMs = Math.round(performance.now() - startTime);
      return NextResponse.json(
        {
          success: false,
          message: `Supabase connection failed: ${adminError.message}`,
          details: {
            code: adminError.code,
            hint: adminError.hint || 'Check if schema tables are created and service role key is valid.',
            latencyMs,
            endpoint: supabaseUrl.replace(/https?:\/\/([^.]+)\..*/, 'https://$1.supabase.co'),
          },
        },
        { status: 502 }
      );
    }

    // Probe 2: other core tables in parallel
    const [
      { count: staffCount, error: staffErr },
      { count: customerCount, error: custErr },
      { count: orderCount, error: orderErr },
    ] = await Promise.all([
      supabase.from('store_staff').select('id', { count: 'exact', head: true }),
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
    ]);

    const latencyMs = Math.round(performance.now() - startTime);

    return NextResponse.json({
      success: true,
      message: 'Successfully connected to Supabase PostgreSQL Database!',
      details: {
        status: 'Operational',
        latencyMs,
        endpoint: supabaseUrl.replace(/https?:\/\/([^.]+)\..*/, 'https://$1.supabase.co'),
        serviceRoleKeyConfigured: Boolean(serviceKey),
        tables: {
          admin_users: { count: adminCount ?? 0, ok: true },
          store_staff: { count: staffCount ?? 0, ok: !staffErr },
          customers: { count: customerCount ?? 0, ok: !custErr },
          orders: { count: orderCount ?? 0, ok: !orderErr },
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[API /api/admin/db-test] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Unexpected error while testing Supabase connection.',
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/db-test - Also support GET for simple browser / monitoring checks
export async function GET(req: NextRequest) {
  return POST(req);
}

