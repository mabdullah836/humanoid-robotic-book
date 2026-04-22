/**
 * Chat Messages API Routes
 *
 * Provides endpoints for managing messages within a chat session.
 * All operations require authentication and session ownership validation.
 *
 * @module app/api/chat/history/[sessionId]/messages/route
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  getChatSession,
  getMessages,
  addMessage,
  updateChatSessionTitle,
  generateTitleFromContent,
} from "@/lib/api/chat-history";

/**
 * Route context with sessionId parameter
 */
interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

/**
 * GET /api/chat/history/[sessionId]/messages
 *
 * Get all messages for a specific chat session.
 * Validates that the session belongs to the authenticated user.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { sessionId } = await context.params;

    // Get the session from Better Auth
    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    // Check if user is authenticated
    if (!authSession || !authSession.user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          detail: "You must be logged in to view messages",
        },
        { status: 401 }
      );
    }

    // Verify the session exists and belongs to the user
    const chatSession = await getChatSession(sessionId, authSession.user.id);

    if (!chatSession) {
      return NextResponse.json(
        {
          error: "Not Found",
          detail: "Chat session not found or you do not have access",
        },
        { status: 404 }
      );
    }

    // Get all messages for this session
    const messages = await getMessages(sessionId);

    return NextResponse.json({
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error("[Chat Messages API] GET error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        detail: "Failed to retrieve messages",
      },
      { status: 500 }
    );
  }
}

/**
 * Request body for adding a new message
 */
interface AddMessageBody {
  role: "user" | "assistant";
  content: string;
  citations?: string;
}

/**
 * POST /api/chat/history/[sessionId]/messages
 *
 * Add a new message to a chat session.
 * Validates that the session belongs to the authenticated user.
 * Auto-generates session title from first user message if not set.
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { sessionId } = await context.params;

    // Get the session from Better Auth
    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    // Check if user is authenticated
    if (!authSession || !authSession.user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          detail: "You must be logged in to add messages",
        },
        { status: 401 }
      );
    }

    // Parse the request body
    let body: AddMessageBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Bad Request",
          detail: "Invalid JSON in request body",
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.role || !["user", "assistant"].includes(body.role)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          detail: "Role must be 'user' or 'assistant'",
        },
        { status: 400 }
      );
    }

    if (!body.content || typeof body.content !== "string") {
      return NextResponse.json(
        {
          error: "Bad Request",
          detail: "Content is required and must be a string",
        },
        { status: 400 }
      );
    }

    // Verify the session exists and belongs to the user
    const chatSession = await getChatSession(sessionId, authSession.user.id);

    if (!chatSession) {
      return NextResponse.json(
        {
          error: "Not Found",
          detail: "Chat session not found or you do not have access",
        },
        { status: 404 }
      );
    }

    // Add the message
    const message = await addMessage(
      sessionId,
      body.role,
      body.content,
      body.citations
    );

    // Auto-generate title from first user message if session has no title
    if (!chatSession.title && body.role === "user") {
      const existingMessages = await getMessages(sessionId);
      // Check if this is the first user message (only the newly added message exists)
      const userMessages = existingMessages.filter((m) => m.role === "user");
      if (userMessages.length === 1) {
        const generatedTitle = generateTitleFromContent(body.content);
        await updateChatSessionTitle(
          sessionId,
          authSession.user.id,
          generatedTitle
        );
      }
    }

    return NextResponse.json(
      {
        message,
        detail: "Message added successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Chat Messages API] POST error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        detail: "Failed to add message",
      },
      { status: 500 }
    );
  }
}
