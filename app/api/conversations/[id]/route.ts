export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { requireAuth } from '@/lib/auth';
import { rowToConversation, logAudit } from '@/lib/db';
import { getClientIP, getUserAgent } from '@/lib/utils';

// GET /api/conversations/:id
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
    const conversationRow = await env.DB.prepare(`
      SELECT c.*, s.participant_identity, s.room_name, u.username, u.display_name
      FROM conversations c
      JOIN sessions s ON c.session_id = s.id
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).bind(params.id).first();

    if (!conversationRow) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (
      authResult.user.role !== 'admin' &&
      conversationRow.user_id !== authResult.user.sub
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(conversationRow);
  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/:id
export async function DELETE(
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
    // Get conversation
    const conversationRow = await env.DB.prepare(`
      SELECT * FROM conversations WHERE id = ?
    `).bind(params.id).first();

    if (!conversationRow) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const canDelete =
      authResult.user.role === 'admin' ||
      conversationRow.user_id === authResult.user.sub;

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete conversation (cascades to messages)
    await env.DB.prepare(`
      DELETE FROM conversations WHERE id = ?
    `).bind(params.id).run();

    // Log audit event
    await logAudit(env.DB, {
      userId: authResult.user.sub,
      action: 'delete_conversation',
      resourceType: 'conversation',
      resourceId: params.id,
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/:id
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
    const { title, summary } = await request.json();

    // Get conversation
    const conversationRow = await env.DB.prepare(`
      SELECT * FROM conversations WHERE id = ?
    `).bind(params.id).first();

    if (!conversationRow) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (
      authResult.user.role !== 'admin' &&
      conversationRow.user_id !== authResult.user.sub
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update conversation
    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare(`
      UPDATE conversations
      SET title = COALESCE(?, title),
          summary = COALESCE(?, summary),
          updated_at = ?
      WHERE id = ?
    `).bind(title, summary, now, params.id).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}
