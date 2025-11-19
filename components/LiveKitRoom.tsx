'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LiveKitRoom as LKRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useRoomContext,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';

interface LiveKitRoomProps {
  roomName: string;
  participantName: string;
  onDisconnect?: () => void;
}

function RoomControls() {
  const room = useRoomContext();
  const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (room) {
      setIsConnected(room.state === 'connected');
      room.on('disconnected', () => setIsConnected(false));
      room.on('connected', () => setIsConnected(true));
    }
  }, [room]);

  const toggleMicrophone = () => {
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-center space-x-2">
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}
        />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {isConnected ? 'Connected' : 'Connecting...'}
        </span>
      </div>

      {/* Microphone Control */}
      <div className="flex justify-center">
        <button
          onClick={toggleMicrophone}
          className={`p-6 rounded-full transition-all ${
            isMicrophoneEnabled
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
          aria-label={isMicrophoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMicrophoneEnabled ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            )}
          </svg>
        </button>
      </div>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        {isMicrophoneEnabled ? 'Microphone active' : 'Microphone muted'}
      </p>
    </div>
  );
}

function ParticipantInfo() {
  const tracks = useTracks([Track.Source.Microphone], {
    onlySubscribed: true,
  });

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Active Participants
      </h3>
      <div className="space-y-2">
        {tracks.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Waiting for agent to join...
          </p>
        ) : (
          tracks.map((track) => (
            <div
              key={track.participant.identity}
              className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-900 dark:text-white">
                {track.participant.identity}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function LiveKitRoom({
  roomName,
  participantName,
  onDisconnect,
}: LiveKitRoomProps) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch LiveKit token from our API
    const fetchToken = async () => {
      try {
        const authToken = localStorage.getItem('auth_token');
        if (!authToken) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            roomName,
            participantName,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get room token');
        }

        const data = await response.json() as { token: string; wsUrl: string };
        setToken(data.token);
        setWsUrl(data.wsUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to room');
      }
    };

    fetchToken();
  }, [roomName, participantName, router]);

  const handleDisconnect = () => {
    if (onDisconnect) {
      onDisconnect();
    } else {
      router.push('/');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connection Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!token || !wsUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Connecting to room...</p>
        </div>
      </div>
    );
  }

  return (
    <LKRoom
      token={token}
      serverUrl={wsUrl}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={handleDisconnect}
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Voice Conversation
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Room: {roomName}
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              End Call
            </button>
          </div>

          {/* Room Controls */}
          <RoomControls />

          {/* Participant Info */}
          <ParticipantInfo />
        </div>

        {/* Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            How to use
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Click the microphone button to toggle your microphone on/off</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>The AI agent will automatically join and respond to your voice</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Speak naturally - the agent uses advanced AI to understand you</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Click "End Call" when you're done to return to the home page</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Audio Renderer - handles audio playback */}
      <RoomAudioRenderer />
    </LKRoom>
  );
}
