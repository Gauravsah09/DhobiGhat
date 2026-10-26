import { NextRequest, NextResponse } from 'next/server';

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawKey = searchParams.get('key');

  if (!rawKey) {
    return NextResponse.json({ success: false, message: 'Missing key parameter' }, { status: 400 });
  }

  // Prevent path traversal and strip non-whitelisted characters
  const safeKey = rawKey.replace(/[^a-zA-Z0-9_\-\.\/]/g, '').slice(0, 120);

  const cached = global.__DHOBIGHAT_UPLOAD_CACHE__?.get(rawKey) || global.__DHOBIGHAT_UPLOAD_CACHE__?.get(safeKey);
  if (cached) {
    return new NextResponse(cached.buffer as any, {
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  const sanitizedDisplayKey = escapeXml(safeKey);

  // Fallback placeholder image SVG with strict escaping
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="#1e293b">
    <rect width="400" height="300" fill="#0f172a"/>
    <circle cx="200" cy="130" r="50" fill="#334155"/>
    <path d="M185 130 L195 140 L215 120" stroke="#38bdf8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <text x="200" y="210" fill="#94a3b8" font-family="sans-serif" font-size="14" text-anchor="middle" font-weight="bold">Cloudflare R2 Intake Photo Proof</text>
    <text x="200" y="235" fill="#64748b" font-family="monospace" font-size="11" text-anchor="middle">${sanitizedDisplayKey}</text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache',
    },
  });
}
