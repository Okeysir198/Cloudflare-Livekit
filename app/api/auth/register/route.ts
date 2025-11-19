export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { hashPassword, requireAdmin, validatePassword, validateEmail, validateUsername } from '@/lib/auth';
import { logAudit } from '@/lib/db';
import { getClientIP, getUserAgent } from '@/lib/utils';
import type { RegisterRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  const { env } = getRequestContext();

  // Require admin authentication
  const authResult = await requireAdmin(request, env.JWT_SECRET);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const body: RegisterRequest = await request.json();
    const {
      username,
      email,
      password,
      role = 'demo',
      displayName,
    } = body;

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json(
        { error: usernameValidation.error },
        { status: 400 }
      );
    }

    // Validate email
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Check if username or email already exists
    const existing = await env.DB.prepare(`
      SELECT id FROM users WHERE username = ? OR email = ?
    `).bind(username, email).first();

    if (existing) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Set permissions based on role
    const permissions = role === 'admin'
      ? {
          can_export: true,
          can_delete_any: true,
          can_view_all: true,
          can_manage_users: true,
        }
      : {
          can_export: false,
          can_delete_any: false,
          can_view_all: false,
          can_manage_users: false,
        };

    // Set limits based on role
    const maxConversations = role === 'admin' ? -1 : 10;
    const maxMessages = role === 'admin' ? -1 : 100;

    // Create user
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(`
      INSERT INTO users (
        id, username, email, password_hash, role, display_name,
        permissions, max_conversations, max_messages_per_conversation,
        is_active, is_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      username,
      email,
      passwordHash,
      role,
      displayName || username,
      JSON.stringify(permissions),
      maxConversations,
      maxMessages,
      1, // is_active
      1, // is_verified
      now,
      now
    ).run();

    // Log audit event
    await logAudit(env.DB, {
      userId: authResult.user.sub,
      action: 'create_user',
      resourceType: 'user',
      resourceId: id,
      metadata: { username, email, role },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({
      id,
      username,
      email,
      role,
      displayName: displayName || username,
    }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
