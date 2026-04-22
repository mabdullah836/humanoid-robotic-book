/**
 * ChatMessages Component
 *
 * Container for chat messages with scroll-to-bottom functionality.
 */

"use client";

import { useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatTypingIndicator } from "./ChatTypingIndicator";
import { cn } from "@/lib/utils";

interface Citation {
  url: string;
  title: string;
  snippet: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp?: Date | string;
}

interface ChatMessagesProps {
  messages: Message[];
  isTyping?: boolean;
  className?: string;
}

export function ChatMessages({
  messages,
  isTyping = false,
  className,
}: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }
  }, []);

  // Auto-scroll when messages change or typing state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Scroll to bottom on initial load (instant, no animation)
  useEffect(() => {
    scrollToBottom("instant");
  }, [scrollToBottom]);

  return (
    <div
      ref={containerRef}
      className={cn("flex-1 overflow-y-auto p-4", className)}
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Start a Conversation
          </h3>
          <p className="text-sm text-foreground-muted max-w-sm">
            Ask questions about the Physical AI & Humanoid Robotics textbook.
            Get instant answers powered by RAG technology.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              citations={message.citations}
              timestamp={message.timestamp}
            />
          ))}

          {/* Typing indicator */}
          {isTyping && <ChatTypingIndicator />}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}

export default ChatMessages;
