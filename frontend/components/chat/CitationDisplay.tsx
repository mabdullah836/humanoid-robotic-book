"use client";

/**
 * Citation Display Component
 *
 * Displays citations from the RAG backend with links to textbook sections.
 * Shows title, URL, and optional excerpt with relevance score.
 *
 * @module components/chat/CitationDisplay
 */

import { type Citation } from "@/lib/api/backend-adapter";

interface CitationDisplayProps {
  /** Array of citations to display */
  citations: Citation[];
  /** Optional CSS class name */
  className?: string;
}

/**
 * Single citation item component
 */
function CitationItem({
  citation,
  index,
}: {
  citation: Citation;
  index: number;
}) {
  const hasExcerpt = citation.excerpt && citation.excerpt.trim().length > 0;
  const scorePercentage = citation.score
    ? Math.round(citation.score * 100)
    : null;

  return (
    <li className="group rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-750">
      <div className="flex items-start gap-3">
        {/* Citation number badge */}
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          {/* Citation title as link */}
          <a
            href={citation.url}
            className="block font-medium text-slate-900 underline-offset-2 hover:underline dark:text-slate-100"
            target="_blank"
            rel="noopener noreferrer"
          >
            {citation.title}
          </a>

          {/* URL path (truncated if long) */}
          <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
            {citation.url}
          </span>

          {/* Excerpt if available */}
          {hasExcerpt && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
              {citation.excerpt}
            </p>
          )}

          {/* Relevance score badge */}
          {scorePercentage !== null && (
            <div className="mt-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  scorePercentage >= 80
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : scorePercentage >= 60
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {scorePercentage}% relevant
              </span>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * Empty state component when no citations are available
 */
function EmptyCitations() {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-800/50">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No sources cited for this response.
      </p>
    </div>
  );
}

/**
 * Citation Display Component
 *
 * Renders a list of citations with clickable links to textbook sections.
 * Handles empty state gracefully.
 *
 * @param props - Component props
 * @param props.citations - Array of citations to display
 * @param props.className - Optional CSS class name
 *
 * @example
 * ```tsx
 * <CitationDisplay
 *   citations={[
 *     { title: "Chapter 1", url: "/docs/chapter-1", score: 0.92 },
 *     { title: "Chapter 2", url: "/docs/chapter-2", excerpt: "...", score: 0.85 }
 *   ]}
 * />
 * ```
 */
export function CitationDisplay({
  citations,
  className = "",
}: CitationDisplayProps) {
  // Handle empty citations
  if (!citations || citations.length === 0) {
    return (
      <div className={className}>
        <EmptyCitations />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <svg
          className="h-4 w-4 text-slate-500 dark:text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Sources ({citations.length})
        </h3>
      </div>

      {/* Citation list */}
      <ul className="space-y-2">
        {citations.map((citation, index) => (
          <CitationItem
            key={`${citation.url}-${index}`}
            citation={citation}
            index={index}
          />
        ))}
      </ul>
    </div>
  );
}

/**
 * Compact citation display for inline use
 *
 * Shows citations as a simple list of links without excerpts or scores.
 */
export function CitationDisplayCompact({
  citations,
  className = "",
}: CitationDisplayProps) {
  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div className={`text-sm ${className}`}>
      <span className="font-medium text-slate-600 dark:text-slate-400">
        Sources:{" "}
      </span>
      {citations.map((citation, index) => (
        <span key={`${citation.url}-${index}`}>
          {index > 0 && (
            <span className="text-slate-400 dark:text-slate-500"> | </span>
          )}
          <a
            href={citation.url}
            className="text-blue-600 hover:underline dark:text-blue-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            {citation.title}
          </a>
        </span>
      ))}
    </div>
  );
}

export default CitationDisplay;
