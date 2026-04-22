/**
 * FloatingChatButton Component
 *
 * Floating action button (FAB) for instant chat access.
 * Shows on all pages except /chat.
 */

"use client";

import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FloatingChatButtonProps {
  onClick: () => void;
}

export function FloatingChatButton({ onClick }: FloatingChatButtonProps) {
  const pathname = usePathname();

  // Don't show on chat page
  if (pathname === "/chat" || pathname.startsWith("/chat/")) {
    return null;
  }

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", duration: 0.5, delay: 0.5 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "w-14 h-14 rounded-full",
        "bg-gradient-primary shadow-fab",
        "flex items-center justify-center",
        "transition-shadow duration-200",
        "hover:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
        "animate-pulse-ring"
      )}
      aria-label="Open chat"
      title="Ask AI Assistant"
    >
      <MessageSquare className="w-6 h-6 text-on-primary" />
    </motion.button>
  );
}

export default FloatingChatButton;
