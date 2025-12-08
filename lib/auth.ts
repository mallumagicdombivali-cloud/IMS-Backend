import jwt from 'jsonwebtoken';
import { VercelRequest, VercelResponse } from '@/types/vercel';
import { User } from '@/types';
import { getCollection } from './db';
import { parseCookies } from './cookies';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = '24h';
const JWT_REFRESH_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
}

function verifyJWTToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function setAuthCookie(res: VercelResponse, token: string, refreshToken: string): void {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };

  res.setHeader('Set-Cookie', [
    `token=${token}; HttpOnly; Secure=${cookieOptions.secure}; SameSite=${cookieOptions.sameSite}; Max-Age=${cookieOptions.maxAge}; Path=${cookieOptions.path}`,
    `refreshToken=${refreshToken}; HttpOnly; Secure=${cookieOptions.secure}; SameSite=${cookieOptions.sameSite}; Max-Age=${cookieOptions.maxAge}; Path=${cookieOptions.path}`,
  ]);
}

export function clearAuthCookie(res: VercelResponse): void {
  res.setHeader('Set-Cookie', [
    'token=; HttpOnly; Secure; SameSite=strict; Max-Age=0; Path=/',
    'refreshToken=; HttpOnly; Secure; SameSite=strict; Max-Age=0; Path=/',
  ]);
}

export async function verifyToken(req: VercelRequest, res: VercelResponse): Promise<User | null> {
  try {
    // Parse cookies from header if not already parsed
    const cookies = req.cookies || parseCookies(req.headers.cookie || '');
    
    // Get Authorization header (Express normalizes to lowercase)
    const authHeader = req.headers.authorization || (req.headers as any).Authorization;
    
    // Extract token from header (handle "Bearer token" or just "token")
    let tokenFromHeader = '';
    if (authHeader) {
      // Remove "Bearer " prefix if present (case insensitive)
      tokenFromHeader = authHeader.replace(/^Bearer\s+/i, '').trim();
    }
    
    // Try cookies first, then header
    const token = cookies.token || tokenFromHeader;

    console.log('Token check:', {
      hasCookies: !!cookies.token,
      hasAuthHeader: !!authHeader,
      tokenFromHeader: tokenFromHeader ? tokenFromHeader.substring(0, 20) + '...' : 'none',
      finalToken: token ? token.substring(0, 20) + '...' : 'none',
    });

    if (!token) {
      console.log('❌ No token found');
      return null;
    }

    // Verify JWT token
    const payload = verifyJWTToken(token);
    console.log('✅ Token verified, userId:', payload.userId);
    
    // Get user from database
    const users = await getCollection<User>('users');
    // Convert string userId to ObjectId for MongoDB query
    if (!ObjectId.isValid(payload.userId)) {
      console.log('❌ Invalid userId format:', payload.userId);
      return null;
    }
    const userId = new ObjectId(payload.userId);
    const user = await users.findOne({ _id: userId as any });

    if (!user) {
      console.log('❌ User not found for userId:', payload.userId, 'as ObjectId:', userId.toString());
      return null;
    }

    console.log('✅ User found:', user.email);
    return user;
  } catch (error: any) {
    console.error('❌ Token verification error:', error.message);
    return null;
  }
}

export async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<User> {
  const user = await verifyToken(req, res);
  if (!user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    throw new Error('Unauthorized');
  }
  return user;
}

