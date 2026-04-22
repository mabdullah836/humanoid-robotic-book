/**
 * ChatHeader Component
 *
 * Header for the chat area with title, theme toggle, and mobile sidebar toggle.
 */

"use client";

import { Bot, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  title?: string;
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

export function ChatHeader({
  title = "AI Assistant",
  onMenuToggle,
  showMenuButton = false,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        {showMenuButton && onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className={cn(
              "lg:hidden p-2 rounded-lg",
              "text-foreground-muted hover:text-foreground",
              "hover:bg-hover-bg transition-colors"
            )}
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Bot icon and title */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">{title}</h1>
            <p className="text-xs text-foreground-muted">
              Powered by RAG
            </p>
          </div>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle size="sm" />
      </div>
    </header>
  );
}

export default ChatHeader;
