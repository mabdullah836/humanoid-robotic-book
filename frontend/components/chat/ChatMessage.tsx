/**
 * ChatMessage Component
 *
 * Individual message bubble with user/assistant styling.
 */

"use client";

import { Bot, User, Sparkles } from "lucide-react";
import { CitationDisplay } from "./CitationDisplay";
import { cn } from "@/lib/utils";

interface Citation {
  url: string;
  title: string;
  snippet: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp?: Date | string;
  isStreaming?: boolean;
}

export function ChatMessage({
  role,
  content,
  citations,
  timestamp,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser
            ? "bg-gradient-primary"
            : "bg-background-secondary border border-border"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-foreground-muted" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser ? "message-user" : "message-bot"
        )}
      >
        {/* Content with optional streaming indicator */}
        <div className="flex items-start gap-2">
          {!isUser && (
            <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0 opacity-50" />
          )}
          <div className="min-w-0">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {content}
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 ml-0.5 bg-foreground animate-pulse" />
              )}
            </p>
          </div>
        </div>

        {/* Citations */}
        {citations && citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <CitationDisplay citations={citations} className="text-xs" />
          </div>
        )}

        {/* Timestamp */}
        {timestamp && (
          <p
            className={cn(
              "mt-2 text-xs",
              isUser ? "text-white/60" : "text-foreground-muted"
            )}
          >
            {new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
