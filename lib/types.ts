// Type definitions for the application

export type UserRole = 'admin' | 'demo';

export interface UserPermissions {
  can_export: boolean;
  can_delete_any: boolean;
  can_view_all: boolean;
  can_manage_users: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  displayName: string;
  avatarUrl?: string;
  permissions: UserPermissions;
  maxConversations: number;
  maxMessagesPerConversation: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
}

export interface JWTPayload {
  sub: string;  // user id
  username: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// API Request/Response types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'password_hash'>;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
  displayName?: string;
}

export interface Session {
  id: string;
  userId: string;
  roomName: string;
  participantIdentity: string;
  startedAt: number;
  endedAt?: number;
  durationSeconds?: number;
  metadata?: Record<string, any>;
  createdAt: number;
}

export interface Conversation {
  id: string;
  userId: string;
  sessionId: string;
  title?: string;
  summary?: string;
  totalMessages: number;
  userMessageCount: number;
  agentMessageCount: number;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  conversationId: string;
  sessionId: string;
  userId: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  contentType: 'text' | 'transcript' | 'event';
  participantIdentity?: string;
  trackId?: string;
  segmentId?: string;
  isFinal: boolean;
  timestamp: number;
  sequenceNumber?: number;
  metadata?: Record<string, any>;
  createdAt: number;
}

export interface LiveKitTokenRequest {
  roomName: string;
  metadata?: Record<string, any>;
}

export interface LiveKitTokenResponse {
  token: string;
  wsUrl: string;
}

export interface CreateSessionRequest {
  roomName: string;
  participantIdentity: string;
  metadata?: Record<string, any>;
}

export interface EndSessionRequest {
  action: 'end';
}

export interface CreateConversationRequest {
  sessionId: string;
  title?: string;
}

export interface UpdateConversationRequest {
  title?: string;
  summary?: string;
}

export interface CreateMessageRequest {
  sessionId: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  contentType?: 'text' | 'transcript' | 'event';
  participantIdentity?: string;
  trackId?: string;
  segmentId?: string;
  isFinal?: boolean;
  metadata?: Record<string, any>;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: number;
}
