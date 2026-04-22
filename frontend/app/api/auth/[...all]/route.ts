/**
 * Better Auth API Route Handler
 *
 * Catch-all route that handles all authentication API requests.
 * This mounts Better Auth's handler for:
 * - /api/auth/sign-up
 * - /api/auth/sign-in
 * - /api/auth/sign-out
 * - /api/auth/session
 * - /api/auth/get-session
 * - And other auth-related endpoints
 *
 * @see https://www.better-auth.com/docs/integrations/next
 */

import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Export GET and POST handlers for the catch-all route
 * Better Auth handles routing internally based on the request path
 */
export const { GET, POST } = toNextJsHandler(auth);
