"use client";

/**
 * DeleteAllConversations Component
 *
 * A button component that allows users to delete all their chat conversations.
 * Includes a confirmation dialog to prevent accidental deletion.
 *
 * Features:
 * - Confirmation modal before deletion
 * - Loading state during deletion
 * - Error handling with user feedback
 * - Callback for parent component to refresh state
 *
 * @module components/chat/DeleteAllConversations
 */

import { useState, type MouseEvent } from "react";

/**
 * Props for DeleteAllConversations component
 */
interface DeleteAllConversationsProps {
  /**
   * Callback function called after successful deletion
   */
  onSuccess?: () => void;
  /**
   * Number of conversations to be deleted (for display in confirmation)
   */
  conversationCount?: number;
  /**
   * Custom button className
   */
  className?: string;
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
}

/**
 * Trash Icon SVG Component
 */
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

/**
 * DeleteAllConversations Component
 *
 * @example
 * ```tsx
 * <DeleteAllConversations
 *   conversationCount={5}
 *   onSuccess={() => router.refresh()}
 * />
 * ```
 */
export function DeleteAllConversations({
  onSuccess,
  conversationCount = 0,
  className = "",
  disabled = false,
}: DeleteAllConversationsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Open the confirmation modal
   */
  const handleOpenModal = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError(null);
    setIsModalOpen(true);
  };

  /**
   * Close the confirmation modal
   */
  const handleCloseModal = () => {
    if (!isDeleting) {
      setIsModalOpen(false);
      setError(null);
    }
  };

  /**
   * Delete all conversations
   */
  const handleDeleteAll = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/chat/history", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || data.error || "Failed to delete conversations");
      }

      // Close modal and call success callback
      setIsModalOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Delete Button */}
      <button
        type="button"
        onClick={handleOpenModal}
        disabled={disabled || conversationCount === 0}
        className={`
          inline-flex items-center gap-2 px-4 py-2
          text-sm font-medium text-red-600 dark:text-red-400
          bg-white dark:bg-gray-800
          border border-red-300 dark:border-red-700 rounded-md
          transition-colors duration-200
          ${
            disabled || conversationCount === 0
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 dark:hover:border-red-600"
          }
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
          ${className}
        `}
        aria-label="Delete all conversations"
      >
        <TrashIcon className="h-4 w-4" />
        <span>Delete All</span>
      </button>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseModal}
            aria-hidden="true"
          />

          {/* Modal Content */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <TrashIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3
                  id="delete-modal-title"
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  Delete All Conversations
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Are you sure you want to delete{" "}
                  {conversationCount > 0 ? (
                    <>
                      <span className="font-medium">{conversationCount}</span>{" "}
                      conversation{conversationCount !== 1 ? "s" : ""}
                    </>
                  ) : (
                    "all conversations"
                  )}
                  ? This action cannot be undone and all messages will be permanently
                  removed.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
                role="alert"
              >
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isDeleting}
                className={`
                  px-4 py-2 text-sm font-medium
                  text-gray-700 dark:text-gray-300
                  bg-white dark:bg-gray-700
                  border border-gray-300 dark:border-gray-600 rounded-md
                  transition-colors duration-200
                  ${
                    isDeleting
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50 dark:hover:bg-gray-600"
                  }
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                `}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className={`
                  px-4 py-2 text-sm font-medium text-white
                  bg-red-600 rounded-md
                  transition-colors duration-200
                  ${
                    isDeleting
                      ? "opacity-75 cursor-not-allowed"
                      : "hover:bg-red-700"
                  }
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                `}
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
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
                    Deleting...
                  </span>
                ) : (
                  "Delete All"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DeleteAllConversations;
