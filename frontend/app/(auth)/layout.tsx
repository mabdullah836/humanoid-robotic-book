"use client";

/**
 * Auth Route Group Layout
 *
 * Shared layout for authentication pages (/login, /register).
 * Provides:
 * - Centered page layout
 * - Redirect for already authenticated users
 * - Consistent styling for auth pages
 * - Dark/light mode toggle
 *
 * Route Group: (auth)
 * Applies to: /login, /register
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { Moon, Sun, BookOpen, Loader2 } from "lucide-react";

/**
 * Auth Layout Props
 */
interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Loading spinner component
 */
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-foreground-secondary">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Theme Toggle Button
 */
function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className="h-10 w-10 rounded-lg bg-foreground-muted/10 animate-pulse" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg",
        "border border-border bg-background",
        "text-foreground-secondary hover:text-foreground",
        "hover:bg-hover-bg transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary/50"
      )}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}

/**
 * Auth Layout Component
 *
 * Redirects authenticated users away from auth pages to /chat.
 * Shows loading state while checking authentication.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isPending } = useAuth();

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (!isPending && isAuthenticated) {
      router.replace("/chat");
    }
  }, [isAuthenticated, isPending, router]);

  // Show loading while checking auth state
  if (isPending) {
    return <LoadingSpinner />;
  }

  // If authenticated, show loading while redirecting
  if (isAuthenticated) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="py-4 px-4 border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 text-xl font-semibold",
              "text-foreground hover:text-primary transition-colors"
            )}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="hidden sm:inline">Physical AI & Humanoid Robotics</span>
            <span className="sm:hidden">Robotics AI</span>
          </Link>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-foreground-muted">
            Interactive textbook chatbot for robotics education
          </p>
        </div>
      </footer>
    </div>
  );
}
