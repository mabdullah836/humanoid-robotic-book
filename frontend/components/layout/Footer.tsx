"use client";

import Link from "next/link";
import { BookText, Github, Twitter, Linkedin, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const explore = [
  { label: "Textbook", href: "/book" },
  { label: "In-book Q&A", href: "/chat" },
  { label: "What's inside", href: "/#whats-inside" },
];

const learn = [
  { label: "Book content", href: "/book" },
  {
    label: "Repo",
    href: "https://nadeemsangrasi.github.io/humanoid-and-robotic-book",
    external: true,
  },
  { label: "ROS2", href: "https://docs.ros.org", external: true },
];

const legal = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

const social = [
  { icon: Github, href: "https://github.com", label: "GitHub" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: Mail, href: "mailto:contact@example.com", label: "Email" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-background-secondary border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-semibold text-foreground mb-4 hover:text-primary transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-sm">
                <BookText className="w-4 h-4 text-white" />
              </div>
              PAI & Humanoids
            </Link>
            <p className="text-sm text-foreground-muted mb-5 max-w-[240px] leading-relaxed">
              Open textbook and in-book Q&A for physical AI and humanoid robotics.
            </p>
            <div className="flex items-center gap-2">
              {social.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center",
                    "bg-background border border-border",
                    "text-foreground-muted hover:text-foreground hover:border-foreground-muted",
                    "transition-colors duration-200"
                  )}
                  aria-label={s.label}
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3 text-sm">Explore</h3>
            <ul className="space-y-2.5">
              {explore.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground-muted hover:text-foreground transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3 text-sm">Learn</h3>
            <ul className="space-y-2.5">
              {learn.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-foreground-muted hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-foreground-muted hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3 text-sm">Legal</h3>
            <ul className="space-y-2.5">
              {legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground-muted hover:text-foreground transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-foreground-muted">
            © {year} PAI & Humanoids
          </p>
          <p className="text-sm text-foreground-muted">
            Open resource · RAG Q&A
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
