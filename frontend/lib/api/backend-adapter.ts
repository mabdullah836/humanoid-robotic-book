/**
 * Backend Adapter Service
 *
 * Transforms ChatKit requests to FastAPI backend format and vice versa.
 * Backend base URL is configured via NEXT_PUBLIC_BACKEND_URL (local or hosted).
 *
 * @module lib/api/backend-adapter
 */

import { BACKEND_URL } from "@/lib/config";


/**
 * Citation returned from the RAG backend
 */
export interface Citation {
  /** Title of the source document/chapter */
  title: string;
  /** URL path to the textbook section */
  url: string;
  /** Relevant text excerpt from the source */
  excerpt?: string;
  /** Relevance score (0-1) */
  score?: number;
}

/**
 * Request format expected by the FastAPI backend
 */
export interface BackendChatRequest {
  /** User's question (backend expects 'query' field) */
  query: string;
  /** Optional number of results to retrieve (1-10, default 5) */
  k?: number;
}

/**
 * Response format from the FastAPI backend
 */
export interface BackendChatResponse {
  /** Assistant's response text (backend returns 'answer' field) */
  answer: string;
  /** Citations from the RAG retrieval */
  citations: Citation[];
  /** Response metadata */
  metadata?: {
    chunks_retrieved?: number;
    processing_time_ms?: number;
    model?: string;
  };
}

/**
 * Nested detail object returned by FastAPI when detail is not a string
 */
export interface BackendErrorDetail {
  error?: string;
  message?: string;
  details?: { error_type?: string; [key: string]: unknown };
}

/**
 * Error response from the backend
 */
export interface BackendErrorResponse {
  detail?: string | BackendErrorDetail;
  error?: string;
  message?: string;
}

/**
 * Result of a chat request including parsed citations
 */
export interface ChatResult {
  /** Success status */
  success: boolean;
  /** Response message from assistant */
  message: string;
  /** Citations from RAG retrieval */
  citations: Citation[];
  /** Session ID for conversation continuity */
  sessionId: string;
  /** Error message if request failed */
  error?: string;
}

/**
 * Transform ChatKit-style request to FastAPI backend format
 *
 * @param message - User's message text
 * @param k - Optional number of results to retrieve (1-10, default 5)
 * @returns Formatted request body for backend API
 */
export function transformToBackendRequest(
  message: string,
  k?: number
): BackendChatRequest {
  return {
    query: message.trim(),
    ...(k && { k }),
  };
}

/**
 * Transform FastAPI backend response to ChatKit-compatible format
 *
 * @param response - Raw response from FastAPI backend
 * @returns Transformed result with citations parsed
 */
export function transformFromBackendResponse(
  response: BackendChatResponse
): ChatResult {
  // Handle both 'answer' (backend format) and 'response' (legacy format)
  const message = response.answer || (response as unknown as { response?: string }).response || "";

  // Debug logging
  if (typeof window !== "undefined") {
    console.log("[BackendAdapter] transformFromBackendResponse:", {
      rawResponse: response,
      extractedMessage: message,
      hasAnswer: Boolean(response.answer),
    });
  }

  return {
    success: Boolean(message),
    message,
    citations: response.citations || [],
    sessionId: "", // Backend doesn't return session_id currently
  };
}

/**
 * User-friendly messages for known backend error codes
 */
const ERROR_MESSAGES: Record<string, string> = {
  service_unavailable:
    "The AI service is temporarily unavailable. Please try again in a moment.",
  rate_limit_exceeded:
    "Too many requests. Please wait a minute before trying again.",
  validation_error: "Invalid request. Please check your message and try again.",
};

/**
 * Parse error response from backend
 *
 * @param errorData - Error response object
 * @param statusText - HTTP status text fallback
 * @returns Human-readable error message
 */
export function parseBackendError(
  errorData: BackendErrorResponse | unknown,
  statusText: string
): string {
  if (!errorData || typeof errorData !== "object") {
    return statusText || "An error occurred communicating with the backend";
  }

  const error = errorData as BackendErrorResponse;

  // Handle nested detail (FastAPI ErrorResponse: { error, message, details })
  if (error.detail) {
    if (typeof error.detail === "string") {
      return error.detail;
    }
    const detail = error.detail as BackendErrorDetail;
    const code = detail.error;
    const message = detail.message?.trim();
    if (code && ERROR_MESSAGES[code]) {
      return ERROR_MESSAGES[code];
    }
    if (message) {
      return message;
    }
    if (code) {
      return code;
    }
  }

  if (error.error) {
    return ERROR_MESSAGES[error.error] ?? error.error;
  }

  if (error.message) {
    return error.message;
  }

  return statusText || "An error occurred communicating with the backend";
}

/**
 * Send a chat message to the FastAPI backend
 *
 * @param message - User's message text
 * @param options - Request options
 * @param options.sessionId - Optional session ID for conversation continuity
 * @param options.token - JWT token for authentication
 * @param options.signal - AbortSignal for request cancellation
 * @returns Chat result with response and citations
 */
export async function sendChatMessage(
  message: string,
  options: {
    sessionId?: string;
    token?: string;
    signal?: AbortSignal;
    k?: number;
  } = {}
): Promise<ChatResult> {
  console.log("[BackendAdapter] sendChatMessage====>>>>", message, options);
  const { sessionId, token, signal, k } = options;

  const requestBody = transformToBackendRequest(message, k);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const chatUrl = `${BACKEND_URL.replace(/\/$/, "")}/api/v1/chat`;
    const response = await fetch(chatUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal,
    });
    console.log("[BackendAdapter] sendChatMessage response:", response);
    const rawText = await response.text();
    let data: BackendChatResponse | BackendErrorResponse;

    try {
      data = JSON.parse(rawText);
    } catch {
      return {
        success: false,
        message: "",
        citations: [],
        sessionId: sessionId || "",
        error: "Invalid response from backend",
      };
    }

    if (!response.ok) {
      const errorMessage = parseBackendError(data, response.statusText);
      return {
        success: false,
        message: "",
        citations: [],
        sessionId: sessionId || "",
        error: errorMessage,
      };
    }

    return transformFromBackendResponse(data as BackendChatResponse);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        message: "",
        citations: [],
        sessionId: sessionId || "",
        error: "Request was cancelled",
      };
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to communicate with backend";

    return {
      success: false,
      message: "",
      citations: [],
      sessionId: sessionId || "",
      error: errorMessage,
    };
  }
}

/**
 * Send a chat message through the local proxy endpoint
 * This route handles authentication and forwards to the backend
 *
 * @param message - User's message text
 * @param options - Request options
 * @param options.sessionId - Optional session ID for conversation continuity
 * @param options.signal - AbortSignal for request cancellation
 * @returns Chat result with response and citations
 */
export async function sendChatMessageViaProxy(
  message: string,
  options: {
    sessionId?: string;
    signal?: AbortSignal;
  } = {}
): Promise<ChatResult> {
  console.log("[BackendAdapter] sendChatMessageViaProxy", message, options);
  const { sessionId, signal } = options;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message.trim(),
        session_id: sessionId,
      }),
      signal,
      credentials: "include", // Include cookies for session
    });

    const rawText = await response.text();
    let data: BackendChatResponse | BackendErrorResponse;

    console.log("[BackendAdapter] sendChatMessageViaProxy raw response:", {
      status: response.status,
      ok: response.ok,
      rawText: rawText.slice(0, 500),
    });

    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("[BackendAdapter] Failed to parse JSON:", rawText);
      return {
        success: false,
        message: "",
        citations: [],
        sessionId: sessionId || "",
        error: "Invalid response from server",
      };
    }

    if (!response.ok) {
      const errorMessage = parseBackendError(data, response.statusText);
      console.error("[BackendAdapter] Response not OK:", errorMessage);
      return {
        success: false,
        message: "",
        citations: [],
        sessionId: sessionId || "",
        error: errorMessage,
      };
    }

    return transformFromBackendResponse(data as BackendChatResponse);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        message: "",
        citations: [],
        sessionId: sessionId || "",
        error: "Request was cancelled",
      };
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to communicate with server";

    return {
      success: false,
      message: "",
      citations: [],
      sessionId: sessionId || "",
      error: errorMessage,
    };
  }
}

/**
 * Format citations for display in chat UI
 *
 * @param citations - Array of citations from backend
 * @returns Formatted markdown string with citation links
 */
export function formatCitationsForDisplay(citations: Citation[]): string {
  if (!citations || citations.length === 0) {
    return "";
  }

  const citationLines = citations.map((citation, index) => {
    const scoreText = citation.score
      ? ` (relevance: ${Math.round(citation.score * 100)}%)`
      : "";
    return `${index + 1}. [${citation.title}](${citation.url})${scoreText}`;
  });

  return `\n\n**Sources:**\n${citationLines.join("\n")}`;
}

/**
 * Append citations to a response message
 *
 * @param message - Original response message
 * @param citations - Citations to append
 * @returns Message with formatted citations appended
 */
export function appendCitationsToMessage(
  message: string,
  citations: Citation[]
): string {
  const formattedCitations = formatCitationsForDisplay(citations);
  return `${message}${formattedCitations}`;
}
