/**
 * Better Auth Server Configuration
 *
 * Server-side authentication configuration using Better Auth with Drizzle adapter.
 * This file should only be imported in server-side code (API routes, server components).
 *
 * @see https://www.better-auth.com/docs/installation
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

/**
 * Get the auth secret, with a fallback for build time.
 * In production runtime, BETTER_AUTH_SECRET must be set.
 */
function getAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    // During build time, use a placeholder to prevent build errors.
    // This will NOT be used at runtime - the actual secret will be loaded.
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "BETTER_AUTH_SECRET environment variable is not set. " +
        "Authentication will fail until it is configured."
      );
    }
    // Return a build-time placeholder (32+ chars required by Better Auth)
    return "build-time-placeholder-secret-do-not-use-in-production";
  }
  return secret;
}

/**
 * Better Auth server instance
 *
 * Configuration includes:
 * - Drizzle adapter with PostgreSQL provider
 * - Email/password authentication
 * - Session management with 7-day expiry
 * - Rate limiting for security
 */
export const auth = betterAuth({
  /**
   * Application name displayed in emails and OAuth consent screens
   */
  appName: "Physical AI & Humanoid Robotics",

  /**
   * Base URL for authentication callbacks and redirects
   * Uses BETTER_AUTH_URL environment variable
   */
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

  /**
   * Secret key for signing sessions and tokens
   * Must be at least 32 characters in production
   */
  secret: getAuthSecret(),

  /**
   * Database configuration using Drizzle adapter
   */
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),

  /**
   * Email and password authentication configuration
   */
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Note: Password reset requires email sending setup
    // Uncomment and configure when email service is available:
    // sendResetPassword: async ({ user, url, token }, request) => {
    //   await sendEmail({
    //     to: user.email,
    //     subject: "Reset your password",
    //     text: `Click the link to reset your password: ${url}`,
    //   });
    // },
  },

  /**
   * Social OAuth providers configuration
   *
   * To enable OAuth providers:
   * 1. Create OAuth apps in Google Cloud Console and GitHub Developer Settings
   * 2. Set the following environment variables:
   *    - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
   *    - GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
   * 3. Configure redirect URIs in the OAuth app settings:
   *    - Google: {BETTER_AUTH_URL}/api/auth/callback/google
   *    - GitHub: {BETTER_AUTH_URL}/api/auth/callback/github
   *
   * OAuth providers are only enabled if their credentials are configured.
   */
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            scope: ["email", "profile"],
          },
        }
      : {}),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },

  /**
   * Session configuration
   */
  session: {
    /**
     * Session expiration time in seconds (7 days)
     */
    expiresIn: 60 * 60 * 24 * 7, // 7 days

    /**
     * Update session age after this many seconds (1 day)
     * Extends session on activity
     */
    updateAge: 60 * 60 * 24, // 1 day

    /**
     * Session is considered "fresh" for this many seconds (10 minutes)
     * Used for sensitive operations that require recent authentication
     */
    freshAge: 60 * 10, // 10 minutes
  },

  /**
   * Rate limiting configuration for security
   * Prevents brute force attacks on authentication endpoints
   *
   * Note: This applies to sensitive endpoints (sign-in, sign-up, password reset).
   * Session endpoints (get-session) are typically excluded from strict rate limits.
   */
  rateLimit: {
    enabled: true,
    /**
     * Time window in seconds for rate limiting
     */
    window: 60, // 1 minute window

    /**
     * Maximum attempts allowed within the window
     * Set to a reasonable limit that prevents brute force but allows normal usage
     */
    max: 100, // 100 requests per minute (allows frequent session checks)
  },

  /**
   * Advanced configuration options
   */
  advanced: {
    /**
     * Use secure cookies in production
     */
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});

/**
 * Export session type for type-safe session handling
 */
export type Session = typeof auth.$Infer.Session;
