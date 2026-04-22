/**
 * Study with AI – in-book Q&A demo and CTA.
 */

"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { MessageCircle, ArrowRight, Bot, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

const sampleExchange = [
  {
    role: "user" as const,
    content: "How do I model a robot in URDF?",
  },
  {
    role: "assistant" as const,
    content:
      "URDF (Unified Robot Description Format) is an XML format. You define links (rigid bodies) and joints (connections). Each link has geometry, inertia, and visual/collision meshes. Joints specify parent and child links plus type: revolute, continuous, prismatic, or fixed.",
  },
  {
    role: "user" as const,
    content: "Show a minimal two-link example",
  },
  {
    role: "assistant" as const,
    content:
      "A minimal 2-link arm in URDF: one base link, one link connected by a revolute joint. Define <link name=\"base_link\"> with a box geometry, then <joint name=\"joint1\" type=\"revolute\"> with axis 0 0 1, then <link name=\"link1\">. The textbook has full XML in the URDF chapter.",
  },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full bg-foreground-muted animate-typing-dot" />
      <span className="w-2 h-2 rounded-full bg-foreground-muted animate-typing-dot" />
      <span className="w-2 h-2 rounded-full bg-foreground-muted animate-typing-dot" />
    </div>
  );
}

export function ChatbotDemo() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {
    if (!isInView) return;

    if (visibleCount < sampleExchange.length) {
      setShowTyping(true);
      const delay =
        sampleExchange[visibleCount].role === "assistant" ? 1400 : 700;
      const t = setTimeout(() => {
        setShowTyping(false);
        setVisibleCount((c) => c + 1);
      }, delay);
      return () => clearTimeout(t);
    }
  }, [isInView, visibleCount]);

  return (
    <section ref={ref} className="py-20 sm:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="order-2 lg:order-1"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border bg-background-secondary">
              <div className="h-12 bg-gradient-primary flex items-center px-4 gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-medium text-sm">In-book Q&A</div>
                  <div className="text-white/70 text-xs">Answers from the text</div>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-white/70 text-xs">Live</span>
                </div>
              </div>

              <div className="h-72 overflow-y-auto p-4 space-y-3">
                <AnimatePresence>
                  {sampleExchange.slice(0, visibleCount).map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "flex",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-xl px-4 py-2.5",
                          msg.role === "user"
                            ? "message-user"
                            : "message-bot"
                        )}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {showTyping && visibleCount < sampleExchange.length && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "flex",
                      sampleExchange[visibleCount].role === "user"
                        ? "justify-end"
                        : "justify-start"
                    )}
                  >
                    <div className="message-bot px-4 py-3">
                      <TypingDots />
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="h-14 border-t border-border bg-background px-4 flex items-center gap-3">
                <div className="flex-1 h-9 rounded-xl bg-background-secondary border border-border px-4 flex items-center">
                  <span className="text-sm text-foreground-muted">
                    Ask about the book…
                  </span>
                </div>
                <div
                  className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-sm"
                  aria-hidden
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4 border border-secondary/10">
              <MessageCircle className="w-4 h-4" />
              Study with AI
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Query the textbook
            </h2>

            <p className="text-base sm:text-lg text-foreground-secondary mb-6 leading-relaxed">
              Ask in plain language. Replies are grounded in the book via retrieval—no hallucinated content.
            </p>

            <ul className="space-y-2.5 mb-8">
              {[
                "Clarify concepts and notation",
                "Request Python or ROS2 snippets",
                "Drill down with follow-ups",
                "Get pointers to specific sections",
              ].map((line, index) => (
                <motion.li
                  key={line}
                  initial={{ opacity: 0, x: 16 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <CircleDot className="w-5 h-5 text-secondary flex-shrink-0" />
                  <span className="text-foreground-secondary text-sm sm:text-base">
                    {line}
                  </span>
                </motion.li>
              ))}
            </ul>

            <Link
              href="/chat"
              className={cn(
                "inline-flex items-center gap-2 px-5 py-3 rounded-xl",
                "bg-gradient-primary text-white font-medium text-sm",
                "hover:opacity-95 transition-opacity shadow-md"
              )}
            >
              Open Q&A
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default ChatbotDemo;
