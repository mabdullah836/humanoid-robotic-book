/**
 * Error Constants
 *
 * Centralized error messages for consistent error handling across the application.
 * These constants ensure error messages are:
 * - Consistent across components
 * - Easy to maintain and update
 * - Properly typed for TypeScript
 *
 * @module lib/constants/errors
 */

/**
 * Authentication error messages
 */
export const AUTH_ERRORS = {
  // Sign-in errors
  INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
  EMAIL_NOT_FOUND: "No account found with this email address.",
  ACCOUNT_LOCKED: "Your account has been locked. Please contact support.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",

  // Sign-up errors
  EMAIL_ALREADY_EXISTS: "An account with this email already exists.",
  WEAK_PASSWORD: "Password must be at least 8 characters long.",
  PASSWORDS_DO_NOT_MATCH: "Passwords do not match.",
  INVALID_EMAIL: "Please enter a valid email address.",
  NAME_REQUIRED: "Name is required.",
  NAME_TOO_SHORT: "Name must be at least 2 characters.",

  // OAuth errors
  OAUTH_FAILED: "Failed to authenticate with provider. Please try again.",
  OAUTH_GOOGLE_FAILED: "Failed to sign in with Google. Please try again.",
  OAUTH_GITHUB_FAILED: "Failed to sign in with GitHub. Please try again.",
  OAUTH_ACCOUNT_LINK_FAILED: "Failed to link your account. Please try again.",

  // Sign-out errors
  SIGNOUT_FAILED: "Failed to sign out. Please try again.",

  // General auth errors
  UNAUTHORIZED: "You must be signed in to access this resource.",
  FORBIDDEN: "You do not have permission to access this resource.",
  GENERIC_AUTH_ERROR: "An authentication error occurred. Please try again.",
} as const;

/**
 * Chat/API error messages
 */
export const CHAT_ERRORS = {
  // Backend communication errors
  BACKEND_UNAVAILABLE: "The chat service is temporarily unavailable. Please try again later.",
  BACKEND_TIMEOUT: "The request timed out. Please try again.",
  BACKEND_ERROR: "An error occurred while processing your request.",
  INVALID_RESPONSE: "Received an invalid response from the server.",

  // Request errors
  REQUEST_CANCELLED: "Request was cancelled.",
  EMPTY_MESSAGE: "Please enter a message.",
  MESSAGE_TOO_LONG: "Message is too long. Please shorten it.",

  // Session errors
  SESSION_NOT_FOUND: "Chat session not found.",
  SESSION_LOAD_FAILED: "Failed to load chat history.",
  SESSION_CREATE_FAILED: "Failed to create a new chat session.",
  SESSION_DELETE_FAILED: "Failed to delete the chat session.",

  // Message errors
  MESSAGE_SEND_FAILED: "Failed to send message. Please try again.",
  MESSAGE_LOAD_FAILED: "Failed to load messages.",

  // Generic errors
  GENERIC_CHAT_ERROR: "An error occurred. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
} as const;

/**
 * Form validation error messages
 */
export const VALIDATION_ERRORS = {
  REQUIRED_FIELD: "This field is required.",
  INVALID_FORMAT: "Invalid format.",
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters.`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters.`,
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_URL: "Please enter a valid URL.",
} as const;

/**
 * HTTP status error messages
 */
export const HTTP_ERRORS: Record<number, string> = {
  400: "Bad request. Please check your input.",
  401: "You must be signed in to perform this action.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  408: "Request timed out. Please try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "An internal server error occurred.",
  502: "Service temporarily unavailable.",
  503: "Service temporarily unavailable.",
  504: "Gateway timeout. Please try again.",
} as const;

/**
 * Database error messages
 */
export const DATABASE_ERRORS = {
  CONNECTION_FAILED: "Failed to connect to database.",
  QUERY_FAILED: "Database query failed.",
  RECORD_NOT_FOUND: "Record not found.",
  DUPLICATE_KEY: "A record with this key already exists.",
  CONSTRAINT_VIOLATION: "Operation violates database constraints.",
  GENERIC_DB_ERROR: "A database error occurred.",
} as const;

/**
 * Get error message from HTTP status code
 */
export function getHttpErrorMessage(status: number): string {
  return HTTP_ERRORS[status] || `An error occurred (status: ${status})`;
}

/**
 * Type exports for error message keys
 */
export type AuthErrorKey = keyof typeof AUTH_ERRORS;
export type ChatErrorKey = keyof typeof CHAT_ERRORS;
export type ValidationErrorKey = keyof typeof VALIDATION_ERRORS;
export type DatabaseErrorKey = keyof typeof DATABASE_ERRORS;

/**
 * All error constants combined for convenience
 */
export const ERRORS = {
  AUTH: AUTH_ERRORS,
  CHAT: CHAT_ERRORS,
  VALIDATION: VALIDATION_ERRORS,
  HTTP: HTTP_ERRORS,
  DATABASE: DATABASE_ERRORS,
} as const;

export default ERRORS;
