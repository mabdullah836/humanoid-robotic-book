/**
 * ChatSidebar Component
 *
 * Sidebar panel with conversation history, new chat button, and date grouping.
 */

"use client";

import { useMemo } from "react";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { formatConversationDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  updatedAt: Date | string;
  messageCount?: number;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId?: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation?: (id: string) => void;
  isLoading?: boolean;
}

interface GroupedConversations {
  [key: string]: Conversation[];
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isLoading = false,
}: ChatSidebarProps) {
  // Group conversations by date
  const groupedConversations = useMemo(() => {
    const groups: GroupedConversations = {};

    conversations.forEach((conv) => {
      const dateKey = formatConversationDate(conv.updatedAt);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(conv);
    });

    // Sort groups by date (most recent first)
    const sortOrder = ["Today", "Yesterday", "Last 7 days"];
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const aIndex = sortOrder.indexOf(a);
      const bIndex = sortOrder.indexOf(b);

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // For date strings, sort by date descending
      return new Date(b).getTime() - new Date(a).getTime();
    });

    return sortedKeys.map((key) => ({
      label: key,
      conversations: groups[key],
    }));
  }, [conversations]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with New Chat button */}
      <div className="p-4 border-b border-border">
        <button
          onClick={onNewChat}
          className={cn(
            "w-full flex items-center justify-center gap-2",
            "px-4 py-2.5 rounded-lg",
            "bg-gradient-primary text-white font-medium",
            "hover:opacity-90 transition-opacity"
          )}
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-foreground-muted/20 rounded w-20 mb-2" />
                <div className="space-y-2">
                  <div className="h-10 bg-foreground-muted/10 rounded" />
                  <div className="h-10 bg-foreground-muted/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquare className="w-10 h-10 text-foreground-muted mx-auto mb-2" />
            <p className="text-sm text-foreground-muted">
              No conversations yet
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              Start a new chat to begin
            </p>
          </div>
        ) : (
          <div className="p-2">
            {groupedConversations.map((group) => (
              <div key={group.label} className="mb-4">
                {/* Date group label */}
                <div className="px-2 py-1 text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  {group.label}
                </div>

                {/* Conversations in group */}
                <div className="space-y-1">
                  {group.conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        "group relative flex items-center gap-2",
                        "px-3 py-2.5 rounded-lg cursor-pointer",
                        "transition-colors",
                        activeConversationId === conv.id
                          ? "bg-primary/10 text-primary"
                          : "text-foreground-secondary hover:bg-hover-bg"
                      )}
                      onClick={() => onSelectConversation(conv.id)}
                    >
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 truncate text-sm">
                        {conv.title}
                      </span>

                      {/* Delete button */}
                      {onDeleteConversation && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conv.id);
                          }}
                          className={cn(
                            "opacity-0 group-hover:opacity-100",
                            "p-1 rounded",
                            "text-foreground-muted hover:text-red-500",
                            "hover:bg-red-500/10 transition-all"
                          )}
                          aria-label={`Delete ${conv.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-foreground-muted text-center">
          {conversations.length} conversation{conversations.length !== 1 && "s"}
        </p>
      </div>
    </div>
  );
}

export default ChatSidebar;
