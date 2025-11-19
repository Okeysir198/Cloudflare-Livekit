export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { requireAuth } from '@/lib/auth';
import { rowToSession } from '@/lib/db';
import type { CreateSessionRequest } from '@/lib/types';

// GET /api/sessions - List user's sessions
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
      ? `SELECT * FROM sessions ORDER BY started_at DESC LIMIT ? OFFSET ?`
      : `SELECT * FROM sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT ? OFFSET ?`;

    const bindings = authResult.user.role === 'admin'
      ? [limit, offset]
      : [authResult.user.sub, limit, offset];

    const { results } = await env.DB.prepare(query).bind(...bindings).all();

    const sessions = results?.map(rowToSession) || [];

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('List sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create new session
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
    const { roomName, participantIdentity, metadata } = await request.json() as CreateSessionRequest;

    if (!roomName || !participantIdentity) {
      return NextResponse.json(
        { error: 'Room name and participant identity are required' },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const startedAt = Math.floor(Date.now() / 1000);

    await env.DB.prepare(`
      INSERT INTO sessions (id, user_id, room_name, participant_identity, started_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      authResult.user.sub,
      roomName,
      participantIdentity,
      startedAt,
      metadata ? JSON.stringify(metadata) : null
    ).run();

    return NextResponse.json({
      id,
      userId: authResult.user.sub,
      roomName,
      participantIdentity,
      startedAt,
    }, { status: 201 });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
