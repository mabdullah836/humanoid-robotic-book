/**
 * ChatLayout Component
 *
 * Main layout for the chat page with sidebar and main chat area.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = "chat-sidebar-collapsed";

export function ChatLayout({ sidebar, children }: ChatLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (saved === "true") {
      setIsSidebarCollapsed(true);
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue));
      return newValue;
    });
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen((prev) => !prev);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "flex-shrink-0 border-r border-border bg-background-secondary",
          "transition-all duration-300 ease-in-out",
          // Desktop behavior
          "hidden lg:flex lg:flex-col",
          isSidebarCollapsed ? "lg:w-0 lg:border-r-0" : "lg:w-72",
          // Mobile behavior - slide from left
          "fixed lg:relative inset-y-0 left-0 z-50",
          isMobileSidebarOpen ? "flex flex-col w-72" : "hidden"
        )}
        style={{ top: 64 }} // Account for navbar
      >
        {/* Sidebar content with toggle */}
        <div
          className={cn(
            "flex flex-col h-full w-72",
            isSidebarCollapsed && "lg:hidden"
          )}
        >
          {sidebar}
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Mobile header with menu toggle */}
        <div className="lg:hidden flex items-center gap-2 px-4 py-2 border-b border-border">
          <button
            onClick={toggleMobileSidebar}
            className={cn(
              "p-2 rounded-lg",
              "text-foreground-muted hover:text-foreground",
              "hover:bg-hover-bg transition-colors"
            )}
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="font-medium text-foreground">Chat</span>
        </div>

        {/* Desktop toggle button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "hidden lg:flex absolute z-10",
            "w-6 h-12 items-center justify-center",
            "bg-background-secondary border border-border rounded-r-lg",
            "text-foreground-muted hover:text-foreground",
            "hover:bg-hover-bg transition-colors",
            "-ml-px top-1/2 -translate-y-1/2"
          )}
          style={{ left: isSidebarCollapsed ? 0 : "288px" }} // 72 * 4 = 288
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={cn(
              "w-4 h-4 transition-transform",
              isSidebarCollapsed ? "rotate-0" : "rotate-180"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Chat content */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </main>
    </div>
  );
}

export default ChatLayout;
