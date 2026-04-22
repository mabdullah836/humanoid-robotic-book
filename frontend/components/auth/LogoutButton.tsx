"use client";

/**
 * Logout Button Component
 *
 * Provides a button or link to sign out the current user.
 * Uses Better Auth's signOut method with proper loading states.
 *
 * @see https://www.better-auth.com/docs/concepts/client
 */

import { useState, type ButtonHTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

/**
 * Logout Button Props
 */
interface LogoutButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  /** Render as a text link instead of a button */
  variant?: "button" | "link";
  /** Custom redirect path after logout (defaults to "/") */
  redirectTo?: string;
  /** Custom text for the button/link */
  children?: React.ReactNode;
  /** Callback after successful logout (before redirect) */
  onLogoutSuccess?: () => void;
  /** Callback on logout error */
  onLogoutError?: (error: Error) => void;
}

/**
 * Loading Spinner for button
 */
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
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
  );
}

/**
 * LogoutButton Component
 *
 * Handles user sign out with loading state and redirect.
 *
 * @example
 * ```tsx
 * // As a button
 * <LogoutButton />
 *
 * // As a link
 * <LogoutButton variant="link">Sign out</LogoutButton>
 *
 * // With custom redirect
 * <LogoutButton redirectTo="/goodbye" />
 *
 * // With callbacks
 * <LogoutButton
 *   onLogoutSuccess={() => console.log("Logged out")}
 *   onLogoutError={(err) => console.error(err)}
 * />
 * ```
 */
export function LogoutButton({
  variant = "button",
  redirectTo = "/",
  children,
  onLogoutSuccess,
  onLogoutError,
  className,
  disabled,
  ...buttonProps
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            // Call custom callback if provided
            onLogoutSuccess?.();
            // Redirect to specified path
            router.push(redirectTo);
            // Force a hard refresh to clear any cached state
            router.refresh();
          },
          onError: (ctx) => {
            const error = new Error(
              ctx.error?.message || "Failed to sign out"
            );
            console.error("Logout error:", error);
            onLogoutError?.(error);
            setIsLoading(false);
          },
        },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Failed to sign out");
      console.error("Logout error:", err);
      onLogoutError?.(err);
      setIsLoading(false);
    }
  };

  // Base styles for both variants
  const baseStyles = "inline-flex items-center justify-center gap-2 transition-colors";

  // Variant-specific styles
  const variantStyles = {
    button: `
      px-4 py-2 rounded-lg font-medium
      bg-gray-100 text-gray-700 hover:bg-gray-200
      dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    link: `
      text-gray-600 hover:text-gray-900
      dark:text-gray-400 dark:hover:text-white
      underline-offset-2 hover:underline
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
  };

  const combinedClassName = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${className || ""}
  `.trim();

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={disabled || isLoading}
      className={combinedClassName}
      aria-busy={isLoading}
      {...buttonProps}
    >
      {isLoading ? (
        <>
          <LoadingSpinner />
          <span>Signing out...</span>
        </>
      ) : (
        children || "Sign out"
      )}
    </button>
  );
}

/**
 * Export as default for convenient imports
 */
export default LogoutButton;
