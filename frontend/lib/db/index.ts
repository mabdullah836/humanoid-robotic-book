/**
 * Drizzle ORM Database Connection
 *
 * Uses Neon HTTP driver for serverless PostgreSQL connection.
 * This configuration is optimized for Next.js serverless functions.
 *
 * @see https://orm.drizzle.team/docs/get-started-postgresql#neon
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Get the database URL from environment variables.
 * Returns a placeholder during build time to prevent errors.
 */
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // During build time, return a placeholder to prevent initialization errors.
    // The actual runtime will have the proper DATABASE_URL set.
    if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
      // In production (non-Vercel), require DATABASE_URL
      console.warn(
        "DATABASE_URL environment variable is not set. " +
        "Database operations will fail until it is configured."
      );
    }
    // Return a dummy URL that will fail gracefully if actually used
    return "postgresql://placeholder:placeholder@placeholder/placeholder";
  }
  return url;
}

/**
 * Create a Neon SQL query function using the DATABASE_URL environment variable.
 * The neon() function returns a SQL tagged template function for HTTP-based queries.
 */
const sql = neon(getDatabaseUrl());

/**
 * Drizzle ORM database instance configured with:
 * - Neon HTTP driver for serverless compatibility
 * - Schema import for type-safe queries and relations
 *
 * @example
 * import { db } from "@/lib/db";
 * import { user } from "@/lib/db/schema";
 *
 * const users = await db.select().from(user);
 */
export const db = drizzle(sql, { schema });

/**
 * Export the raw SQL function for direct queries when needed.
 * Use sparingly - prefer Drizzle's type-safe query builder.
 */
export { sql };
