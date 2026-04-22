/**
 * ChatInput Component
 *
 * Auto-expanding textarea with send button and keyboard shortcuts.
 */

"use client";

import { useState, useRef, useCallback, useEffect, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const MAX_HEIGHT = 200;

export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = "Ask about the textbook...",
  disabled = false,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && !isLoading && !disabled) {
      onSend(trimmed);
      setValue("");
      // Reset height after clearing
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }, [value, isLoading, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Enter (without Shift)
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const isDisabled = isLoading || disabled;
  const canSend = value.trim().length > 0 && !isDisabled;

  return (
    <div className="border-t border-border bg-background p-4">
      <div
        className={cn(
          "flex items-end gap-2 p-2 rounded-xl",
          "bg-background-secondary border border-border",
          "focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20",
          "transition-all duration-200"
        )}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent",
            "px-2 py-1.5 text-sm text-foreground",
            "placeholder:text-foreground-muted",
            "focus:outline-none",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "scrollbar-thin scrollbar-thumb-foreground-muted/30"
          )}
          style={{ maxHeight: MAX_HEIGHT }}
        />

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!canSend}
          className={cn(
            "flex-shrink-0 p-2 rounded-lg",
            "transition-all duration-200",
            canSend
              ? "bg-gradient-primary text-white hover:opacity-90"
              : "bg-foreground-muted/20 text-foreground-muted cursor-not-allowed"
          )}
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="mt-2 text-xs text-foreground-muted text-center">
        Press <kbd className="px-1.5 py-0.5 rounded bg-background-tertiary">Enter</kbd> to send,{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-background-tertiary">Shift + Enter</kbd> for new line
      </p>
    </div>
  );
}

export default ChatInput;
