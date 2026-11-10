import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function checkIsSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return Boolean(url && anonKey && !url.includes('your-project-id'));
}

export const isSupabaseConfigured = checkIsSupabaseConfigured();

/**
 * Returns a high-privilege server client for backend API routes (Order Valuation, PIN/Password Checks)
 * Authenticates using SUPABASE_SERVICE_ROLE_KEY (falling back to NEXT_PUBLIC_SUPABASE_ANON_KEY)
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

  const isConfigured = Boolean(url && anonKey && !url.includes('your-project-id'));
  if (!isConfigured) return null;

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Returns a standard anon/user-scoped Supabase client for client/user operations
 */
export function getSupabaseClient(accessToken?: string): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const isConfigured = Boolean(url && anonKey && !url.includes('your-project-id'));
  if (!isConfigured) return null;

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}
