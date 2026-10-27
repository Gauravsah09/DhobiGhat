import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, isR2Configured } from '@/lib/r2';
import { getRequestSession } from '@/lib/auth-server';

// Server-side in-memory cache for fallback when R2 is not yet configured in local dev
declare global {
  var __DHOBIGHAT_UPLOAD_CACHE__: Map<string, { buffer: Buffer; contentType: string }> | undefined;
}

if (!global.__DHOBIGHAT_UPLOAD_CACHE__) {
  global.__DHOBIGHAT_UPLOAD_CACHE__ = new Map();
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let buffer: Buffer;
    let fileContentType = 'image/jpeg';
    let originalName = 'evidence.jpg';
    let folder = 'rider-photos';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      folder = (formData.get('folder') as string) || folder;

      if (!file) {
        return NextResponse.json(
          { success: false, message: 'No file found in form data' },
          { status: 400 }
        );
      }

      originalName = file.name || originalName;
      fileContentType = file.type || fileContentType;
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      // JSON body with base64 image or data URL
      const body = await req.json();
      const { imageBase64, filename, folder: customFolder } = body;
      if (customFolder) folder = customFolder;
      if (filename) originalName = filename;

      if (!imageBase64) {
        return NextResponse.json(
          { success: false, message: 'Missing image payload' },
          { status: 400 }
        );
      }

      // Handle data URL (data:image/jpeg;base64,...)
      let base64Clean = imageBase64;
      if (imageBase64.includes(';base64,')) {
        const parts = imageBase64.split(';base64,');
        fileContentType = parts[0].replace('data:', '') || fileContentType;
        base64Clean = parts[1];
      }

      buffer = Buffer.from(base64Clean, 'base64');
    }

    // 1. File Size Guard: Enforce 5MB ceiling to prevent Memory Exhaustion / DoS
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: `Payload too large. Maximum allowed file size is 5MB (received ${(buffer.length / (1024 * 1024)).toFixed(2)}MB).` },
        { status: 413 }
      );
    }

    // 2. Strict MIME Type Whitelist
    const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
    const normalizedMime = fileContentType.toLowerCase().trim();
    if (!ALLOWED_MIME.has(normalizedMime)) {
      return NextResponse.json(
        { success: false, message: 'Unsupported Media Type. Only JPEG, PNG, and WebP photos are permitted.' },
        { status: 415 }
      );
    }

    // 3. Path Traversal Guard: strictly whitelist folder name and filename
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'rider-photos';
    const cleanFilename = originalName.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 64);
    const objectKey = `${safeFolder}/${Date.now()}-${cleanFilename}`;

    // Upload to Cloudflare R2
    const fileUrl = await uploadToR2(objectKey, buffer, normalizedMime);

    // If running in local fallback mode, store in cache so /api/uploads/mock can serve it
    if (!isR2Configured && global.__DHOBIGHAT_UPLOAD_CACHE__) {
      // Evict oldest entries if cache exceeds 30 items to bound memory usage
      if (global.__DHOBIGHAT_UPLOAD_CACHE__.size >= 30) {
        const oldestKey = global.__DHOBIGHAT_UPLOAD_CACHE__.keys().next().value;
        if (oldestKey) {
          global.__DHOBIGHAT_UPLOAD_CACHE__.delete(oldestKey);
        }
      }
      global.__DHOBIGHAT_UPLOAD_CACHE__.set(objectKey, {
        buffer,
        contentType: fileContentType,
      });
    }

    return NextResponse.json({
      success: true,
      message: isR2Configured
        ? 'Photo successfully uploaded to Cloudflare R2 storage.'
        : 'Photo saved in local asset cache (configure Cloudflare R2 environment variables for production bucket upload).',
      fileUrl,
      key: objectKey,
      r2Configured: isR2Configured,
      sizeBytes: buffer.length,
    });
  } catch (err: any) {
    console.error('Error in /api/uploads:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
