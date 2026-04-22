"use client";

/**
 * NewChatButton Component
 *
 * Button to start a new chat conversation.
 * Clears the current conversation state and optionally creates a new session.
 *
 * @module components/chat/NewChatButton
 */

import { useState, useCallback } from "react";

/**
 * Props for NewChatButton component
 */
interface NewChatButtonProps {
  /** Callback when new chat is requested */
  onNewChat: () => void | Promise<void>;
  /** Whether to create a session in the database */
  createSession?: boolean;
  /** Loading state from parent */
  isLoading?: boolean;
  /** Button variant */
  variant?: "primary" | "secondary" | "outline";
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Optional className for styling */
  className?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * NewChatButton Component
 *
 * Renders a button that starts a new chat conversation.
 * Supports multiple visual variants and sizes.
 */
export function NewChatButton({
  onNewChat,
  isLoading = false,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
}: NewChatButtonProps) {
  const [isCreating, setIsCreating] = useState(false);

  /**
   * Handle button click
   */
  const handleClick = useCallback(async () => {
    if (isLoading || isCreating || disabled) return;

    setIsCreating(true);
    try {
      await onNewChat();
    } finally {
      setIsCreating(false);
    }
  }, [onNewChat, isLoading, isCreating, disabled]);

  // Determine button classes based on variant
  const variantClasses = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600",
    secondary:
      "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 dark:bg-gray-500 dark:hover:bg-gray-600",
    outline:
      "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20",
  };

  // Determine size classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const isProcessing = isLoading || isCreating;

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing || disabled}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-lg font-medium transition-all
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      aria-label="Start new chat"
    >
      {isProcessing ? (
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
          <span>Creating...</span>
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>New Chat</span>
        </>
      )}
    </button>
  );
}

/**
 * Compact version of NewChatButton for sidebars
 */
export function NewChatButtonCompact({
  onNewChat,
  isLoading = false,
  className = "",
  disabled = false,
}: Omit<NewChatButtonProps, "variant" | "size">) {
  const [isCreating, setIsCreating] = useState(false);

  const handleClick = useCallback(async () => {
    if (isLoading || isCreating || disabled) return;

    setIsCreating(true);
    try {
      await onNewChat();
    } finally {
      setIsCreating(false);
    }
  }, [onNewChat, isLoading, isCreating, disabled]);

  const isProcessing = isLoading || isCreating;

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing || disabled}
      className={`
        flex w-full items-center gap-3 rounded-lg border-2 border-dashed
        border-gray-300 p-3 text-sm text-gray-600 transition-all
        hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        dark:border-gray-600 dark:text-gray-400
        dark:hover:border-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-400
        ${className}
      `}
      aria-label="Start new chat"
    >
      {isProcessing ? (
        <svg
          className="h-5 w-5 animate-spin"
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
      ) : (
        <svg
          className="h-5 w-5"
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
      )}
      <span>{isProcessing ? "Creating..." : "New Chat"}</span>
    </button>
  );
}

export default NewChatButton;
