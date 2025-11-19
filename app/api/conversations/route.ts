export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { requireAuth } from '@/lib/auth';
import { checkConversationLimit, rowToConversation } from '@/lib/db';

// GET /api/conversations - List conversations
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

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Admin can see all, demo users only see their own
    const query = authResult.user.role === 'admin'
      ? `
        SELECT c.*, s.participant_identity, s.room_name, u.username, u.display_name
        FROM conversations c
        JOIN sessions s ON c.session_id = s.id
        JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `
      : `
        SELECT c.*, s.participant_identity, s.room_name, u.username, u.display_name
        FROM conversations c
        JOIN sessions s ON c.session_id = s.id
        JOIN users u ON c.user_id = u.id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `;

    const bindings = authResult.user.role === 'admin'
      ? [limit, offset]
      : [authResult.user.sub, limit, offset];

    const { results } = await env.DB.prepare(query).bind(...bindings).all();

    return NextResponse.json({ conversations: results || [] });
  } catch (error) {
    console.error('List conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create new conversation
export async function POST(request: NextRequest) {
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
    const { sessionId, title } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Check conversation limit for demo users
    const limitCheck = await checkConversationLimit(
      env.DB,
      authResult.user.sub,
      authResult.user.role
    );

    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.error },
        { status: 403 }
      );
    }

    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(`
      INSERT INTO conversations (
        id, user_id, session_id, title, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      authResult.user.sub,
      sessionId,
      title || 'New Conversation',
      now,
      now
    ).run();

    return NextResponse.json({
      id,
      userId: authResult.user.sub,
      sessionId,
      title: title || 'New Conversation',
      createdAt: now,
    }, { status: 201 });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
