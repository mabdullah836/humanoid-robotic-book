/**
 * ChatTypingIndicator Component
 *
 * Animated typing indicator shown when assistant is generating response.
 */

"use client";

import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatTypingIndicatorProps {
  className?: string;
}

export function ChatTypingIndicator({ className }: ChatTypingIndicatorProps) {
  return (
    <div className={cn("flex gap-3", className)}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background-secondary border border-border flex items-center justify-center">
        <Bot className="w-4 h-4 text-foreground-muted" />
      </div>

      {/* Typing bubble */}
      <div className="message-bot px-4 py-3 rounded-2xl">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-foreground-muted animate-typing-dot" />
          <span className="w-2 h-2 rounded-full bg-foreground-muted animate-typing-dot" />
          <span className="w-2 h-2 rounded-full bg-foreground-muted animate-typing-dot" />
        </div>
      </div>
    </div>
  );
}

export default ChatTypingIndicator;
