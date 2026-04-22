"use client";

/**
 * ConversationList Component
 *
 * Displays a list of past chat conversations for the authenticated user.
 * Supports loading conversations, showing details, and deletion.
 *
 * @module components/chat/ConversationList
 */

import { useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";

/**
 * Chat session with message count from API
 */
export interface ChatSessionWithCount {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

/**
 * Props for ConversationList component
 */
interface ConversationListProps {
  /** Array of chat sessions to display */
  sessions: ChatSessionWithCount[];
  /** Currently selected session ID */
  selectedSessionId?: string | null;
  /** Loading state for the list */
  isLoading?: boolean;
  /** Callback when a session is clicked */
  onSelectSession: (sessionId: string) => void;
  /** Callback when delete is clicked */
  onDeleteSession: (sessionId: string) => Promise<void>;
  /** Optional className for styling */
  className?: string;
}

/**
 * ConversationList Component
 *
 * Renders a scrollable list of conversation sessions with:
 * - Title (or "New Conversation" if no title)
 * - Relative timestamp
 * - Message count
 * - Delete button with confirmation
 */
export function ConversationList({
  sessions,
  selectedSessionId,
  isLoading = false,
  onSelectSession,
  onDeleteSession,
  className = "",
}: ConversationListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  /**
   * Handle delete button click - show confirmation
   */
  const handleDeleteClick = useCallback(
    (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation();
      setConfirmDeleteId(sessionId);
    },
    []
  );

  /**
   * Handle delete confirmation
   */
  const handleConfirmDelete = useCallback(
    async (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation();
      setDeletingId(sessionId);
      try {
        await onDeleteSession(sessionId);
      } finally {
        setDeletingId(null);
        setConfirmDeleteId(null);
      }
    },
    [onDeleteSession]
  );

  /**
   * Cancel delete confirmation
   */
  const handleCancelDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  }, []);

  /**
   * Format the date for display
   */
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Unknown date";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (sessions.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          No conversations yet
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Start a new chat to see your history here
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {sessions.map((session) => {
        const isSelected = session.id === selectedSessionId;
        const isDeleting = session.id === deletingId;
        const isConfirming = session.id === confirmDeleteId;

        return (
          <div
            key={session.id}
            onClick={() => !isDeleting && onSelectSession(session.id)}
            className={`
              group relative cursor-pointer rounded-lg border p-3 transition-all
              ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-500 dark:hover:bg-gray-700"
              }
              ${isDeleting ? "opacity-50 pointer-events-none" : ""}
            `}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectSession(session.id);
              }
            }}
            aria-pressed={isSelected}
            aria-label={`Conversation: ${session.title || "New Conversation"}`}
          >
            {/* Title */}
            <h3
              className={`
              truncate text-sm font-medium
              ${
                isSelected
                  ? "text-blue-900 dark:text-blue-100"
                  : "text-gray-900 dark:text-gray-100"
              }
            `}
            >
              {session.title || "New Conversation"}
            </h3>

            {/* Meta info */}
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{formatDate(session.updatedAt)}</span>
              <span>-</span>
              <span>
                {session.messageCount}{" "}
                {session.messageCount === 1 ? "message" : "messages"}
              </span>
            </div>

            {/* Delete button / Confirmation */}
            {isConfirming ? (
              <div
                className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => handleConfirmDelete(e, session.id)}
                  className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                  aria-label="Confirm delete"
                >
                  Delete
                </button>
                <button
                  onClick={handleCancelDelete}
                  className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                  aria-label="Cancel delete"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => handleDeleteClick(e, session.id)}
                className={`
                  absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5
                  text-gray-400 opacity-0 transition-all
                  hover:bg-red-100 hover:text-red-600
                  focus:opacity-100 group-hover:opacity-100
                  dark:text-gray-500 dark:hover:bg-red-500/20 dark:hover:text-red-400
                `}
                aria-label={`Delete conversation: ${session.title || "New Conversation"}`}
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ConversationList;
