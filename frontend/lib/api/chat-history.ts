/**
 * Chat History Service
 *
 * Provides database operations for chat sessions and messages.
 * Uses Drizzle ORM with PostgreSQL for persistent storage.
 *
 * @module lib/api/chat-history
 */

import { db } from "@/lib/db";
import {
  chatSession,
  chatMessage,
  type ChatSession,
  type ChatMessage,
} from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

/**
 * Chat session with message count for list views
 */
export interface ChatSessionWithCount extends ChatSession {
  messageCount: number;
}

/**
 * Create a new chat session for a user
 *
 * @param userId - The user's ID
 * @param title - Optional title for the session
 * @returns The created chat session
 */
export async function createChatSession(
  userId: string,
  title?: string
): Promise<ChatSession> {
  const id = crypto.randomUUID();
  const now = new Date();

  const [session] = await db
    .insert(chatSession)
    .values({
      id,
      userId,
      title: title || null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return session;
}

/**
 * Get all chat sessions for a user, ordered by most recent
 *
 * @param userId - The user's ID
 * @returns Array of chat sessions with message counts
 */
export async function getChatSessions(
  userId: string
): Promise<ChatSessionWithCount[]> {
  // Get sessions with message counts using a subquery
  const sessions = await db
    .select({
      session: chatSession,
      messageCount: count(chatMessage.id),
    })
    .from(chatSession)
    .leftJoin(chatMessage, eq(chatSession.id, chatMessage.sessionId))
    .where(eq(chatSession.userId, userId))
    .groupBy(chatSession.id)
    .orderBy(desc(chatSession.updatedAt));

  return sessions.map((row) => ({
    ...row.session,
    messageCount: row.messageCount,
  }));
}

/**
 * Get a specific chat session by ID
 * Validates that the session belongs to the specified user
 *
 * @param sessionId - The session ID
 * @param userId - The user's ID (for ownership validation)
 * @returns The chat session or null if not found/unauthorized
 */
export async function getChatSession(
  sessionId: string,
  userId: string
): Promise<ChatSession | null> {
  const [session] = await db
    .select()
    .from(chatSession)
    .where(and(eq(chatSession.id, sessionId), eq(chatSession.userId, userId)))
    .limit(1);

  return session || null;
}

/**
 * Get all messages for a chat session, ordered by creation time
 *
 * @param sessionId - The session ID
 * @returns Array of chat messages
 */
export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
  return db
    .select()
    .from(chatMessage)
    .where(eq(chatMessage.sessionId, sessionId))
    .orderBy(chatMessage.createdAt);
}

/**
 * Add a message to a chat session
 *
 * @param sessionId - The session ID
 * @param role - The message role ('user' | 'assistant')
 * @param content - The message content
 * @param citations - Optional JSON string of citations
 * @returns The created message
 */
export async function addMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  citations?: string
): Promise<ChatMessage> {
  const id = crypto.randomUUID();

  const [message] = await db
    .insert(chatMessage)
    .values({
      id,
      sessionId,
      role,
      content,
      citations: citations || null,
      createdAt: new Date(),
    })
    .returning();

  // Update the session's updatedAt timestamp
  await db
    .update(chatSession)
    .set({ updatedAt: new Date() })
    .where(eq(chatSession.id, sessionId));

  return message;
}

/**
 * Update a chat session's title
 *
 * @param sessionId - The session ID
 * @param userId - The user's ID (for ownership validation)
 * @param title - The new title
 * @returns The updated session or null if not found/unauthorized
 */
export async function updateChatSessionTitle(
  sessionId: string,
  userId: string,
  title: string
): Promise<ChatSession | null> {
  const [session] = await db
    .update(chatSession)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(chatSession.id, sessionId), eq(chatSession.userId, userId)))
    .returning();

  return session || null;
}

/**
 * Delete a chat session and all its messages
 * Validates that the session belongs to the specified user
 *
 * @param sessionId - The session ID to delete
 * @param userId - The user's ID (for ownership validation)
 */
export async function deleteChatSession(
  sessionId: string,
  userId: string
): Promise<void> {
  // The cascade delete will automatically remove associated messages
  await db
    .delete(chatSession)
    .where(and(eq(chatSession.id, sessionId), eq(chatSession.userId, userId)));
}

/**
 * Delete all chat sessions for a user
 *
 * @param userId - The user's ID
 */
export async function deleteAllChatSessions(userId: string): Promise<void> {
  // The cascade delete will automatically remove associated messages
  await db.delete(chatSession).where(eq(chatSession.userId, userId));
}

/**
 * Get the message count for a chat session
 *
 * @param sessionId - The session ID
 * @returns The number of messages in the session
 */
export async function getMessageCount(sessionId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(chatMessage)
    .where(eq(chatMessage.sessionId, sessionId));

  return result?.count || 0;
}

/**
 * Generate a title from the first user message if no title is set
 *
 * @param content - The message content
 * @param maxLength - Maximum length of the generated title
 * @returns A truncated title
 */
export function generateTitleFromContent(
  content: string,
  maxLength: number = 50
): string {
  const trimmed = content.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  // Find the last space within maxLength to avoid cutting words
  const truncated = trimmed.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.5) {
    return truncated.substring(0, lastSpace) + "...";
  }
  return truncated + "...";
}
