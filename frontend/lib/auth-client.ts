/**
 * Better Auth Client Configuration
 *
 * Client-side authentication utilities for React components.
 * This file should be imported in client components for auth operations.
 *
 * @see https://www.better-auth.com/docs/concepts/client
 */

import { createAuthClient } from "better-auth/react";

/**
 * Create the Better Auth client instance
 * Automatically connects to /api/auth/* endpoints
 */
export const authClient = createAuthClient({
  /**
   * Base URL for auth API endpoints
   * Defaults to current origin, which works for same-origin requests
   */
  baseURL: typeof window !== "undefined" ? window.location.origin : undefined,
});

/**
 * useSession Hook
 *
 * React hook for accessing session data reactively.
 * Returns:
 * - data: Session object with user and session info (or null)
 * - isPending: Loading state
 * - error: Error object if request failed
 * - refetch: Function to manually refresh session
 *
 * @example
 * ```tsx
 * const { data: session, isPending } = useSession();
 * if (isPending) return <Loading />;
 * if (!session) return <LoginButton />;
 * return <div>Welcome, {session.user.name}!</div>;
 * ```
 */
export const { useSession } = authClient;

/**
 * signIn Methods
 *
 * Authentication sign-in utilities:
 * - signIn.email({ email, password }): Email/password sign in
 * - signIn.social({ provider }): OAuth sign in (when configured)
 *
 * @example
 * ```tsx
 * await signIn.email({
 *   email: "user@example.com",
 *   password: "password123",
 * }, {
 *   onSuccess: () => router.push("/dashboard"),
 *   onError: (ctx) => alert(ctx.error.message),
 * });
 * ```
 */
export const { signIn } = authClient;

/**
 * signUp Methods
 *
 * User registration utilities:
 * - signUp.email({ email, password, name }): Create new account
 *
 * @example
 * ```tsx
 * await signUp.email({
 *   email: "user@example.com",
 *   password: "password123",
 *   name: "John Doe",
 * }, {
 *   onSuccess: () => router.push("/welcome"),
 *   onError: (ctx) => alert(ctx.error.message),
 * });
 * ```
 */
export const { signUp } = authClient;

/**
 * signOut Method
 *
 * Sign out the current user and clear session.
 *
 * @example
 * ```tsx
 * await signOut({
 *   onSuccess: () => router.push("/"),
 * });
 * ```
 */
export const { signOut } = authClient;

/**
 * Export the full client for advanced usage
 * Includes all methods: signIn, signUp, signOut, useSession, etc.
 */
export default authClient;
