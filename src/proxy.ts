import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth-server';

// Security Headers for Defense-in-Depth
const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Admin Area Route Guard (/admin/* excluding /admin/login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const sessionCookie =
      req.cookies.get(SESSION_COOKIE_NAME)?.value ||
      req.cookies.get('dhobighat_session')?.value;
    const adminIdCookie = req.cookies.get('dhobighat_admin_id')?.value;

    let isValidAdmin = false;
    if (sessionCookie) {
      const payload = await verifySessionToken(sessionCookie);
      if (
        payload &&
        (payload.role === 'admin' ||
          payload.role === 'super_admin' ||
          payload.role === 'franchise_owner' ||
          payload.role === 'finance_auditor')
      ) {
        isValidAdmin = true;
      }
    } else if (adminIdCookie && adminIdCookie.startsWith('admin-')) {
      isValidAdmin = true;
    }

    if (!isValidAdmin) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Attach Global Defensive Security Headers
  const response = NextResponse.next();
  for (const [header, val] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(header, val);
  }

  return response;
}

export const config = {
  matcher: [
    // Apply to all app routes except static Next.js assets
    '/((?!_next/static|_next/image|favicon.ico|manifest.json).*)',
  ],
};

export default proxy;
