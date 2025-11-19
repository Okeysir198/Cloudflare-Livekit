export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { requireAuth } from '@/lib/auth';
import { checkMessageLimit, rowToMessage } from '@/lib/db';

// GET /api/conversations/:id/messages
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
    // Check conversation ownership
    const conversationRow = await env.DB.prepare(`
      SELECT user_id FROM conversations WHERE id = ?
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

    // Get messages
    const { results } = await env.DB.prepare(`
      SELECT * FROM messages
      WHERE conversation_id = ?
      ORDER BY sequence_number ASC, timestamp ASC
    `).bind(params.id).all();

    const messages = results?.map(rowToMessage) || [];

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/:id/messages
export async function POST(
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
    const {
      sessionId,
      role,
      content,
      contentType = 'text',
      participantIdentity,
      trackId,
      segmentId,
      isFinal = true,
      metadata,
    } = await request.json();

    if (!sessionId || !role || !content) {
      return NextResponse.json(
        { error: 'Session ID, role, and content are required' },
        { status: 400 }
      );
    }

    // Check conversation ownership
    const conversationRow = await env.DB.prepare(`
      SELECT user_id FROM conversations WHERE id = ?
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

    // Check message limit
    const limitCheck = await checkMessageLimit(
      env.DB,
      params.id,
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
    const timestamp = Math.floor(Date.now() / 1000);

    // Get next sequence number
    const sequenceResult = await env.DB.prepare(`
      SELECT COALESCE(MAX(sequence_number), 0) + 1 as sequence_number
      FROM messages
      WHERE conversation_id = ?
    `).bind(params.id).first();

    const sequenceNumber = (sequenceResult?.sequence_number as number) || 1;

    // Insert message
    await env.DB.prepare(`
      INSERT INTO messages (
        id, conversation_id, session_id, user_id, role, content, content_type,
        participant_identity, track_id, segment_id, is_final,
        timestamp, sequence_number, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      params.id,
      sessionId,
      authResult.user.sub,
      role,
      content,
      contentType,
      participantIdentity || null,
      trackId || null,
      segmentId || null,
      isFinal ? 1 : 0,
      timestamp,
      sequenceNumber,
      metadata ? JSON.stringify(metadata) : null
    ).run();

    // Update conversation message count
    await env.DB.prepare(`
      UPDATE conversations
      SET total_messages = total_messages + 1,
          user_message_count = user_message_count + ?,
          agent_message_count = agent_message_count + ?,
          updated_at = ?
      WHERE id = ?
    `).bind(
      role === 'user' ? 1 : 0,
      role === 'agent' ? 1 : 0,
      timestamp,
      params.id
    ).run();

    return NextResponse.json({
      id,
      conversationId: params.id,
      sequenceNumber,
      timestamp,
    }, { status: 201 });
  } catch (error) {
    console.error('Save message error:', error);
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    );
  }
}
