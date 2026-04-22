/**
 * CitationDisplay Component Tests
 *
 * Unit tests for the citation display component.
 * Tests rendering of citations, empty states, and link behavior.
 *
 * @module __tests__/components/chat/CitationDisplay.test
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  CitationDisplay,
  CitationDisplayCompact,
} from "@/components/chat/CitationDisplay";
import type { Citation } from "@/lib/api/backend-adapter";

describe("CitationDisplay", () => {
  describe("Rendering with Citations", () => {
    it("should render a list of citations", () => {
      const citations: Citation[] = [
        {
          title: "Chapter 1: Introduction",
          url: "/docs/chapter-1",
        },
        {
          title: "Chapter 2: Robotics Basics",
          url: "/docs/chapter-2",
        },
      ];

      render(<CitationDisplay citations={citations} />);

      expect(screen.getByText("Chapter 1: Introduction")).toBeInTheDocument();
      expect(screen.getByText("Chapter 2: Robotics Basics")).toBeInTheDocument();
    });

    it("should display citation numbers", () => {
      const citations: Citation[] = [
        { title: "First Source", url: "/first" },
        { title: "Second Source", url: "/second" },
        { title: "Third Source", url: "/third" },
      ];

      render(<CitationDisplay citations={citations} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("should render citation URLs", () => {
      const citations: Citation[] = [
        { title: "Test Source", url: "https://example.com/docs/test" },
      ];

      render(<CitationDisplay citations={citations} />);

      expect(
        screen.getByText("https://example.com/docs/test")
      ).toBeInTheDocument();
    });

    it("should render citations as links", () => {
      const citations: Citation[] = [
        { title: "Link Source", url: "/docs/link" },
      ];

      render(<CitationDisplay citations={citations} />);

      const link = screen.getByRole("link", { name: /link source/i });
      expect(link).toHaveAttribute("href", "/docs/link");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("should display sources count header", () => {
      const citations: Citation[] = [
        { title: "Source 1", url: "/1" },
        { title: "Source 2", url: "/2" },
      ];

      render(<CitationDisplay citations={citations} />);

      expect(screen.getByText("Sources (2)")).toBeInTheDocument();
    });
  });

  describe("Excerpts", () => {
    it("should display excerpt when provided", () => {
      const citations: Citation[] = [
        {
          title: "With Excerpt",
          url: "/docs",
          excerpt: "This is a sample excerpt from the document.",
        },
      ];

      render(<CitationDisplay citations={citations} />);

      expect(
        screen.getByText("This is a sample excerpt from the document.")
      ).toBeInTheDocument();
    });

    it("should not display excerpt section when excerpt is empty", () => {
      const citations: Citation[] = [
        {
          title: "No Excerpt",
          url: "/docs",
          excerpt: "",
        },
      ];

      render(<CitationDisplay citations={citations} />);

      // Title should be there, but no excerpt paragraph
      expect(screen.getByText("No Excerpt")).toBeInTheDocument();
      // We can check there's no additional paragraph with excerpt content
      const paragraphs = screen.queryAllByRole("paragraph");
      // Filter to exclude any structural paragraphs
      expect(paragraphs.length).toBe(0);
    });
  });

  describe("Relevance Scores", () => {
    it("should display relevance score when provided", () => {
      const citations: Citation[] = [
        {
          title: "High Relevance",
          url: "/docs",
          score: 0.92,
        },
      ];

      render(<CitationDisplay citations={citations} />);

      expect(screen.getByText("92% relevant")).toBeInTheDocument();
    });

    it("should round score to nearest integer percentage", () => {
      const citations: Citation[] = [
        {
          title: "Score Test",
          url: "/docs",
          score: 0.567,
        },
      ];

      render(<CitationDisplay citations={citations} />);

      expect(screen.getByText("57% relevant")).toBeInTheDocument();
    });

    it("should apply green styling for high scores (>=80%)", () => {
      const citations: Citation[] = [
        {
          title: "High Score",
          url: "/docs",
          score: 0.85,
        },
      ];

      render(<CitationDisplay citations={citations} />);

      const badge = screen.getByText("85% relevant");
      expect(badge).toHaveClass("bg-green-100");
    });

    it("should apply yellow styling for medium scores (>=60%)", () => {
      const citations: Citation[] = [
        {
          title: "Medium Score",
          url: "/docs",
          score: 0.65,
        },
      ];

      render(<CitationDisplay citations={citations} />);

      const badge = screen.getByText("65% relevant");
      expect(badge).toHaveClass("bg-yellow-100");
    });

    it("should apply slate styling for low scores (<60%)", () => {
      const citations: Citation[] = [
        {
          title: "Low Score",
          url: "/docs",
          score: 0.45,
        },
      ];

      render(<CitationDisplay citations={citations} />);

      const badge = screen.getByText("45% relevant");
      expect(badge).toHaveClass("bg-slate-100");
    });

    it("should not display score badge when score is not provided", () => {
      const citations: Citation[] = [
        {
          title: "No Score",
          url: "/docs",
        },
      ];

      render(<CitationDisplay citations={citations} />);

      expect(screen.queryByText(/relevant/i)).not.toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should display empty state when citations array is empty", () => {
      render(<CitationDisplay citations={[]} />);

      expect(
        screen.getByText("No sources cited for this response.")
      ).toBeInTheDocument();
    });

    it("should display empty state when citations is undefined", () => {
      render(<CitationDisplay citations={undefined as unknown as Citation[]} />);

      expect(
        screen.getByText("No sources cited for this response.")
      ).toBeInTheDocument();
    });
  });

  describe("Custom className", () => {
    it("should apply custom className", () => {
      const citations: Citation[] = [{ title: "Test", url: "/test" }];

      const { container } = render(
        <CitationDisplay citations={citations} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });
});

describe("CitationDisplayCompact", () => {
  describe("Rendering", () => {
    it("should render citations inline", () => {
      const citations: Citation[] = [
        { title: "Source A", url: "/a" },
        { title: "Source B", url: "/b" },
      ];

      render(<CitationDisplayCompact citations={citations} />);

      expect(screen.getByText("Sources:")).toBeInTheDocument();
      expect(screen.getByText("Source A")).toBeInTheDocument();
      expect(screen.getByText("Source B")).toBeInTheDocument();
    });

    it("should render separator between citations", () => {
      const citations: Citation[] = [
        { title: "First", url: "/first" },
        { title: "Second", url: "/second" },
      ];

      render(<CitationDisplayCompact citations={citations} />);

      // Check for separator
      expect(screen.getByText("|")).toBeInTheDocument();
    });

    it("should render citations as links", () => {
      const citations: Citation[] = [{ title: "Link Test", url: "/link" }];

      render(<CitationDisplayCompact citations={citations} />);

      const link = screen.getByRole("link", { name: /link test/i });
      expect(link).toHaveAttribute("href", "/link");
    });
  });

  describe("Empty State", () => {
    it("should return null when citations is empty", () => {
      const { container } = render(<CitationDisplayCompact citations={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it("should return null when citations is undefined", () => {
      const { container } = render(
        <CitationDisplayCompact citations={undefined as unknown as Citation[]} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Custom className", () => {
    it("should apply custom className", () => {
      const citations: Citation[] = [{ title: "Test", url: "/test" }];

      const { container } = render(
        <CitationDisplayCompact citations={citations} className="compact-class" />
      );

      expect(container.firstChild).toHaveClass("compact-class");
    });
  });
});
