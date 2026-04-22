"use client";

/**
 * Authentication Provider Component
 *
 * Provides authentication context to the application using Better Auth.
 * Wraps children with session state that can be accessed via useSession hook.
 *
 * @see https://www.better-auth.com/docs/concepts/client
 */

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useSession } from "@/lib/auth-client";

/**
 * Session data structure from Better Auth
 * Using optional (?) for fields that may be undefined from the API
 */
interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionData {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Auth context value type
 */
interface AuthContextValue {
  /** Current user data or null if not authenticated */
  user: SessionUser | null;
  /** Current session data or null if not authenticated */
  session: SessionData | null;
  /** Whether authentication state is being loaded */
  isPending: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Error if session fetch failed */
  error: Error | null;
  /** Function to manually refresh session */
  refetch: () => void;
}

/**
 * Auth context with default values
 */
const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isPending: true,
  isAuthenticated: false,
  error: null,
  refetch: () => {},
});

/**
 * AuthProvider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider Component
 *
 * Wraps the application with authentication context.
 * Use useAuth() hook in child components to access auth state.
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * <AuthProvider>
 *   {children}
 * </AuthProvider>
 *
 * // In a component
 * const { user, isAuthenticated } = useAuth();
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const {
    data: sessionData,
    isPending,
    error,
    refetch,
  } = useSession();

  const value: AuthContextValue = {
    user: sessionData?.user ?? null,
    session: sessionData?.session ?? null,
    isPending,
    isAuthenticated: !!sessionData?.user,
    error: error ?? null,
    refetch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 *
 * Access authentication state from any component within AuthProvider.
 *
 * @returns AuthContextValue with user, session, and auth state
 *
 * @example
 * ```tsx
 * function UserMenu() {
 *   const { user, isAuthenticated, isPending } = useAuth();
 *
 *   if (isPending) return <Skeleton />;
 *   if (!isAuthenticated) return <LoginButton />;
 *   return <div>Welcome, {user.name}!</div>;
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

/**
 * Export AuthContext for advanced usage
 */
export { AuthContext };
