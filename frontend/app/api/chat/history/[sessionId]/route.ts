/**
 * Individual Chat Session API Routes
 *
 * Provides endpoints for managing a specific chat session.
 * All operations require authentication and ownership validation.
 *
 * @module app/api/chat/history/[sessionId]/route
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  getChatSession,
  getMessages,
  deleteChatSession,
  updateChatSessionTitle,
} from "@/lib/api/chat-history";

/**
 * Route context with sessionId parameter
 */
interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

/**
 * GET /api/chat/history/[sessionId]
 *
 * Get a specific chat session with all its messages.
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
          detail: "You must be logged in to view this chat session",
        },
        { status: 401 }
      );
    }

    // Get the chat session (validates ownership)
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
      session: chatSession,
      messages,
    });
  } catch (error) {
    console.error("[Chat Session API] GET error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        detail: "Failed to retrieve chat session",
      },
      { status: 500 }
    );
  }
}

/**
 * Request body for updating a chat session
 */
interface UpdateSessionBody {
  title?: string;
}

/**
 * PATCH /api/chat/history/[sessionId]
 *
 * Update a chat session (e.g., title).
 * Validates that the session belongs to the authenticated user.
 */
export async function PATCH(
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
          detail: "You must be logged in to update this chat session",
        },
        { status: 401 }
      );
    }

    // Parse the request body
    let body: UpdateSessionBody;
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

    // Validate title if provided
    if (body.title !== undefined && typeof body.title !== "string") {
      return NextResponse.json(
        {
          error: "Bad Request",
          detail: "Title must be a string",
        },
        { status: 400 }
      );
    }

    // Update the session (validates ownership)
    const updatedSession = await updateChatSessionTitle(
      sessionId,
      authSession.user.id,
      body.title || ""
    );

    if (!updatedSession) {
      return NextResponse.json(
        {
          error: "Not Found",
          detail: "Chat session not found or you do not have access",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      session: updatedSession,
      message: "Chat session updated successfully",
    });
  } catch (error) {
    console.error("[Chat Session API] PATCH error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        detail: "Failed to update chat session",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/history/[sessionId]
 *
 * Delete a chat session and all its messages.
 * Validates that the session belongs to the authenticated user.
 */
export async function DELETE(
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
          detail: "You must be logged in to delete this chat session",
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

    // Delete the session (cascade deletes messages)
    await deleteChatSession(sessionId, authSession.user.id);

    return NextResponse.json({
      message: "Chat session deleted successfully",
    });
  } catch (error) {
    console.error("[Chat Session API] DELETE error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        detail: "Failed to delete chat session",
      },
      { status: 500 }
    );
  }
}
