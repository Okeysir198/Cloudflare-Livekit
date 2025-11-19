export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { requireAuth } from '@/lib/auth';
import { rowToSession } from '@/lib/db';

// GET /api/sessions/:id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const sessionRow = await env.DB.prepare(`
      SELECT * FROM sessions WHERE id = ?
    `).bind(params.id).first();

    if (!sessionRow) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (authResult.user.role !== 'admin' && sessionRow.user_id !== authResult.user.sub) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const session = rowToSession(sessionRow);

    return NextResponse.json(session);
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions/:id - End session
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { action } = await request.json();

    if (action !== 'end') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get session
    const sessionRow = await env.DB.prepare(`
      SELECT * FROM sessions WHERE id = ?
    `).bind(params.id).first();

    if (!sessionRow) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (authResult.user.role !== 'admin' && sessionRow.user_id !== authResult.user.sub) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // End session
    const endedAt = Math.floor(Date.now() / 1000);
    const durationSeconds = endedAt - (sessionRow.started_at as number);

    await env.DB.prepare(`
      UPDATE sessions
      SET ended_at = ?, duration_seconds = ?
      WHERE id = ?
    `).bind(endedAt, durationSeconds, params.id).run();

    return NextResponse.json({
      id: params.id,
      endedAt,
      durationSeconds,
    });
  } catch (error) {
    console.error('End session error:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
}
