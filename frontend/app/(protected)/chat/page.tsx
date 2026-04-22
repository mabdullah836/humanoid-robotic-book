"use client";

/**
 * Modern Chat Page - ChatGPT-like Interface
 *
 * Full-featured chat interface with:
 * - Collapsible sidebar with conversation history
 * - Modern message UI with markdown support
 * - Smooth animations and transitions
 * - Dark/light mode support
 *
 * Route: /chat (protected)
 */

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { signOut } from "@/lib/auth-client";
import { useChatHistory, type ChatHistoryMessage } from "@/hooks/useChatHistory";
import { useTheme } from "@/hooks/useTheme";
import {
  sendChatMessageViaProxy,
  type ChatResult,
} from "@/lib/api/backend-adapter";
import { STARTER_PROMPTS, PLACEHOLDER_INPUT, GREETING } from "@/lib/config";
import { cn } from "@/lib/utils";
import {
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Moon,
  Sun,
  ExternalLink,
  ChevronDown,
  LogOut,
  History,
} from "lucide-react";
import Link from "next/link";

// Types
interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
  messageCount: number;
}

/**
 * Main Chat Page Component - Wrapper with Suspense
 */
export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ChatPageContent />
    </Suspense>
  );
}

/**
 * Loading fallback for chat page
 */
function ChatPageLoading() {
  return (
    <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-foreground-muted">Loading chat...</p>
      </div>
    </div>
  );
}

/**
 * Chat Page Content - Uses useSearchParams
 */
function ChatPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();

  // Get session ID from URL
  const urlSessionId = searchParams.get("session");

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  // Chat state
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  // Local messages for immediate display (before hook state updates)
  const [localMessages, setLocalMessages] = useState<ChatHistoryMessage[]>([]);

  // User dropdown state
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevUrlSessionRef = useRef<string | null>(null);

  // Chat history hook - this is the single source of truth for session and messages
  const {
    sessionId,
    session,
    messages,
    isLoading: isLoadingSession,
    addMessage,
    clearSession,
    loadSession,
    createSession,
  } = useChatHistory({
    initialSessionId: urlSessionId,
    autoSave: true,
    onSessionChange: (newSessionId) => {
      // Update URL when a new session is created (but not when loading existing)
      if (newSessionId && !urlSessionId) {
        router.replace(`/chat?session=${newSessionId}`, { scroll: false });
      }
    },
  });

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle URL changes (when user clicks a different conversation in sidebar)
  useEffect(() => {
    // Only react to URL changes, not initial load
    if (prevUrlSessionRef.current !== urlSessionId) {
      const prevUrl = prevUrlSessionRef.current;
      prevUrlSessionRef.current = urlSessionId;

      // Skip initial load (handled by useChatHistory)
      if (prevUrl === null && urlSessionId) {
        return;
      }

      // Clear local messages when URL changes
      setLocalMessages([]);

      if (urlSessionId && urlSessionId !== sessionId) {
        // Load different session
        loadSession(urlSessionId);
      } else if (!urlSessionId && sessionId) {
        // New chat requested
        clearSession();
      }
    }
  }, [urlSessionId, sessionId, loadSession, clearSession]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, localMessages, isSending]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await fetch("/api/chat/history", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data.sessions || []);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleNewChat = useCallback(() => {
    clearSession();
    setLocalMessages([]);
    router.replace("/chat", { scroll: false });
    inputRef.current?.focus();
  }, [clearSession, router]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      if (id === sessionId) return; // Already on this conversation
      setLocalMessages([]); // Clear local messages when switching
      router.push(`/chat?session=${id}`);
    },
    [router, sessionId]
  );

  const handleDeleteConversation = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const response = await fetch(`/api/chat/history/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (response.ok) {
          setConversations((prev) => prev.filter((c) => c.id !== id));
          if (sessionId === id) {
            handleNewChat();
          }
        }
      } catch (error) {
        console.error("Failed to delete conversation:", error);
      }
    },
    [sessionId, handleNewChat]
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isSending) return;

      const trimmedContent = content.trim();
      setInputValue("");
      setIsSending(true);

      // Create user message object
      const userMessage: ChatHistoryMessage = {
        id: `local-user-${Date.now()}`,
        role: "user",
        content: trimmedContent,
        createdAt: new Date().toISOString(),
      };

      // Get current messages (either from local state or hook)
      const currentMessages = localMessages.length > 0 ? localMessages : messages;

      // Add user message to local state immediately for instant display
      const updatedMessages = [...currentMessages, userMessage];
      setLocalMessages(updatedMessages);

      try {
        // Save user message to backend first (this creates session if needed)
        await addMessage("user", trimmedContent);

        // Refresh conversations list AFTER session is created
        fetchConversations();

        // Send to backend for AI response
        const result: ChatResult = await sendChatMessageViaProxy(trimmedContent, {
          sessionId: sessionId || undefined,
        });

        // Create assistant message object
        const assistantMessage: ChatHistoryMessage = {
          id: `local-assistant-${Date.now()}`,
          role: "assistant",
          content: result.success && result.message
            ? result.message
            : (result.error || "Sorry, I encountered an error. Please try again."),
          citations: result.success ? result.citations : undefined,
          createdAt: new Date().toISOString(),
        };

        // Add assistant message to local messages (keeping all previous)
        setLocalMessages([...updatedMessages, assistantMessage]);

        // Save assistant message to backend
        await addMessage("assistant", assistantMessage.content, assistantMessage.citations);

        // Refresh again to update conversation title if needed
        fetchConversations();

      } catch (error) {
        console.error("Chat error:", error);
        const errorMessage: ChatHistoryMessage = {
          id: `local-error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          createdAt: new Date().toISOString(),
        };
        // Keep all messages and add error
        setLocalMessages([...updatedMessages, errorMessage]);
        await addMessage("assistant", errorMessage.content);
      } finally {
        setIsSending(false);
      }
    },
    [isSending, sessionId, addMessage, localMessages, messages]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  // Group conversations by date
  const groupedConversations = conversations.reduce((groups, conv) => {
    const date = new Date(conv.updatedAt);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    let group: string;
    if (diffDays === 0) group = "Today";
    else if (diffDays === 1) group = "Yesterday";
    else if (diffDays <= 7) group = "Previous 7 Days";
    else if (diffDays <= 30) group = "Previous 30 Days";
    else group = "Older";

    if (!groups[group]) groups[group] = [];
    groups[group].push(conv);
    return groups;
  }, {} as Record<string, Conversation[]>);

  // Use local messages if we have them (during active chat), otherwise use hook messages
  const displayMessages = localMessages.length > 0 ? localMessages : messages;

  // Determine if we should show loading state (only when loading existing session)
  const showLoading = isLoadingSession && messages.length === 0 && localMessages.length === 0;

  // Show welcome screen only when no messages AND not currently sending
  const showWelcomeScreen = displayMessages.length === 0 && !isSending;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-background-secondary transition-all duration-300",
          isSidebarOpen ? "w-64" : "w-0"
        )}
      >
        {isSidebarOpen && (
          <div className="flex h-full flex-col">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-3 border-b border-border">
              <button
                onClick={handleNewChat}
                className={cn(
                  "flex flex-1 items-center gap-2 rounded-lg px-3 py-2",
                  "border border-border bg-background",
                  "text-sm font-medium text-foreground",
                  "hover:bg-hover-bg transition-colors"
                )}
              >
                <Plus className="h-4 w-4" />
                New chat
              </button>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="ml-2 rounded-lg p-2 text-foreground-muted hover:bg-hover-bg hover:text-foreground transition-colors"
                title="Close sidebar"
              >
                <PanelLeftClose className="h-5 w-5" />
              </button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto py-2">
              {isLoadingConversations ? (
                <div className="space-y-2 px-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-10 animate-pulse rounded-lg bg-foreground-muted/10"
                    />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <MessageSquare className="mx-auto h-8 w-8 text-foreground-muted" />
                  <p className="mt-2 text-sm text-foreground-muted">
                    No conversations yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4 px-2">
                  {Object.entries(groupedConversations).map(([group, convs]) => (
                    <div key={group}>
                      <h3 className="mb-1 px-2 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                        {group}
                      </h3>
                      <div className="space-y-0.5">
                        {convs.map((conv) => (
                          <div
                            key={conv.id}
                            onClick={() => handleSelectConversation(conv.id)}
                            className={cn(
                              "group relative flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2",
                              "transition-colors",
                              sessionId === conv.id
                                ? "bg-hover-bg text-foreground"
                                : "text-foreground-secondary hover:bg-hover-bg hover:text-foreground"
                            )}
                          >
                            <MessageSquare className="h-4 w-4 flex-shrink-0" />
                            <span className="flex-1 truncate text-sm">
                              {conv.title || "New conversation"}
                            </span>
                            <button
                              onClick={(e) => handleDeleteConversation(conv.id, e)}
                              className="absolute right-2 rounded p-1 opacity-0 group-hover:opacity-100 text-foreground-muted hover:text-red-500 hover:bg-red-500/10 transition-all"
                              title="Delete conversation"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar Footer - User Menu */}
            <div className="border-t border-border p-2">
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg p-2",
                    "text-sm text-foreground-secondary",
                    "hover:bg-hover-bg transition-colors"
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white text-xs font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="flex-1 truncate text-left font-medium text-foreground">
                    {user?.name || "User"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isUserMenuOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-border bg-background-elevated shadow-lg">
                    <div className="p-1">
                      <button
                        onClick={toggleTheme}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground-secondary hover:bg-hover-bg hover:text-foreground transition-colors"
                      >
                        {theme === "dark" ? (
                          <Sun className="h-4 w-4" />
                        ) : (
                          <Moon className="h-4 w-4" />
                        )}
                        {theme === "dark" ? "Light mode" : "Dark mode"}
                      </button>
                      <Link
                        href="/history"
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground-secondary hover:bg-hover-bg hover:text-foreground transition-colors"
                      >
                        <History className="h-4 w-4" />
                        Chat history
                      </Link>
                      <hr className="my-1 border-border" />
                      <button
                        onClick={async () => {
                          await signOut();
                          router.push("/login");
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-1 flex-col min-w-0">
        {/* Header when sidebar is closed */}
        {!isSidebarOpen && (
          <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg p-2 text-foreground-muted hover:bg-hover-bg hover:text-foreground transition-colors"
              title="Open sidebar"
            >
              <PanelLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNewChat}
              className="rounded-lg p-2 text-foreground-muted hover:bg-hover-bg hover:text-foreground transition-colors"
              title="New chat"
            >
              <Plus className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-foreground">
              {session?.title || "New chat"}
            </span>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {showLoading ? (
            /* Loading State */
            <div className="flex h-full flex-col items-center justify-center px-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-foreground-muted">
                Loading conversation...
              </p>
            </div>
          ) : showWelcomeScreen ? (
            /* Welcome Screen */
            <div className="flex h-full flex-col items-center justify-center px-4">
              <div className="max-w-2xl text-center">
                <div className="mb-6 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h1 className="mb-2 text-2xl font-semibold text-foreground">
                  {GREETING}
                </h1>
                <p className="mb-8 text-foreground-secondary">
                  Ask questions about the Physical AI & Humanoid Robotics
                  textbook
                </p>

                {/* Starter Prompts */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {STARTER_PROMPTS.slice(0, 4).map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const text =
                          typeof prompt.prompt === "string"
                            ? prompt.prompt
                            : Array.isArray(prompt.prompt)
                              ? (prompt.prompt as unknown[])
                                  .map((c) => (typeof c === "string" ? c : ""))
                                  .join("")
                              : "";
                        handleSendMessage(text);
                      }}
                      disabled={isSending}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-xl border border-border p-4",
                        "text-left transition-all",
                        "hover:border-primary/50 hover:bg-hover-bg",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      <span className="text-sm font-medium text-foreground">
                        {prompt.label}
                      </span>
                      <span className="text-xs text-foreground-muted line-clamp-2">
                        {typeof prompt.prompt === "string" ? prompt.prompt : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Messages List */
            <div className="mx-auto max-w-3xl px-4 py-6">
              <div className="space-y-6">
                {displayMessages.map((message) => (
                  <div key={message.id} className="group">
                    <div
                      className={cn(
                        "flex gap-4",
                        message.role === "user" && "flex-row-reverse"
                      )}
                    >
                      {/* Avatar */}
                      <div
                        className={cn(
                          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                          message.role === "user"
                            ? "bg-primary text-white"
                            : "bg-foreground-muted/20 text-foreground"
                        )}
                      >
                        {message.role === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>

                      {/* Message Content */}
                      <div
                        className={cn(
                          "flex-1 space-y-2",
                          message.role === "user" && "text-right"
                        )}
                      >
                        <div
                          className={cn(
                            "inline-block rounded-2xl px-4 py-3",
                            message.role === "user"
                              ? "bg-primary text-white rounded-tr-sm"
                              : "bg-background-secondary text-foreground rounded-tl-sm"
                          )}
                        >
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </p>
                        </div>

                        {/* Citations */}
                        {message.citations && message.citations.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-foreground-muted">
                              Sources:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {message.citations.map((citation, idx) => (
                                <a
                                  key={idx}
                                  href={citation.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-md px-2 py-1",
                                    "text-xs bg-primary/10 text-primary",
                                    "hover:bg-primary/20 transition-colors"
                                  )}
                                >
                                  <span className="truncate max-w-[200px]">
                                    {citation.title}
                                  </span>
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isSending && (
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-foreground-muted/20 text-foreground">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-background-secondary px-4 py-3">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-foreground-muted [animation-delay:-0.3s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-foreground-muted [animation-delay:-0.15s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-foreground-muted" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-background px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <div
              className={cn(
                "flex items-end gap-2 rounded-2xl border border-border bg-background-secondary p-2",
                "focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20",
                "transition-all"
              )}
            >
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={PLACEHOLDER_INPUT}
                disabled={isSending}
                rows={1}
                className={cn(
                  "flex-1 resize-none bg-transparent px-2 py-2",
                  "text-sm text-foreground placeholder:text-foreground-muted",
                  "focus:outline-none disabled:opacity-50",
                  "max-h-32"
                )}
                style={{
                  height: "auto",
                  minHeight: "40px",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.min(target.scrollHeight, 128) + "px";
                }}
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isSending}
                className={cn(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
                  "transition-all",
                  inputValue.trim() && !isSending
                    ? "bg-primary text-white hover:bg-primary-dark"
                    : "bg-foreground-muted/20 text-foreground-muted cursor-not-allowed"
                )}
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-foreground-muted">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
