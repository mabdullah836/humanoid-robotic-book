/**
 * LoginPromptModal Component
 *
 * Modal prompting unauthenticated users to login/signup before using chat.
 */

"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X, LogIn, UserPlus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginPromptModal({ open, onOpenChange }: LoginPromptModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            {/* Modal */}
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.3 }}
                className={cn(
                  "fixed z-50",
                  "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                  "w-full max-w-md p-6 rounded-2xl",
                  "bg-background border border-border shadow-xl"
                )}
              >
                {/* Close button */}
                <Dialog.Close asChild>
                  <button
                    className={cn(
                      "absolute top-4 right-4 p-2 rounded-lg",
                      "text-foreground-muted hover:text-foreground",
                      "hover:bg-hover-bg transition-colors"
                    )}
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Close>

                {/* Content */}
                <div className="text-center">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>

                  {/* Title */}
                  <Dialog.Title className="text-xl font-bold text-foreground mb-2">
                    Sign in to Chat
                  </Dialog.Title>

                  {/* Description */}
                  <Dialog.Description className="text-foreground-secondary mb-6">
                    Create an account or sign in to access the AI assistant and
                    save your conversation history.
                  </Dialog.Description>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Link
                      href="/login"
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        "w-full inline-flex items-center justify-center gap-2",
                        "px-4 py-3 rounded-lg font-medium",
                        "bg-gradient-primary text-white",
                        "hover:opacity-90 transition-opacity"
                      )}
                    >
                      <LogIn className="w-5 h-5" />
                      Sign In
                    </Link>

                    <Link
                      href="/register"
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        "w-full inline-flex items-center justify-center gap-2",
                        "px-4 py-3 rounded-lg font-medium",
                        "border border-border text-foreground",
                        "hover:bg-hover-bg transition-colors"
                      )}
                    >
                      <UserPlus className="w-5 h-5" />
                      Create Account
                    </Link>
                  </div>

                  {/* Footer note */}
                  <p className="mt-4 text-xs text-foreground-muted">
                    Free to use. No credit card required.
                  </p>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

export default LoginPromptModal;
