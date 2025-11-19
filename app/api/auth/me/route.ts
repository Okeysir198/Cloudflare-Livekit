export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { requireAuth } from '@/lib/auth';
import { rowToUser } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { env } = getRequestContext();

  // Require authentication
  const authResult = await requireAuth(request, env.JWT_SECRET);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    // Get user details
    const userRow = await env.DB.prepare(`
      SELECT
        id, username, email, role, display_name, avatar_url,
        permissions, max_conversations, max_messages_per_conversation,
        is_active, is_verified, created_at, updated_at, last_login_at
      FROM users
      WHERE id = ?
    `).bind(authResult.user.sub).first();

    if (!userRow) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = rowToUser(userRow);

    return NextResponse.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
