export const runtime = 'edge';

import { SignJWT } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { requireAuth } from '@/lib/auth';
import type { LiveKitTokenRequest } from '@/lib/types';

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
    const body: LiveKitTokenRequest = await request.json();
    const { roomName, metadata } = body;

    if (!roomName) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      );
    }

    // Use authenticated user's info
    const participantName = authResult.user.username;

    // Create LiveKit access token using jose
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(env.LIVEKIT_API_SECRET);

    const videoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    };

    const token = await new SignJWT({
      video: videoGrant,
      metadata: JSON.stringify({
        ...metadata,
        userId: authResult.user.sub,
        role: authResult.user.role,
      }),
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(participantName)
      .setIssuer(env.LIVEKIT_API_KEY)
      .setAudience(env.LIVEKIT_API_KEY)
      .setNotBefore(Math.floor(Date.now() / 1000))
      .setExpirationTime('6h')
      .sign(secretKey);

    return NextResponse.json({
      token,
      wsUrl: env.LIVEKIT_WS_URL,
    });
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
