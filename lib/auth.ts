// Authentication utilities for Edge Runtime

import { SignJWT, jwtVerify } from 'jose';
import { hash, compare } from 'bcrypt-edge';
import type { User, JWTPayload } from './types';

const JWT_EXPIRY = '7d'; // 7 days

// Hash password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 10);
}

// Verify password against hash
export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  try {
    return await compare(password, passwordHash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Generate JWT token
export async function generateToken(
  user: User,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  return await new SignJWT({
    sub: user.id,
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(secretKey);
}

// Verify JWT token
export async function verifyToken(
  token: string,
  secret: string
): Promise<JWTPayload | null> {
  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);

    const { payload } = await jwtVerify(token, secretKey);
    return payload as JWTPayload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Extract token from Authorization header
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Middleware: Verify authentication
export async function requireAuth(
  request: Request,
  secret: string
): Promise<{ user: JWTPayload } | { error: string; status: number }> {
  const authHeader = request.headers.get('Authorization');
  const token = extractToken(authHeader);

  if (!token) {
    return { error: 'Unauthorized - No token provided', status: 401 };
  }

  const payload = await verifyToken(token, secret);
  if (!payload) {
    return { error: 'Unauthorized - Invalid token', status: 401 };
  }

  return { user: payload };
}

// Middleware: Require admin role
export async function requireAdmin(
  request: Request,
  secret: string
): Promise<{ user: JWTPayload } | { error: string; status: number }> {
  const authResult = await requireAuth(request, secret);

  if ('error' in authResult) {
    return authResult;
  }

  if (authResult.user.role !== 'admin') {
    return { error: 'Forbidden - Admin access required', status: 403 };
  }

  return authResult;
}

// Validate password strength
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password) && !/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain letters' };
  }

  return { valid: true };
}

// Validate email format
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate username
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' };
  }

  if (username.length > 30) {
    return { valid: false, error: 'Username must be less than 30 characters' };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  return { valid: true };
}
