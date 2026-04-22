/**
 * Coverage – what the textbook includes (preview + CTA).
 */

"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { BookText, ArrowRight, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const highlights = [
  "15+ modules from basics to deployment",
  "Runnable Python and ROS2 snippets",
  "Gazebo and simulation walkthroughs",
  "URDF and robot description",
  "Control and stability fundamentals",
  "Applied examples and extensions",
];

export function BookPreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 sm:py-24 bg-background-secondary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 border border-primary/10">
              <BookText className="w-4 h-4" />
              Coverage
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
              One resource, end to end
            </h2>

            <p className="text-base sm:text-lg text-foreground-secondary mb-6 leading-relaxed">
              From math and control to ROS2 and sim—structured so you can read linearly or jump to what you need.
            </p>

            <ul className="space-y-2.5 mb-8">
              {highlights.map((item, index) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -16 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
                  transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <CircleCheck className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="text-foreground-secondary text-sm sm:text-base">
                    {item}
                  </span>
                </motion.li>
              ))}
            </ul>

            <Link
              href="/book"
              className={cn(
                "inline-flex items-center gap-2 px-5 py-3 rounded-xl",
                "bg-gradient-primary text-white font-medium text-sm",
                "hover:opacity-95 transition-opacity shadow-md"
              )}
            >
              Go to textbook
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative"
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-border bg-background">
              <div className="absolute top-0 left-0 right-0 h-8 bg-background-tertiary border-b border-border flex items-center px-3 gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                <div className="flex-1 mx-3">
                  <div className="h-3.5 bg-background rounded text-xs flex items-center justify-center text-foreground-muted font-medium">
                    pai-humanoids
                  </div>
                </div>
              </div>

              <div className="absolute top-8 inset-x-0 bottom-0 p-5 overflow-hidden">
                <div className="space-y-3">
                  <div className="h-6 bg-primary/20 rounded-lg w-3/4" />
                  <div className="space-y-1.5">
                    <div className="h-2.5 bg-foreground-muted/15 rounded w-full" />
                    <div className="h-2.5 bg-foreground-muted/15 rounded w-5/6" />
                    <div className="h-2.5 bg-foreground-muted/15 rounded w-4/6" />
                  </div>
                  <div className="flex gap-3 pt-3">
                    <div className="flex-1 p-3 rounded-xl bg-background-secondary border border-border">
                      <div className="h-1.5 bg-primary/25 rounded w-1/2 mb-2" />
                      <div className="space-y-1">
                        <div className="h-1.5 bg-foreground-muted/10 rounded" />
                        <div className="h-1.5 bg-foreground-muted/10 rounded w-4/5" />
                      </div>
                    </div>
                    <div className="flex-1 p-3 rounded-xl bg-background-secondary border border-border">
                      <div className="h-1.5 bg-secondary/25 rounded w-1/2 mb-2" />
                      <div className="space-y-1">
                        <div className="h-1.5 bg-foreground-muted/10 rounded" />
                        <div className="h-1.5 bg-foreground-muted/10 rounded w-3/5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : { scale: 0 }}
              transition={{ duration: 0.25, delay: 0.35, type: "spring", stiffness: 300 }}
              className="absolute -bottom-3 -right-3 px-3 py-1.5 rounded-full bg-accent text-white text-sm font-medium shadow-md"
            >
              Free
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default BookPreview;
