/**
 * InstantChatProvider Component
 *
 * Provider component that manages FAB and modal state.
 * Handles authentication check for chat access.
 */

"use client";

import { useState, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { FloatingChatButton } from "./FloatingChatButton";
import { LoginPromptModal } from "./LoginPromptModal";
import { InstantChatModal } from "./InstantChatModal";

export function InstantChatProvider() {
  const { data: session } = useSession();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  const handleFabClick = useCallback(() => {
    if (session?.user) {
      // Authenticated user - open chat modal
      setIsChatModalOpen(true);
    } else {
      // Unauthenticated user - show login prompt
      setIsLoginModalOpen(true);
    }
  }, [session]);

  return (
    <>
      {/* Floating Action Button */}
      <FloatingChatButton onClick={handleFabClick} />

      {/* Login Prompt Modal (for unauthenticated users) */}
      <LoginPromptModal
        open={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
      />

      {/* Chat Modal (for authenticated users) */}
      <InstantChatModal
        open={isChatModalOpen}
        onOpenChange={setIsChatModalOpen}
      />
    </>
  );
}

export default InstantChatProvider;
