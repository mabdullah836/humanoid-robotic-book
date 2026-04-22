"use client";

import { useState, useCallback } from "react";
import { Loader2, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";
import { BOOK_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

type LoadState = "loading" | "loaded" | "error";

export default function BookPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");

  const handleLoad = useCallback(() => {
    setLoadState("loaded");
  }, []);

  const handleError = useCallback(() => {
    setLoadState("error");
  }, []);

  const handleRetry = useCallback(() => {
    setLoadState("loading");
    // Force iframe reload by updating key
    const iframe = document.querySelector("iframe");
    if (iframe) {
      iframe.src = BOOK_URL;
    }
  }, []);

  return (
    <div
      className="iframe-container relative"
      style={{ height: `calc(100vh - 64px)` }}
    >
      {/* Loading State */}
      {loadState === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10">
          <Loader2
            className="h-10 w-10 animate-spin text-primary mb-4"
            aria-hidden="true"
          />
          <p className="text-foreground-secondary text-lg">
            Loading textbook...
          </p>
          <p className="text-foreground-muted text-sm mt-2">
            This may take a few moments
          </p>
        </div>
      )}

      {/* Error State */}
      {loadState === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10">
          <div className="flex flex-col items-center max-w-md text-center px-4">
            <AlertTriangle
              className="h-12 w-12 text-amber-500 mb-4"
              aria-hidden="true"
            />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Unable to load textbook
            </h2>
            <p className="text-foreground-secondary mb-6">
              The textbook couldn&apos;t be loaded in the iframe. This might be
              due to network issues or browser restrictions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRetry}
                className={cn(
                  "inline-flex items-center justify-center gap-2 px-4 py-2",
                  "rounded-lg bg-primary text-white font-medium",
                  "hover:bg-primary-dark transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50"
                )}
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <a
                href={BOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center justify-center gap-2 px-4 py-2",
                  "rounded-lg border border-border bg-background-secondary",
                  "text-foreground font-medium",
                  "hover:bg-hover-bg hover:border-hover-border transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50"
                )}
              >
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        src={BOOK_URL}
        title="Physical AI & Humanoid Robotics Textbook"
        className={cn(
          "w-full h-full border-0",
          loadState !== "loaded" && "invisible"
        )}
        onLoad={handleLoad}
        onError={handleError}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      {/* Fallback link for accessibility */}
      <noscript>
        <div className="p-8 text-center">
          <p className="text-foreground-secondary mb-4">
            JavaScript is required to view the embedded textbook.
          </p>
          <a
            href={BOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Open textbook in new tab
          </a>
        </div>
      </noscript>
    </div>
  );
}
