/**
 * InstantChatModal Component
 *
 * Slide-up chat modal for instant chat access.
 * Integrates ChatKitPanel for full chat functionality.
 */

"use client";

import { useCallback, useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minimize2, Maximize2 } from "lucide-react";
import { ChatKitPanel, type FactAction } from "@/components/ChatKitPanel";
import { useColorScheme, type ColorScheme } from "@/hooks/useColorScheme";
import { useChatHistory } from "@/hooks/useChatHistory";
import { cn } from "@/lib/utils";

interface InstantChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstantChatModal({ open, onOpenChange }: InstantChatModalProps) {
  const { scheme, setScheme } = useColorScheme();
  const [isMinimized, setIsMinimized] = useState(false);

  // Chat history management for instant chat
  const {
    sessionId,
    session,
    messages: historyMessages,
    isLoading: historyLoading,
    clearSession,
    addMessage,
  } = useChatHistory({
    initialSessionId: undefined, // Start with a new session each time
    autoSave: true,
  });

  const handleWidgetAction = useCallback(async (action: FactAction) => {
    console.log("[InstantChatModal] Widget action:", action);
  }, []);

  const handleResponseEnd = useCallback(() => {
    // Response completed
  }, []);

  const handleThemeRequest = useCallback(
    (requestedScheme: ColorScheme) => {
      setScheme(requestedScheme);
    },
    [setScheme]
  );

  const handleSaveMessage = useCallback(
    async (
      role: "user" | "assistant",
      content: string,
      citations?: { title: string; url: string; excerpt?: string; score?: number }[]
    ) => {
      await addMessage(role, content, citations);
    },
    [addMessage]
  );

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Backdrop - stays mounted, opacity controlled by isMinimized */}
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isMinimized ? 0 : 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            {/* Modal */}
            <Dialog.Content asChild>
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{
                  y: isMinimized ? "calc(100% - 56px)" : 0,
                  opacity: 1,
                }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={cn(
                  "fixed z-50",
                  "bottom-0 right-0 sm:bottom-4 sm:right-4",
                  "w-full sm:w-[400px] md:w-[450px]",
                  "h-[80vh] sm:h-[600px] max-h-[80vh]",
                  "rounded-t-2xl sm:rounded-2xl",
                  "bg-background border border-border shadow-2xl",
                  "flex flex-col overflow-hidden"
                )}
              >
                {/* Header */}
                <div
                  className={cn(
                    "flex items-center justify-between px-4 py-3",
                    "border-b border-border bg-background-secondary",
                    "cursor-pointer"
                  )}
                  onClick={toggleMinimize}
                >
                  <Dialog.Title className="font-semibold text-foreground">
                    AI Assistant
                  </Dialog.Title>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMinimize();
                      }}
                      className={cn(
                        "p-2 rounded-lg",
                        "text-foreground-muted hover:text-foreground",
                        "hover:bg-hover-bg transition-colors"
                      )}
                      aria-label={isMinimized ? "Maximize" : "Minimize"}
                    >
                      {isMinimized ? (
                        <Maximize2 className="w-4 h-4" />
                      ) : (
                        <Minimize2 className="w-4 h-4" />
                      )}
                    </button>
                    <Dialog.Close asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          "p-2 rounded-lg",
                          "text-foreground-muted hover:text-foreground",
                          "hover:bg-hover-bg transition-colors"
                        )}
                        aria-label="Close"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </Dialog.Close>
                  </div>
                </div>

                {/* Chat content - hidden when minimized */}
                {!isMinimized && (
                  <div className="flex-1 overflow-hidden">
                    <ChatKitPanel
                      theme={scheme}
                      onWidgetAction={handleWidgetAction}
                      onResponseEnd={handleResponseEnd}
                      onThemeRequest={handleThemeRequest}
                      sessionId={sessionId}
                      initialMessages={historyMessages}
                      onSaveMessage={handleSaveMessage}
                    />
                  </div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

export default InstantChatModal;
