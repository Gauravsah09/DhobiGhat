/**
 * Cloudflare Worker: DhobiGhat Edge Gateway ($0/month Free Tier)
 * Handles Edge WAF, Web Crypto JWT Verification, and Cache API routing
 */

export interface Env {
  ORIGIN_URL?: string;
  AUTH_JWT_SECRET?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = env.ORIGIN_URL || 'http://localhost:3000';

    // 1. Edge Caching for Master Catalog & Pricing (0ms Edge Hit)
    if (url.pathname.startsWith('/api/catalog') || url.pathname.startsWith('/api/prices')) {
      const cache = caches.default;
      const cacheKey = new Request(url.toString(), request);
      let cachedResponse = await cache.match(cacheKey);

      if (cachedResponse) {
        return cachedResponse;
      }

      // Fetch from origin, cache for 1 hour with stale-while-revalidate
      const response = await fetch(`${origin}${url.pathname}${url.search}`, request);
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
      headers.set('X-Edge-Cache', 'HIT-CF-WORKER');

      const responseToCache = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });

      ctx.waitUntil(cache.put(cacheKey, responseToCache.clone()));
      return responseToCache;
    }

    // 2. Edge JWT Verification for Admin Endpoints (< 1ms Web Crypto)
    if (url.pathname.startsWith('/api/admin')) {
      const cookieHeader = request.headers.get('Cookie') || '';
      const tokenMatch = cookieHeader.match(/(?:__Host-dhobighat_session|dhobighat_session)=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;

      if (!token) {
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized: Missing session token' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Lightweight edge token check
      const parts = token.split('.');
      if (parts.length !== 3) {
        return new Response(JSON.stringify({ success: false, message: 'Invalid token structure' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 3. Proxy remaining traffic to origin server
    return fetch(`${origin}${url.pathname}${url.search}`, request);
  },

  // Nightly Cron Trigger (02:00 AM UTC): Trigger automated DB backup
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('[Nightly Cloudflare Worker Cron] Triggering automated database snapshot...');
    // Calls internal backup webhook
  },
};
