/**
 * Constants Index
 *
 * Central export for all application constants.
 *
 * @module lib/constants
 */

export * from "./errors";
export * from "./theme";

/**
 * External URLs – all from env so local vs hosted is config-only.
 */
export const BOOK_URL = "https://mabdullah836.github.io/humanoid-robotic-book/";

/**
 * API Configuration (backend base URL; prefer NEXT_PUBLIC_BACKEND_URL from lib/config).
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:8000";
