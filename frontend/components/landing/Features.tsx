/**
 * What’s inside – highlights of the resource.
 */

"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Layers,
  MessageCircleQuestion,
  Terminal,
  Target,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

const items: Feature[] = [
  {
    icon: Layers,
    title: "Structured modules",
    description:
      "Kinematics, dynamics, control, sensors, actuators, and deployment—ordered for progression.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: MessageCircleQuestion,
    title: "In-book Q&A",
    description:
      "Ask in natural language. Answers are grounded in the book via retrieval over the full text.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: Terminal,
    title: "Code you can run",
    description:
      "Python, ROS2, and sim snippets tied to each topic so you can reproduce and tweak.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Target,
    title: "Project-style outcomes",
    description:
      "End-of-stream projects that combine modules into real pipelines you can extend.",
    color: "bg-primary/10 text-primary",
  },
];

function ItemCard({ feature, index }: { feature: Feature; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={cn(
        "group p-6 rounded-2xl",
        "bg-background-secondary border border-border",
        "hover:border-foreground-muted/50 hover:shadow-md",
        "transition-all duration-200"
      )}
    >
      <div
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center mb-4",
          feature.color
        )}
      >
        <feature.icon className="w-5 h-5" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {feature.title}
      </h3>
      <p className="text-sm text-foreground-secondary leading-relaxed">
        {feature.description}
      </p>
    </motion.div>
  );
}

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 sm:py-24 bg-background" id="whats-inside">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">
            What’s inside
          </h2>
          <p className="text-base sm:text-lg text-foreground-secondary max-w-xl mx-auto">
            A single path from foundations to deployable physical AI and humanoid systems.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5">
          {items.map((feature, index) => (
            <ItemCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
