'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function HomePage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                LiveKit Voice Agent
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {user.displayName}
                {user.role === 'admin' && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    Admin
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Voice Agent Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Voice Agent
              </h2>
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Start a voice conversation with the AI agent
            </p>
            <button
              onClick={() => router.push('/room')}
              className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Start Conversation
            </button>
          </div>

          {/* Conversations Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Conversations
              </h2>
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              View your conversation history
            </p>
            <button className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              View History
            </button>
          </div>

          {/* Stats Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Usage
              </h2>
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Conversations:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  0 / {user.maxConversations === -1 ? '∞' : user.maxConversations}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Role:</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Getting Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center mb-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm mr-3">
                  1
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Start a conversation
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
                Click "Start Conversation" to begin talking with the AI voice agent
              </p>
            </div>
            <div>
              <div className="flex items-center mb-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm mr-3">
                  2
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Speak naturally
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
                The agent will listen and respond in real-time using advanced AI
              </p>
            </div>
            <div>
              <div className="flex items-center mb-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm mr-3">
                  3
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  View history
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
                All conversations are saved and can be reviewed later
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
