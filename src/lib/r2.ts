import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || '';
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'dhobighat-assets';
const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || '';

export const isR2Configured = Boolean(
  accountId && accessKeyId && secretAccessKey && !accountId.includes('your-')
);

const r2Client = isR2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  : null;

/**
 * Generate a short-lived presigned PUT URL for direct browser-to-R2 upload.
 * Zero bandwidth passes through the application server.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string = 'image/jpeg',
  expiresInSeconds: number = 300 // 5 minutes
): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
  if (!r2Client || !isR2Configured) {
    // Graceful fallback for local dev: simulate upload URL
    const fileUrl = `/api/uploads/mock?key=${encodeURIComponent(key)}`;
    return {
      uploadUrl: `/api/uploads/mock?key=${encodeURIComponent(key)}`,
      fileUrl,
      key,
    };
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
  const fileUrl = publicDomain
    ? `https://${publicDomain}/${key}`
    : `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`;

  return { uploadUrl, fileUrl, key };
}

/**
 * Direct server-side upload to Cloudflare R2 (for thermal receipts, PDFs, and DB dumps)
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string = 'application/json'
): Promise<string> {
  if (!r2Client || !isR2Configured) {
    return `/api/uploads/mock?key=${encodeURIComponent(key)}`;
  }

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: typeof body === 'string' ? Buffer.from(body) : body,
      ContentType: contentType,
    })
  );

  return publicDomain
    ? `https://${publicDomain}/${key}`
    : `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`;
}
