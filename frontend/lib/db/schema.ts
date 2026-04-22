/**
 * Drizzle ORM Schema for Better Auth
 *
 * Defines the database schema for user authentication with Better Auth.
 * Tables: user, session, account, verification
 *
 * @see https://www.better-auth.com/docs/adapters/drizzle
 */

import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";

/**
 * User table - stores user profile and authentication data
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Session table - stores active user sessions
 */
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Account table - stores OAuth provider accounts linked to users
 */
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Verification table - stores verification tokens for email verification and password reset
 */
export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

// -----------------------------------------------------------------------------
// TypeScript Type Exports
// -----------------------------------------------------------------------------

/**
 * User type for SELECT queries
 */
export type User = typeof user.$inferSelect;

/**
 * User type for INSERT queries
 */
export type NewUser = typeof user.$inferInsert;

/**
 * Session type for SELECT queries
 */
export type Session = typeof session.$inferSelect;

/**
 * Session type for INSERT queries
 */
export type NewSession = typeof session.$inferInsert;

/**
 * Account type for SELECT queries
 */
export type Account = typeof account.$inferSelect;

/**
 * Account type for INSERT queries
 */
export type NewAccount = typeof account.$inferInsert;

/**
 * Verification type for SELECT queries
 */
export type Verification = typeof verification.$inferSelect;

/**
 * Verification type for INSERT queries
 */
export type NewVerification = typeof verification.$inferInsert;

// -----------------------------------------------------------------------------
// Chat History Tables
// -----------------------------------------------------------------------------

/**
 * Chat Session table - stores user chat sessions/conversations
 */
export const chatSession = pgTable(
  "chat_session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("chat_session_user_id_idx").on(table.userId)]
);

/**
 * Chat Message table - stores individual messages within a chat session
 */
export const chatMessage = pgTable(
  "chat_message",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => chatSession.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // 'user' | 'assistant'
    content: text("content").notNull(),
    citations: text("citations"), // JSON string of Citation[]
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("chat_message_session_id_idx").on(table.sessionId)]
);

// -----------------------------------------------------------------------------
// Chat History Type Exports
// -----------------------------------------------------------------------------

/**
 * ChatSession type for SELECT queries
 */
export type ChatSession = typeof chatSession.$inferSelect;

/**
 * ChatSession type for INSERT queries
 */
export type NewChatSession = typeof chatSession.$inferInsert;

/**
 * ChatMessage type for SELECT queries
 */
export type ChatMessage = typeof chatMessage.$inferSelect;

/**
 * ChatMessage type for INSERT queries
 */
export type NewChatMessage = typeof chatMessage.$inferInsert;
