/**
 * Chat History API Routes
 *
 * Provides endpoints for managing chat sessions and messages.
 * All operations require authentication via Better Auth session.
 *
 * @module app/api/chat/history/route
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  getChatSessions,
  createChatSession,
  generateTitleFromContent,
  deleteAllChatSessions,
} from "@/lib/api/chat-history";

/**
 * GET /api/chat/history
 *
 * List all chat sessions for the authenticated user.
 * Returns sessions ordered by most recent update.
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Get the session from Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          detail: "You must be logged in to view chat history",
        },
        { status: 401 }
      );
    }

    // Get all sessions for the user
    const sessions = await getChatSessions(session.user.id);

    return NextResponse.json({
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error("[Chat History API] GET error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        detail: "Failed to retrieve chat history",
      },
      { status: 500 }
    );
  }
}

/**
 * Request body for creating a new chat session
 */
interface CreateSessionBody {
  title?: string;
  firstMessage?: string;
}

/**
 * POST /api/chat/history
 *
 * Create a new chat session for the authenticated user.
 * Optionally accepts a title or first message to generate title from.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the session from Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          detail: "You must be logged in to create a chat session",
        },
        { status: 401 }
      );
    }

    // Parse the request body
    let body: CreateSessionBody = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Empty body is acceptable - title will be null
    }

    // Generate title from first message if provided
    let title = body.title;
    if (!title && body.firstMessage) {
      title = generateTitleFromContent(body.firstMessage);
    }

    // Create the new session
    const chatSessionResult = await createChatSession(session.user.id, title);

    return NextResponse.json(
      {
        session: chatSessionResult,
        message: "Chat session created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Chat History API] POST error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        detail: "Failed to create chat session",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/history
 *
 * Delete all chat sessions for the authenticated user.
 * This is a destructive operation that removes all conversations and messages.
 */
export async function DELETE(): Promise<NextResponse> {
  try {
    // Get the session from Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          detail: "You must be logged in to delete chat history",
        },
        { status: 401 }
      );
    }

    // Get count before deletion for response
    const sessions = await getChatSessions(session.user.id);
    const deletedCount = sessions.length;

    // Delete all sessions for the user (cascade deletes messages)
    await deleteAllChatSessions(session.user.id);

    return NextResponse.json({
      message: "All chat sessions deleted successfully",
      deletedCount,
    });
  } catch (error) {
    console.error("[Chat History API] DELETE error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        detail: "Failed to delete chat history",
      },
      { status: 500 }
    );
  }
}
