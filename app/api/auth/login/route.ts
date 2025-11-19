export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { verifyPassword, generateToken } from '@/lib/auth';
import { rowToUser } from '@/lib/db';
import { getClientIP, getUserAgent } from '@/lib/utils';
import type { LoginRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  const { env } = getRequestContext();

  try {
    const body: LoginRequest = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user by username
    const userRow = await env.DB.prepare(`
      SELECT * FROM users WHERE username = ? AND is_active = 1
    `).bind(username).first();

    if (!userRow) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, userRow.password_hash as string);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Convert row to User object
    const user = rowToUser(userRow);

    // Generate JWT
    const token = await generateToken(
      {
        ...user,
        permissions: userRow.permissions
          ? JSON.parse(userRow.permissions as string)
          : {},
      },
      env.JWT_SECRET
    );

    // Update last login
    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare(`
      UPDATE users SET last_login_at = ? WHERE id = ?
    `).bind(now, user.id).run();

    // Log audit event
    const ipAddress = getClientIP(request);
    const userAgent = getUserAgent(request);

    await env.DB.prepare(`
      INSERT INTO audit_log (id, user_id, action, ip_address, user_agent, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      user.id,
      'login',
      ipAddress || null,
      userAgent || null,
      now
    ).run();

    return NextResponse.json({
      token,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
