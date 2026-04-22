"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ConversationList,
  type ChatSessionWithCount,
} from "@/components/chat/ConversationList";
import { NewChatButton } from "@/components/chat/NewChatButton";

interface ChatHistoryResponse {
  sessions: ChatSessionWithCount[];
  count: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSessionWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/chat/history", {
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to load chat history");
      }

      const data: ChatHistoryResponse = await response.json();
      setSessions(data.sessions);
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      router.push(`/chat?session=${sessionId}`);
    },
    [router]
  );

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/history/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to delete conversation");
      }

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error("Failed to delete session:", err);
      throw err;
    }
  }, []);

  const handleDeleteAll = useCallback(async () => {
    if (sessions.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete all ${sessions.length} conversation${sessions.length === 1 ? "" : "s"}? This cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/chat/history", {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to delete conversations");
      }

      setSessions([]);
    } catch (err) {
      console.error("Failed to delete all sessions:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete conversations"
      );
    } finally {
      setIsDeleting(false);
    }
  }, [sessions.length]);

  const handleNewChat = useCallback(() => {
    router.push("/chat");
  }, [router]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Chat History
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and continue your past conversations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NewChatButton onNewChat={handleNewChat} variant="primary" />
          {sessions.length > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              {isDeleting ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Delete All</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {error}
              </p>
              <button
                onClick={fetchHistory}
                className="mt-1 text-sm text-red-600 underline hover:no-underline dark:text-red-400"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {isLoading ? (
          <ConversationList
            sessions={[]}
            isLoading={true}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
          />
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No conversations yet
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Start a new chat to begin asking questions about the textbook.
            </p>
            <div className="mt-6">
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Start Your First Chat
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {sessions.length} conversation{sessions.length === 1 ? "" : "s"}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Click to continue a conversation
              </p>
            </div>
            <ConversationList
              sessions={sessions}
              onSelectSession={handleSelectSession}
              onDeleteSession={handleDeleteSession}
            />
          </>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/chat"
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          Back to Chat
        </Link>
      </div>
    </div>
  );
}
