/**
 * Theme Constants
 *
 * Color palette, gradients, and design tokens for the unified theme.
 * Used across landing page, chat, and all UI components.
 */

export const THEME_COLORS = {
  // Primary - Indigo
  primary: "#6366f1",
  primaryDark: "#4f46e5",
  primaryLight: "#818cf8",

  // Secondary - Violet
  secondary: "#8b5cf6",
  secondaryDark: "#7c3aed",
  secondaryLight: "#a78bfa",

  // Accent - Emerald
  accent: "#10b981",
  accentDark: "#059669",
  accentLight: "#34d399",

  // Neutrals - Light Theme
  light: {
    bg: "#ffffff",
    bgSecondary: "#f8fafc",
    bgTertiary: "#f1f5f9",
    bgElevated: "#ffffff",
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    border: "#e2e8f0",
    hoverBg: "rgba(0, 0, 0, 0.04)",
  },

  // Neutrals - Dark Theme
  dark: {
    bg: "#0a0a0f",
    bgSecondary: "#141419",
    bgTertiary: "#1e1e26",
    bgElevated: "#1a1a22",
    textPrimary: "#f4f4f5",
    textSecondary: "#a1a1aa",
    textMuted: "#71717a",
    border: "#27272a",
    hoverBg: "rgba(255, 255, 255, 0.06)",
  },
} as const;

export const GRADIENTS = {
  primary: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  primaryHover: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  accent: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
} as const;

export const SHADOWS = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  fab: "0 8px 24px rgba(99, 102, 241, 0.35)",
  fabHover: "0 12px 32px rgba(99, 102, 241, 0.45)",
} as const;

export const TRANSITIONS = {
  fast: "150ms ease",
  default: "200ms ease",
  slow: "300ms ease",
  theme: "300ms ease-in-out",
} as const;

export const BREAKPOINTS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export const NAVBAR_HEIGHT = 64;

export type ThemeMode = "light" | "dark" | "system";
