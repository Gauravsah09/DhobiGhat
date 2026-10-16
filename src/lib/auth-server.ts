import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET_STRING = process.env.AUTH_JWT_SECRET || 'dhobighat-super-secure-greedy-nerd-jwt-key-2026';
const secretKey = new TextEncoder().encode(JWT_SECRET_STRING);

export const SESSION_COOKIE_NAME = process.env.NODE_ENV === 'production'
  ? '__Host-dhobighat_session'
  : 'dhobighat_session';

export interface UserSessionPayload {
  userId: string;
  role: string;
  phone: string;
  fullName: string;
  branchId?: string;
}

/**
 * Signs a short-lived, tamper-proof session JWT using Web Crypto API (< 1ms)
 */
export async function signSessionToken(payload: UserSessionPayload, expiresIn: string = '24h'): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

/**
 * Verifies the token signature at edge or server without touching database
 */
export async function verifySessionToken(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as UserSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies session from Next.js server context cookies
 */
export async function getServerSession(): Promise<UserSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value || cookieStore.get('dhobighat_session')?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies session from API request headers or cookies
 */
export async function getRequestSession(req: NextRequest): Promise<UserSessionPayload | null> {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return await verifySessionToken(token);
  }

  const cookieToken = req.cookies.get(SESSION_COOKIE_NAME)?.value || req.cookies.get('dhobighat_session')?.value;
  if (cookieToken) {
    return await verifySessionToken(cookieToken);
  }

  return null;
}
