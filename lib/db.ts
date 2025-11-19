// Database helper utilities for D1

import type { User, Session, Conversation, Message } from './types';

// Convert D1 row to User object
export function rowToUser(row: any): Omit<User, 'password_hash'> {
  return {
    id: row.id as string,
    username: row.username as string,
    email: row.email as string,
    role: row.role as 'admin' | 'demo',
    displayName: row.display_name as string,
    avatarUrl: row.avatar_url as string | undefined,
    permissions: row.permissions ? JSON.parse(row.permissions as string) : {},
    maxConversations: row.max_conversations as number,
    maxMessagesPerConversation: row.max_messages_per_conversation as number,
    isActive: Boolean(row.is_active),
    isVerified: Boolean(row.is_verified),
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
    lastLoginAt: row.last_login_at as number | undefined,
  };
}

// Convert D1 row to Session object
export function rowToSession(row: any): Session {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    roomName: row.room_name as string,
    participantIdentity: row.participant_identity as string,
    startedAt: row.started_at as number,
    endedAt: row.ended_at as number | undefined,
    durationSeconds: row.duration_seconds as number | undefined,
    metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
    createdAt: row.created_at as number,
  };
}

// Convert D1 row to Conversation object
export function rowToConversation(row: any): Conversation {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    sessionId: row.session_id as string,
    title: row.title as string | undefined,
    summary: row.summary as string | undefined,
    totalMessages: row.total_messages as number,
    userMessageCount: row.user_message_count as number,
    agentMessageCount: row.agent_message_count as number,
    isPublic: Boolean(row.is_public),
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
  };
}

// Convert D1 row to Message object
export function rowToMessage(row: any): Message {
  return {
    id: row.id as string,
    conversationId: row.conversation_id as string,
    sessionId: row.session_id as string,
    userId: row.user_id as string,
    role: row.role as 'user' | 'agent' | 'system',
    content: row.content as string,
    contentType: row.content_type as 'text' | 'transcript' | 'event',
    participantIdentity: row.participant_identity as string | undefined,
    trackId: row.track_id as string | undefined,
    segmentId: row.segment_id as string | undefined,
    isFinal: Boolean(row.is_final),
    timestamp: row.timestamp as number,
    sequenceNumber: row.sequence_number as number | undefined,
    metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
    createdAt: row.created_at as number,
  };
}

// Check if user has reached conversation limit
export async function checkConversationLimit(
  db: D1Database,
  userId: string,
  role: string
): Promise<{ allowed: boolean; error?: string }> {
  if (role === 'admin') {
    return { allowed: true };
  }

  // Get user's max conversations
  const user = await db
    .prepare('SELECT max_conversations FROM users WHERE id = ?')
    .bind(userId)
    .first();

  if (!user) {
    return { allowed: false, error: 'User not found' };
  }

  const maxConversations = user.max_conversations as number;

  if (maxConversations === -1) {
    return { allowed: true }; // Unlimited
  }

  // Count user's conversations
  const result = await db
    .prepare('SELECT COUNT(*) as count FROM conversations WHERE user_id = ?')
    .bind(userId)
    .first();

  const count = (result?.count as number) || 0;

  if (count >= maxConversations) {
    return {
      allowed: false,
      error: `Conversation limit reached (${maxConversations} max). Please delete old conversations.`,
    };
  }

  return { allowed: true };
}

// Check if user has reached message limit for a conversation
export async function checkMessageLimit(
  db: D1Database,
  conversationId: string,
  userId: string,
  role: string
): Promise<{ allowed: boolean; error?: string }> {
  if (role === 'admin') {
    return { allowed: true };
  }

  // Get user's max messages per conversation
  const user = await db
    .prepare('SELECT max_messages_per_conversation FROM users WHERE id = ?')
    .bind(userId)
    .first();

  if (!user) {
    return { allowed: false, error: 'User not found' };
  }

  const maxMessages = user.max_messages_per_conversation as number;

  if (maxMessages === -1) {
    return { allowed: true }; // Unlimited
  }

  // Count messages in conversation
  const result = await db
    .prepare('SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?')
    .bind(conversationId)
    .first();

  const count = (result?.count as number) || 0;

  if (count >= maxMessages) {
    return {
      allowed: false,
      error: `Message limit reached for this conversation (${maxMessages} max).`,
    };
  }

  return { allowed: true };
}

// Log audit event
export async function logAudit(
  db: D1Database,
  data: {
    userId: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  const id = crypto.randomUUID();
  const timestamp = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      `INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, metadata, ip_address, user_agent, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      data.userId,
      data.action,
      data.resourceType || null,
      data.resourceId || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.ipAddress || null,
      data.userAgent || null,
      timestamp
    )
    .run();
}
