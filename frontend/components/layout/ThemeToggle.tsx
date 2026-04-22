/**
 * ThemeToggle Component
 *
 * A toggle button for switching between light and dark themes.
 * Uses sun/moon icons with smooth transition animation.
 */

"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "p-1.5",
  md: "p-2",
  lg: "p-2.5",
};

const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
};

export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  // Prevent hydration mismatch by showing a placeholder until mounted
  if (!mounted) {
    return (
      <button
        className={cn(
          "rounded-lg border border-border bg-background-secondary",
          "hover:bg-hover-bg transition-colors duration-200",
          sizeClasses[size],
          className
        )}
        aria-label="Toggle theme"
        disabled
      >
        <div
          className="animate-pulse bg-foreground-muted rounded"
          style={{
            width: iconSizes[size],
            height: iconSizes[size],
          }}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        toggleTheme();
      }}
      className={cn(
        "rounded-xl border border-border bg-background-secondary",
        "hover:bg-background-tertiary hover:border-foreground-muted/30",
        "transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
        sizeClasses[size],
        className
      )}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
    >
      <span
        className="relative block"
        style={{ width: iconSizes[size], height: iconSizes[size] }}
      >
        <Sun
          size={iconSizes[size]}
          className={cn(
            "absolute inset-0 text-foreground transition-all duration-200",
            theme === "light"
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 rotate-90 scale-0 pointer-events-none"
          )}
          aria-hidden
        />
        <Moon
          size={iconSizes[size]}
          className={cn(
            "absolute inset-0 text-foreground transition-all duration-200",
            theme === "dark"
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 -rotate-90 scale-0 pointer-events-none"
          )}
          aria-hidden
        />
      </span>
    </button>
  );
}

export default ThemeToggle;
