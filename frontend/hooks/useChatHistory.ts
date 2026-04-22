"use client";

/**
 * useChatHistory Hook
 *
 * Manages chat history state and API interactions for persisting
 * conversations to the database.
 *
 * @module hooks/useChatHistory
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { Citation } from "@/lib/api/backend-adapter";

/**
 * Chat message structure
 */
export interface ChatHistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  createdAt: string;
}

/**
 * Chat session structure from API
 */
export interface ChatHistorySession {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Options for the useChatHistory hook
 */
interface UseChatHistoryOptions {
  /** Initial session ID to load */
  initialSessionId?: string | null;
  /** Whether to auto-save messages */
  autoSave?: boolean;
  /** Callback when session changes */
  onSessionChange?: (sessionId: string | null) => void;
}

/**
 * Return type for useChatHistory hook
 */
interface UseChatHistoryReturn {
  /** Current session ID */
  sessionId: string | null;
  /** Current session data */
  session: ChatHistorySession | null;
  /** Messages in the current session */
  messages: ChatHistoryMessage[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Create a new session */
  createSession: (title?: string) => Promise<string | null>;
  /** Load an existing session */
  loadSession: (sessionId: string) => Promise<void>;
  /** Add a message to the current session */
  addMessage: (
    role: "user" | "assistant",
    content: string,
    citations?: Citation[]
  ) => Promise<void>;
  /** Clear the current session (start fresh) */
  clearSession: () => void;
  /** Refresh the current session from API */
  refreshSession: () => Promise<void>;
}

/**
 * useChatHistory Hook
 *
 * Provides state management and API operations for chat history persistence.
 */
export function useChatHistory(
  options: UseChatHistoryOptions = {}
): UseChatHistoryReturn {
  const { initialSessionId, autoSave = true, onSessionChange } = options;

  const [sessionId, setSessionId] = useState<string | null>(
    initialSessionId || null
  );
  const [session, setSession] = useState<ChatHistorySession | null>(null);
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if we've initialized to avoid double-loading
  const initializedRef = useRef(false);

  /**
   * Create a new chat session
   */
  const createSession = useCallback(
    async (title?: string): Promise<string | null> => {
      if (!autoSave) return null;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/chat/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || "Failed to create session");
        }

        const data = await response.json();
        const newSession = data.session as ChatHistorySession;

        setSessionId(newSession.id);
        setSession(newSession);
        setMessages([]);
        onSessionChange?.(newSession.id);

        return newSession.id;
      } catch (err) {
        console.error("Failed to create chat session:", err);
        setError(err instanceof Error ? err.message : "Failed to create session");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [autoSave, onSessionChange]
  );

  /**
   * Load an existing chat session with its messages
   */
  const loadSession = useCallback(
    async (loadSessionId: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/chat/history/${loadSessionId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || "Failed to load session");
        }

        const data = await response.json();
        const loadedSession = data.session as ChatHistorySession;
        const loadedMessages = (data.messages || []).map(
          (msg: {
            id: string;
            role: string;
            content: string;
            citations?: string;
            createdAt: string;
          }) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            citations: msg.citations ? JSON.parse(msg.citations) : undefined,
            createdAt: msg.createdAt,
          })
        );

        setSessionId(loadSessionId);
        setSession(loadedSession);
        setMessages(loadedMessages);
        onSessionChange?.(loadSessionId);
      } catch (err) {
        console.error("Failed to load chat session:", err);
        setError(err instanceof Error ? err.message : "Failed to load session");
      } finally {
        setIsLoading(false);
      }
    },
    [onSessionChange]
  );

  // Ref to track current session ID for use in callbacks
  const sessionIdRef = useRef<string | null>(sessionId);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  /**
   * Add a message to the current session
   */
  const addMessage = useCallback(
    async (
      role: "user" | "assistant",
      content: string,
      citations?: Citation[]
    ): Promise<void> => {
      // Generate local ID for immediate UI update
      const localId = crypto.randomUUID();
      const newMessage: ChatHistoryMessage = {
        id: localId,
        role,
        content,
        citations,
        createdAt: new Date().toISOString(),
      };

      // Add to local state immediately for responsive UI
      setMessages((prev) => [...prev, newMessage]);

      // If no session exists and autoSave is enabled, create one
      let currentSessionId = sessionIdRef.current;
      if (!currentSessionId && autoSave) {
        // Create session with first user message as title hint
        const firstMessageTitle = role === "user" ? content.slice(0, 100) : undefined;
        currentSessionId = await createSession(firstMessageTitle);
        if (!currentSessionId) return;
        // Update ref immediately so subsequent calls use the new session
        sessionIdRef.current = currentSessionId;
      }

      // Persist to database if we have a session
      if (currentSessionId && autoSave) {
        try {
          const response = await fetch(
            `/api/chat/history/${currentSessionId}/messages`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                role,
                content,
                citations: citations ? JSON.stringify(citations) : undefined,
              }),
            }
          );

          if (!response.ok) {
            console.error("Failed to save message to database");
            // Don't throw - message is already in local state
          } else {
            // Update local message with server ID
            const data = await response.json();
            if (data.message?.id) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === localId ? { ...msg, id: data.message.id } : msg
                )
              );
            }
          }
        } catch (err) {
          console.error("Error saving message:", err);
          // Don't throw - message is already in local state
        }
      }
    },
    [autoSave, createSession]
  );

  /**
   * Clear the current session (start fresh without deleting)
   */
  const clearSession = useCallback(() => {
    setSessionId(null);
    setSession(null);
    setMessages([]);
    setError(null);
    sessionIdRef.current = null;
    onSessionChange?.(null);
  }, [onSessionChange]);

  /**
   * Refresh the current session from API
   */
  const refreshSession = useCallback(async (): Promise<void> => {
    if (!sessionId) return;
    await loadSession(sessionId);
  }, [sessionId, loadSession]);

  // Load initial session if provided
  useEffect(() => {
    if (initialSessionId && !initializedRef.current) {
      initializedRef.current = true;
      loadSession(initialSessionId);
    }
  }, [initialSessionId, loadSession]);

  return {
    sessionId,
    session,
    messages,
    isLoading,
    error,
    createSession,
    loadSession,
    addMessage,
    clearSession,
    refreshSession,
  };
}

export default useChatHistory;
