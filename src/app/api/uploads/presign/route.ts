import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl, isR2Configured } from '@/lib/r2';
import { getRequestSession } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const session = await getRequestSession(req);
    const body = await req.json();
    const { filename = 'image.jpg', contentType = 'image/jpeg', folder = 'photos' } = body;

    // Sanitize filename
    const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${Date.now()}-${cleanName}`;

    const presigned = await getPresignedUploadUrl(key, contentType, 300); // 5 min expiry

    return NextResponse.json({
      success: true,
      r2Configured: isR2Configured,
      key: presigned.key,
      uploadUrl: presigned.uploadUrl,
      fileUrl: presigned.fileUrl,
      expiresInSeconds: 300,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
