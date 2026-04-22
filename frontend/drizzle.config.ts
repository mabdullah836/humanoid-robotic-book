/**
 * Drizzle Kit Configuration
 *
 * Configuration file for Drizzle Kit CLI commands:
 * - npx drizzle-kit generate  : Generate SQL migration files
 * - npx drizzle-kit migrate   : Apply migrations to database
 * - npx drizzle-kit studio    : Open Drizzle Studio GUI
 * - npx drizzle-kit push      : Push schema changes directly (dev only)
 *
 * @see https://orm.drizzle.team/kit-docs/config-reference
 */

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment variables from .env.local for local development
config({ path: ".env.local" });

export default defineConfig({
  // Path to the schema file(s)
  schema: "./lib/db/schema.ts",

  // Output directory for generated migration files
  out: "./drizzle",

  // Database dialect
  dialect: "postgresql",

  // Database connection credentials
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  // Enable verbose logging during migrations
  verbose: true,

  // Enable strict mode for type checking
  strict: true,
});
