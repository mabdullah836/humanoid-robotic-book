/**
 * ConversationList Component Tests
 *
 * Unit tests for the conversation list component.
 * Tests rendering, selection, deletion, and loading states.
 *
 * @module __tests__/components/chat/ConversationList.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ConversationList,
  type ChatSessionWithCount,
} from "@/components/chat/ConversationList";

// Mock date-fns
vi.mock("date-fns", () => ({
  formatDistanceToNow: vi.fn(() => "2 hours ago"),
}));

describe("ConversationList", () => {
  const mockSessions: ChatSessionWithCount[] = [
    {
      id: "session-1",
      userId: "user-1",
      title: "First Conversation",
      createdAt: "2025-12-14T10:00:00Z",
      updatedAt: "2025-12-14T12:00:00Z",
      messageCount: 5,
    },
    {
      id: "session-2",
      userId: "user-1",
      title: "Second Conversation",
      createdAt: "2025-12-13T10:00:00Z",
      updatedAt: "2025-12-13T15:00:00Z",
      messageCount: 10,
    },
    {
      id: "session-3",
      userId: "user-1",
      title: null,
      createdAt: "2025-12-12T10:00:00Z",
      updatedAt: "2025-12-12T10:00:00Z",
      messageCount: 1,
    },
  ];

  const defaultProps = {
    sessions: mockSessions,
    onSelectSession: vi.fn(),
    onDeleteSession: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render a list of conversations", () => {
      render(<ConversationList {...defaultProps} />);

      expect(screen.getByText("First Conversation")).toBeInTheDocument();
      expect(screen.getByText("Second Conversation")).toBeInTheDocument();
    });

    it("should display 'New Conversation' for sessions without title", () => {
      render(<ConversationList {...defaultProps} />);

      expect(screen.getByText("New Conversation")).toBeInTheDocument();
    });

    it("should display message counts", () => {
      render(<ConversationList {...defaultProps} />);

      expect(screen.getByText(/5 messages/)).toBeInTheDocument();
      expect(screen.getByText(/10 messages/)).toBeInTheDocument();
      expect(screen.getByText(/1 message$/)).toBeInTheDocument();
    });

    it("should display relative timestamps", () => {
      render(<ConversationList {...defaultProps} />);

      // All sessions should show "2 hours ago" due to our mock
      const timestamps = screen.getAllByText("2 hours ago");
      expect(timestamps.length).toBe(3);
    });

    it("should apply custom className", () => {
      const { container } = render(
        <ConversationList {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Selection", () => {
    it("should call onSelectSession when clicking a conversation", async () => {
      const user = userEvent.setup();
      const onSelectSession = vi.fn();

      render(
        <ConversationList {...defaultProps} onSelectSession={onSelectSession} />
      );

      await user.click(screen.getByText("First Conversation"));

      expect(onSelectSession).toHaveBeenCalledWith("session-1");
    });

    it("should highlight selected conversation", () => {
      render(
        <ConversationList {...defaultProps} selectedSessionId="session-1" />
      );

      const firstSession = screen
        .getByText("First Conversation")
        .closest("div[role='button']");
      expect(firstSession).toHaveClass("border-blue-500");
    });

    it("should support keyboard selection with Enter", async () => {
      const user = userEvent.setup();
      const onSelectSession = vi.fn();

      render(
        <ConversationList {...defaultProps} onSelectSession={onSelectSession} />
      );

      const firstSession = screen
        .getByText("First Conversation")
        .closest("div[role='button']");
      firstSession?.focus();
      await user.keyboard("{Enter}");

      expect(onSelectSession).toHaveBeenCalledWith("session-1");
    });

    it("should support keyboard selection with Space", async () => {
      const user = userEvent.setup();
      const onSelectSession = vi.fn();

      render(
        <ConversationList {...defaultProps} onSelectSession={onSelectSession} />
      );

      const firstSession = screen
        .getByText("First Conversation")
        .closest("div[role='button']");
      firstSession?.focus();
      await user.keyboard(" ");

      expect(onSelectSession).toHaveBeenCalledWith("session-1");
    });

    it("should have proper aria-selected attribute", () => {
      render(
        <ConversationList {...defaultProps} selectedSessionId="session-2" />
      );

      const firstSession = screen
        .getByText("First Conversation")
        .closest("div[role='button']");
      const secondSession = screen
        .getByText("Second Conversation")
        .closest("div[role='button']");

      expect(firstSession).toHaveAttribute("aria-selected", "false");
      expect(secondSession).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("Deletion", () => {
    it("should show delete button on hover (via opacity class)", () => {
      render(<ConversationList {...defaultProps} />);

      // Delete buttons should exist but have opacity-0 class
      const deleteButtons = screen.getAllByLabelText(/delete conversation/i);
      expect(deleteButtons.length).toBe(3);
      expect(deleteButtons[0]).toHaveClass("opacity-0");
    });

    it("should show confirmation dialog when delete is clicked", async () => {
      const user = userEvent.setup();
      render(<ConversationList {...defaultProps} />);

      const deleteButton = screen.getByLabelText(
        /delete conversation: first conversation/i
      );
      await user.click(deleteButton);

      // Should show Delete and Cancel buttons
      expect(screen.getByRole("button", { name: /^delete$/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it("should call onDeleteSession when deletion is confirmed", async () => {
      const user = userEvent.setup();
      const onDeleteSession = vi.fn().mockResolvedValue(undefined);

      render(
        <ConversationList {...defaultProps} onDeleteSession={onDeleteSession} />
      );

      // Click delete button
      const deleteButton = screen.getByLabelText(
        /delete conversation: first conversation/i
      );
      await user.click(deleteButton);

      // Confirm deletion
      await user.click(screen.getByRole("button", { name: /^delete$/i }));

      await waitFor(() => {
        expect(onDeleteSession).toHaveBeenCalledWith("session-1");
      });
    });

    it("should cancel deletion when cancel is clicked", async () => {
      const user = userEvent.setup();
      const onDeleteSession = vi.fn();

      render(
        <ConversationList {...defaultProps} onDeleteSession={onDeleteSession} />
      );

      // Click delete button
      const deleteButton = screen.getByLabelText(
        /delete conversation: first conversation/i
      );
      await user.click(deleteButton);

      // Cancel
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(onDeleteSession).not.toHaveBeenCalled();

      // Confirmation should be hidden
      expect(
        screen.queryByRole("button", { name: /^delete$/i })
      ).not.toBeInTheDocument();
    });

    it("should not trigger session selection when clicking delete", async () => {
      const user = userEvent.setup();
      const onSelectSession = vi.fn();

      render(
        <ConversationList {...defaultProps} onSelectSession={onSelectSession} />
      );

      const deleteButton = screen.getByLabelText(
        /delete conversation: first conversation/i
      );
      await user.click(deleteButton);

      expect(onSelectSession).not.toHaveBeenCalled();
    });
  });

  describe("Loading State", () => {
    it("should display loading skeleton when isLoading is true", () => {
      render(<ConversationList {...defaultProps} isLoading={true} />);

      // Should show skeleton elements
      const skeletons = screen.getAllByText("", { selector: ".animate-pulse" });
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should not display sessions when loading", () => {
      render(<ConversationList {...defaultProps} isLoading={true} />);

      expect(screen.queryByText("First Conversation")).not.toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should display empty state when sessions is empty", () => {
      render(<ConversationList {...defaultProps} sessions={[]} />);

      expect(screen.getByText("No conversations yet")).toBeInTheDocument();
      expect(
        screen.getByText("Start a new chat to see your history here")
      ).toBeInTheDocument();
    });

    it("should display chat icon in empty state", () => {
      render(<ConversationList {...defaultProps} sessions={[]} />);

      // Check for SVG element
      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have role=button on conversation items", () => {
      render(<ConversationList {...defaultProps} />);

      const buttons = screen.getAllByRole("button", { name: /conversation/i });
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should have tabIndex=0 for keyboard navigation", () => {
      render(<ConversationList {...defaultProps} />);

      const firstSession = screen
        .getByText("First Conversation")
        .closest("div[role='button']");
      expect(firstSession).toHaveAttribute("tabindex", "0");
    });

    it("should have aria-label on delete buttons", () => {
      render(<ConversationList {...defaultProps} />);

      expect(
        screen.getByLabelText(/delete conversation: first conversation/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/delete conversation: second conversation/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/delete conversation: new conversation/i)
      ).toBeInTheDocument();
    });
  });

  describe("Date Formatting", () => {
    it("should handle invalid dates gracefully", () => {
      const sessionsWithInvalidDate: ChatSessionWithCount[] = [
        {
          ...mockSessions[0],
          updatedAt: "invalid-date",
        },
      ];

      // Temporarily mock formatDistanceToNow to throw
      const { formatDistanceToNow } = vi.mocked(await import("date-fns"));
      formatDistanceToNow.mockImplementation(() => {
        throw new Error("Invalid date");
      });

      render(
        <ConversationList
          {...defaultProps}
          sessions={sessionsWithInvalidDate}
        />
      );

      expect(screen.getByText("Unknown date")).toBeInTheDocument();
    });
  });
});
