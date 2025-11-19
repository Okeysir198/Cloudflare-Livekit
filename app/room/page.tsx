'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import LiveKitRoom from '@/components/LiveKitRoom';

function RoomPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const [roomName, setRoomName] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    // Get or generate room name
    const paramRoomName = searchParams.get('room');
    if (paramRoomName) {
      setRoomName(paramRoomName);
    } else {
      // Generate a unique room name
      const generatedRoomName = `room-${user?.username}-${Date.now()}`;
      setRoomName(generatedRoomName);
    }
  }, [user, isLoading, router, searchParams]);

  if (isLoading || !user || !roomName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading room...</p>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      roomName={roomName}
      participantName={user.displayName}
      onDisconnect={() => router.push('/')}
    />
  );
}

export default function RoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <RoomPageContent />
    </Suspense>
  );
}
