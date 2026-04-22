/**
 * Hero – Top section of the landing page.
 */

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookText, MessageCircle, ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[min(80vw,480px)] h-[min(80vw,480px)] rounded-full bg-primary/[0.06] blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[min(60vw,360px)] h-[min(60vw,360px)] rounded-full bg-secondary/[0.06] blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/10">
            <Zap className="w-4 h-4" />
            Read the book. Query the book.
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-5 leading-[1.15] tracking-tight">
            Physical AI
            <br />
            <span className="text-gradient"> & Humanoid Robots</span>
          </h1>

          <p className="text-lg sm:text-xl text-foreground-secondary max-w-xl mx-auto mb-10 leading-relaxed">
            One open resource: theory, control, kinematics, ROS2, and sim. Plus an in-book Q&A that answers from the text.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/book"
              className={cn(
                "inline-flex items-center gap-2 px-5 py-3 rounded-xl text-base font-medium",
                "bg-gradient-primary text-white",
                "hover:opacity-95 active:scale-[0.98] transition-all duration-200",
                "shadow-md hover:shadow-lg"
              )}
            >
              <BookText className="w-5 h-5" />
              Open textbook
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/chat"
              className={cn(
                "inline-flex items-center gap-2 px-5 py-3 rounded-xl text-base font-medium",
                "border border-border bg-background-secondary text-foreground",
                "hover:bg-background-tertiary hover:border-foreground-muted",
                "active:scale-[0.98] transition-all duration-200"
              )}
            >
              <MessageCircle className="w-5 h-5" />
              In-book Q&A
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-14 pt-10 border-t border-border"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {[
              { value: "15+", label: "Modules" },
              { value: "100+", label: "Snippets" },
              { value: "RAG", label: "Q&A" },
              { value: "Open", label: "Free" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl font-semibold text-foreground">
                  {stat.value}
                </div>
                <div className="text-sm text-foreground-muted mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
