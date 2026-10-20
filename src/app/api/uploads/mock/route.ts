import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ success: false, message: 'Missing key parameter' }, { status: 400 });
  }

  const cached = global.__DHOBIGHAT_UPLOAD_CACHE__?.get(key);
  if (cached) {
    return new NextResponse(cached.buffer as any, {
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  // Fallback placeholder image SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="#1e293b">
    <rect width="400" height="300" fill="#0f172a"/>
    <circle cx="200" cy="130" r="50" fill="#334155"/>
    <path d="M185 130 L195 140 L215 120" stroke="#38bdf8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <text x="200" y="210" fill="#94a3b8" font-family="sans-serif" font-size="14" text-anchor="middle" font-weight="bold">Cloudflare R2 Intake Photo Proof</text>
    <text x="200" y="235" fill="#64748b" font-family="monospace" font-size="11" text-anchor="middle">${key}</text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache',
    },
  });
}
