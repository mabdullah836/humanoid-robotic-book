"use client";

/**
 * ChatKit Panel Component
 *
 * Main chat interface component that integrates OpenAI ChatKit UI
 * with the FastAPI RAG backend via proxy endpoint.
 *
 * Key features:
 * - Uses local /api/chat proxy for authenticated requests to backend
 * - Displays citations from RAG retrieval
 * - Supports theme switching and fact recording
 * - Graceful error handling
 *
 * @module components/ChatKitPanel
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import {
  STARTER_PROMPTS,
  PLACEHOLDER_INPUT,
  GREETING,
  CREATE_SESSION_ENDPOINT,
  WORKFLOW_ID,
  getThemeConfig,
  BACKEND_URL,
} from "@/lib/config";
import { ErrorOverlay } from "./ErrorOverlay";
import type { ColorScheme } from "@/hooks/useColorScheme";
import {
  sendChatMessageViaProxy,
  type Citation,
  type ChatResult,
} from "@/lib/api/backend-adapter";
import { CitationDisplay } from "./chat/CitationDisplay";

export type FactAction = {
  type: "save";
  factId: string;
  factText: string;
};

/**
 * Message from chat history for restoration
 */
export interface HistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  createdAt: string;
}

type ChatKitPanelProps = {
  theme: ColorScheme;
  onWidgetAction: (action: FactAction) => Promise<void>;
  onResponseEnd: () => void;
  onThemeRequest: (scheme: ColorScheme) => void;
  /** Session ID for persisting chat history */
  sessionId?: string | null;
  /** Initial messages to restore from history */
  initialMessages?: HistoryMessage[];
  /** Callback to save messages to history */
  onSaveMessage?: (
    role: "user" | "assistant",
    content: string,
    citations?: Citation[]
  ) => Promise<void>;
};

type ErrorState = {
  script: string | null;
  session: string | null;
  integration: string | null;
  retryable: boolean;
};

const isBrowser = typeof window !== "undefined";
const isDev = process.env.NODE_ENV !== "production";

const createInitialErrors = (): ErrorState => ({
  script: null,
  session: null,
  integration: null,
  retryable: false,
});

/**
 * Determine if backend mode should be used
 * Backend mode is enabled when BACKEND_URL is configured and differs from localhost default
 * or when WORKFLOW_ID is not set (fallback to backend)
 */
function shouldUseBackend(): boolean {
  const hasBackendUrl = Boolean(BACKEND_URL && BACKEND_URL !== "http://localhost:8000");
  const hasWorkflowId = Boolean(WORKFLOW_ID && !WORKFLOW_ID.startsWith("wf_replace"));

  // Use backend if explicitly configured OR if workflow ID is not set
  if (hasBackendUrl) {
    return true;
  }

  // If neither is configured, prefer backend mode
  if (!hasWorkflowId) {
    return true;
  }

  return false;
}

export function ChatKitPanel({
  theme,
  onWidgetAction,
  onResponseEnd,
  onThemeRequest,
  sessionId: externalSessionId,
  initialMessages = [],
  onSaveMessage,
}: ChatKitPanelProps) {
  const processedFacts = useRef(new Set<string>());
  const [errors, setErrors] = useState<ErrorState>(() => createInitialErrors());
  const [isInitializingSession, setIsInitializingSession] = useState(true);
  const isMountedRef = useRef(true);
  const [scriptStatus, setScriptStatus] = useState<
    "pending" | "ready" | "error"
  >(() =>
    isBrowser && window.customElements?.get("openai-chatkit")
      ? "ready"
      : "pending"
  );
  const [widgetInstanceKey, setWidgetInstanceKey] = useState(0);

  // Backend-specific state
  const [useBackendMode] = useState(() => shouldUseBackend());
  const [backendSessionId, setBackendSessionId] = useState<string | null>(
    externalSessionId || null
  );
  const [lastCitations, setLastCitations] = useState<Citation[]>([]);
  const [isBackendLoading, setIsBackendLoading] = useState(false);
  const [backendMessages, setBackendMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string; citations?: Citation[] }>
  >(() =>
    initialMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      citations: msg.citations,
    }))
  );
  const [inputValue, setInputValue] = useState("");
  const initializedRef = useRef(false);

  // Ref for scrolling to bottom of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const setErrorState = useCallback((updates: Partial<ErrorState>) => {
    setErrors((current) => ({ ...current, ...updates }));
  }, []);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }
  }, []);

  // Auto-scroll when messages change or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [backendMessages, isBackendLoading, scrollToBottom]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sync external session ID and initial messages when they change
  useEffect(() => {
    if (externalSessionId !== backendSessionId) {
      setBackendSessionId(externalSessionId || null);
    }
  }, [externalSessionId, backendSessionId]);

  // Update messages when initial messages change (e.g., loading a session from history)
  // This should ONLY run when explicitly loading a saved session, not during normal chat
  useEffect(() => {
    // Only restore messages from history when there are actual saved messages to restore
    if (initialMessages.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      console.log("[ChatKitPanel] Restoring messages from history:", initialMessages.length);
      setBackendMessages(
        initialMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          citations: msg.citations,
        }))
      );
    }
    // NOTE: Removed the else branch that was resetting messages to []
    // That was causing issues - messages were being cleared unexpectedly
  }, [initialMessages]);

  // Script loading for ChatKit (only when not in backend mode)
  useEffect(() => {
    if (!isBrowser || useBackendMode) {
      if (useBackendMode) {
        setIsInitializingSession(false);
      }
      return;
    }

    let timeoutId: number | undefined;

    const handleLoaded = () => {
      if (!isMountedRef.current) {
        return;
      }
      setScriptStatus("ready");
      setErrorState({ script: null });
    };

    const handleError = (event: Event) => {
      console.error("Failed to load chatkit.js for some reason", event);
      if (!isMountedRef.current) {
        return;
      }
      setScriptStatus("error");
      const detail = (event as CustomEvent<unknown>)?.detail ?? "unknown error";
      setErrorState({ script: `Error: ${detail}`, retryable: false });
      setIsInitializingSession(false);
    };

    window.addEventListener("chatkit-script-loaded", handleLoaded);
    window.addEventListener(
      "chatkit-script-error",
      handleError as EventListener
    );

    if (window.customElements?.get("openai-chatkit")) {
      handleLoaded();
    } else if (scriptStatus === "pending") {
      timeoutId = window.setTimeout(() => {
        if (!window.customElements?.get("openai-chatkit")) {
          handleError(
            new CustomEvent("chatkit-script-error", {
              detail:
                "ChatKit web component is unavailable. Verify that the script URL is reachable.",
            })
          );
        }
      }, 5000);
    }

    return () => {
      window.removeEventListener("chatkit-script-loaded", handleLoaded);
      window.removeEventListener(
        "chatkit-script-error",
        handleError as EventListener
      );
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [scriptStatus, setErrorState, useBackendMode]);

  const isWorkflowConfigured = Boolean(
    WORKFLOW_ID && !WORKFLOW_ID.startsWith("wf_replace")
  );

  useEffect(() => {
    if (!useBackendMode && !isWorkflowConfigured && isMountedRef.current) {
      setErrorState({
        session: "Set NEXT_PUBLIC_CHATKIT_WORKFLOW_ID in your .env.local file.",
        retryable: false,
      });
      setIsInitializingSession(false);
    }
  }, [isWorkflowConfigured, setErrorState, useBackendMode]);

  const handleResetChat = useCallback(() => {
    processedFacts.current.clear();
    if (isBrowser) {
      setScriptStatus(
        window.customElements?.get("openai-chatkit") ? "ready" : "pending"
      );
    }
    setIsInitializingSession(true);
    setErrors(createInitialErrors());
    setWidgetInstanceKey((prev) => prev + 1);

    // Reset backend state
    setBackendSessionId(null);
    setLastCitations([]);
    setBackendMessages([]);
    setInputValue("");
  }, []);

  /**
   * Handle sending a message via the backend proxy
   */
  const handleBackendSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      setIsBackendLoading(true);
      setErrorState({ integration: null });

      // Add user message to chat UI
      setBackendMessages((prev) => [
        ...prev,
        { role: "user", content: message },
      ]);
      setInputValue("");

      // Save user message to history
      if (onSaveMessage) {
        try {
          await onSaveMessage("user", message);
          console.log("[ChatKitPanel] User message saved to history");
        } catch (err) {
          console.error("[ChatKitPanel] Failed to save user message:", err);
        }
      }

      try {
        const result: ChatResult = await sendChatMessageViaProxy(message, {
          sessionId: backendSessionId || undefined,
        });

        console.log("[ChatKitPanel] sendChatMessageViaProxy result:", result);

        // Always reset loading state after receiving response
        // Note: We no longer check isMountedRef here because the layout was
        // causing unnecessary unmounts during session refresh. The state updates
        // are safe even if the component briefly unmounts.
        console.log("[ChatKitPanel] Response received, processing result");

        if (result.success && result.message) {
          console.log("[ChatKitPanel] Success! Adding assistant message:", result.message);

          // Reset loading state FIRST to ensure UI updates
          setIsBackendLoading(false);

          // Then update the rest of the state
          setBackendSessionId(result.sessionId);
          setLastCitations(result.citations);

          // Add the assistant message
          const assistantMessage = {
            role: "assistant" as const,
            content: result.message,
            citations: result.citations,
          };

          setBackendMessages((prev) => {
            const newMessages = [...prev, assistantMessage];
            console.log("[ChatKitPanel] Updated messages count:", newMessages.length);
            return newMessages;
          });

          // Save assistant message to history
          if (onSaveMessage) {
            try {
              await onSaveMessage("assistant", result.message, result.citations);
              console.log("[ChatKitPanel] Assistant message saved to history");
            } catch (err) {
              console.error("[ChatKitPanel] Failed to save assistant message:", err);
            }
          }

          onResponseEnd();
        } else {
          console.log("[ChatKitPanel] Failed result:", {
            success: result.success,
            message: result.message,
            error: result.error,
          });
          setIsBackendLoading(false);
          setErrorState({
            integration: result.error || "Failed to get response or empty message",
            retryable: true,
          });
        }
      } catch (error) {
        console.error("Backend chat error:", error);
        // Always reset loading state on error
        setIsBackendLoading(false);
        setErrorState({
          integration:
            error instanceof Error
              ? error.message
              : "Failed to send message",
          retryable: true,
        });
      }
    },
    [backendSessionId, onResponseEnd, setErrorState, onSaveMessage]
  );

  /**
   * getClientSecret for ChatKit (OpenAI workflow mode)
   * Only used when NOT in backend mode
   */
  const getClientSecret = useCallback(
    async (currentSecret: string | null) => {
      if (isDev) {
        console.info("[ChatKitPanel] getClientSecret invoked", {
          currentSecretPresent: Boolean(currentSecret),
          workflowId: WORKFLOW_ID,
          endpoint: CREATE_SESSION_ENDPOINT,
        });
      }

      if (!isWorkflowConfigured) {
        const detail =
          "Set NEXT_PUBLIC_CHATKIT_WORKFLOW_ID in your .env.local file.";
        if (isMountedRef.current) {
          setErrorState({ session: detail, retryable: false });
          setIsInitializingSession(false);
        }
        throw new Error(detail);
      }

      if (isMountedRef.current) {
        if (!currentSecret) {
          setIsInitializingSession(true);
        }
        setErrorState({ session: null, integration: null, retryable: false });
      }

      try {
        const response = await fetch(CREATE_SESSION_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workflow: { id: WORKFLOW_ID },
            chatkit_configuration: {
              file_upload: {
                enabled: true,
              },
            },
          }),
        });

        const raw = await response.text();

        if (isDev) {
          console.info("[ChatKitPanel] createSession response", {
            status: response.status,
            ok: response.ok,
            bodyPreview: raw.slice(0, 1600),
          });
        }

        let data: Record<string, unknown> = {};
        if (raw) {
          try {
            data = JSON.parse(raw) as Record<string, unknown>;
          } catch (parseError) {
            console.error(
              "Failed to parse create-session response",
              parseError
            );
          }
        }

        if (!response.ok) {
          const detail = extractErrorDetail(data, response.statusText);
          console.error("Create session request failed", {
            status: response.status,
            body: data,
          });
          throw new Error(detail);
        }

        const clientSecret = data?.client_secret as string | undefined;
        if (!clientSecret) {
          throw new Error("Missing client secret in response");
        }

        if (isMountedRef.current) {
          setErrorState({ session: null, integration: null });
        }

        return clientSecret;
      } catch (error) {
        console.error("Failed to create ChatKit session", error);
        const detail =
          error instanceof Error
            ? error.message
            : "Unable to start ChatKit session.";
        if (isMountedRef.current) {
          setErrorState({ session: detail, retryable: false });
        }
        throw error instanceof Error ? error : new Error(detail);
      } finally {
        if (isMountedRef.current && !currentSecret) {
          setIsInitializingSession(false);
        }
      }
    },
    [isWorkflowConfigured, setErrorState]
  );

  const chatkit = useChatKit({
    api: { getClientSecret },
    theme: {
      colorScheme: theme,
      ...getThemeConfig(theme),
    },
    startScreen: {
      greeting: GREETING,
      prompts: STARTER_PROMPTS,
    },
    composer: {
      placeholder: PLACEHOLDER_INPUT,
      attachments: {
        enabled: true,
      },
    },
    threadItemActions: {
      feedback: false,
    },
    onClientTool: async (invocation: {
      name: string;
      params: Record<string, unknown>;
    }) => {
      if (invocation.name === "switch_theme") {
        const requested = invocation.params.theme;
        if (requested === "light" || requested === "dark") {
          if (isDev) {
            console.debug("[ChatKitPanel] switch_theme", requested);
          }
          onThemeRequest(requested);
          return { success: true };
        }
        return { success: false };
      }

      if (invocation.name === "record_fact") {
        const id = String(invocation.params.fact_id ?? "");
        const text = String(invocation.params.fact_text ?? "");
        if (!id || processedFacts.current.has(id)) {
          return { success: true };
        }
        processedFacts.current.add(id);
        void onWidgetAction({
          type: "save",
          factId: id,
          factText: text.replace(/\s+/g, " ").trim(),
        });
        return { success: true };
      }

      return { success: false };
    },
    onResponseEnd: () => {
      onResponseEnd();
    },
    onResponseStart: () => {
      setErrorState({ integration: null, retryable: false });
    },
    onThreadChange: () => {
      processedFacts.current.clear();
    },
    onError: ({ error }: { error: unknown }) => {
      console.error("ChatKit error", error);
    },
  });

  const activeError = errors.session ?? errors.integration;
  const blockingError = errors.script ?? activeError;

  if (isDev) {
    console.debug("[ChatKitPanel] render state", {
      isInitializingSession,
      hasControl: Boolean(chatkit.control),
      scriptStatus,
      hasError: Boolean(blockingError),
      workflowId: WORKFLOW_ID,
      useBackendMode,
      backendUrl: BACKEND_URL,
    });
  }

  // Render backend mode chat interface
  if (useBackendMode) {
    // Debug log on every render - show actual message contents
    console.log("[ChatKitPanel] Rendering backend mode:", {
      messagesCount: backendMessages.length,
      isBackendLoading,
      lastMessage: backendMessages.length > 0 ? backendMessages[backendMessages.length - 1] : null,
      allMessageRoles: backendMessages.map(m => m.role),
    });

    return (
      <div className="relative flex h-[calc(100vh-12rem)] w-full flex-col rounded-2xl bg-white shadow-sm transition-colors dark:bg-slate-900">
        {/* Chat messages area - takes remaining space and scrolls */}
        <div ref={messagesContainerRef} className="min-h-0 flex-1 overflow-y-auto p-4">
          {backendMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                {GREETING}
              </h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                Ask questions about the Physical AI & Humanoid Robotics textbook
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {STARTER_PROMPTS.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      handleBackendSendMessage(prompt.prompt);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500"
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {backendMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                        <CitationDisplay
                          citations={msg.citations}
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isBackendLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg bg-slate-100 px-4 py-2 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              {/* Scroll anchor - always at the bottom */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area - sticky at bottom */}
        <div className="flex-shrink-0 border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleBackendSendMessage(inputValue);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={PLACEHOLDER_INPUT}
              disabled={isBackendLoading}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-500"
            />
            <button
              type="submit"
              disabled={isBackendLoading || !inputValue.trim()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Send
            </button>
          </form>
        </div>

        {/* Error overlay */}
        <ErrorOverlay
          error={errors.integration}
          fallbackMessage={null}
          onRetry={errors.retryable ? handleResetChat : null}
          retryLabel="Restart chat"
        />
      </div>
    );
  }

  // Render ChatKit mode (OpenAI workflow)
  return (
    <div className="relative flex h-[90vh] w-full flex-col rounded-2xl bg-white pb-8 shadow-sm transition-colors dark:bg-slate-900">
      <ChatKit
        key={widgetInstanceKey}
        control={chatkit.control}
        className={
          blockingError || isInitializingSession
            ? "pointer-events-none opacity-0"
            : "block h-full w-full"
        }
      />

      {/* Citations sidebar (shown when citations are available) */}
      {lastCitations.length > 0 && (
        <div className="absolute bottom-20 right-4 max-h-60 w-72 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <CitationDisplay citations={lastCitations} />
        </div>
      )}

      <ErrorOverlay
        error={blockingError}
        fallbackMessage={
          blockingError || !isInitializingSession
            ? null
            : "Loading assistant session..."
        }
        onRetry={blockingError && errors.retryable ? handleResetChat : null}
        retryLabel="Restart chat"
      />
    </div>
  );
}

function extractErrorDetail(
  payload: Record<string, unknown> | undefined,
  fallback: string
): string {
  if (!payload) {
    return fallback;
  }

  const error = payload.error;
  if (typeof error === "string") {
    return error;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  const details = payload.details;
  if (typeof details === "string") {
    return details;
  }

  if (details && typeof details === "object" && "error" in details) {
    const nestedError = (details as { error?: unknown }).error;
    if (typeof nestedError === "string") {
      return nestedError;
    }
    if (
      nestedError &&
      typeof nestedError === "object" &&
      "message" in nestedError &&
      typeof (nestedError as { message?: unknown }).message === "string"
    ) {
      return (nestedError as { message: string }).message;
    }
  }

  if (typeof payload.message === "string") {
    return payload.message;
  }

  return fallback;
}
