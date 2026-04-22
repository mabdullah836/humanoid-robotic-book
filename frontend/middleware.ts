/**
 * Next.js Middleware for Authentication Protection
 *
 * Edge-compatible middleware that protects routes using Better Auth.
 * Checks session status via betterFetch and redirects unauthenticated users.
 *
 * @see https://www.better-auth.com/docs/integrations/nextjs
 */

import { betterFetch } from "@better-fetch/fetch";
import { NextRequest, NextResponse } from "next/server";

/**
 * Session response type from Better Auth
 */
interface SessionResponse {
  session: {
    id: string;
    userId: string;
    expiresAt: string;
  } | null;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
}

/**
 * Routes that require authentication
 * Users without a session will be redirected to login
 * Only include routes that have corresponding pages (no /profile or /settings yet)
 */
const protectedRoutes = ["/chat", "/history"];

/**
 * Routes that are always public
 * These routes do not require authentication
 */
const publicRoutes = ["/", "/book", "/login", "/register", "/api/auth"];

/**
 * Check if a path matches any of the given route prefixes
 */
function matchesRoute(path: string, routes: string[]): boolean {
  return routes.some((route) => {
    // Exact match
    if (path === route) return true;
    // Prefix match (for nested routes)
    if (path.startsWith(`${route}/`)) return true;
    return false;
  });
}

/**
 * Middleware function
 *
 * Runs on matched routes to check authentication status.
 * Redirects unauthenticated users to login with a callback URL.
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip middleware for public routes and API routes
  if (matchesRoute(path, publicRoutes)) {
    return NextResponse.next();
  }

  // Check if this is a protected route
  const isProtectedRoute = matchesRoute(path, protectedRoutes);

  if (!isProtectedRoute) {
    // Not a protected route, allow access
    return NextResponse.next();
  }

  // Fetch session from Better Auth API
  // Using betterFetch for Edge runtime compatibility
  try {
    const { data: session } = await betterFetch<SessionResponse>(
      "/api/auth/get-session",
      {
        baseURL: request.nextUrl.origin,
        headers: {
          // Forward cookies for session validation
          cookie: request.headers.get("cookie") || "",
        },
      }
    );

    // If no session or user, redirect to login
    if (!session?.user) {
      const loginUrl = new URL("/login", request.url);
      // Store the original URL as callback for post-login redirect
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }

    // User is authenticated, allow access
    return NextResponse.next();
  } catch (error) {
    // On error (e.g., network issues), redirect to login for safety
    console.error("[Middleware] Session check failed:", error);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }
}

/**
 * Middleware matcher configuration
 *
 * Excludes:
 * - API routes (handled separately)
 * - Static files
 * - Image optimization
 * - Favicon
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes) - except protected API routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
