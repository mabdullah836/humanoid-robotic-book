  /**
   * Navbar Component
   *
   * Main navigation bar with logo, navigation links, auth buttons, and theme toggle.
   * Includes mobile hamburger menu with responsive breakpoints.
   */

  "use client";

  import { useState, useCallback } from "react";
  import Link from "next/link";
  import { usePathname, useRouter } from "next/navigation";
  import { Menu, X, BookText, MessageCircle, LogOut, User } from "lucide-react";
  import { useSession, signOut } from "@/lib/auth-client";
  import { ThemeToggle } from "./ThemeToggle";
  import { cn } from "@/lib/utils";
  import { NAVBAR_HEIGHT } from "@/lib/constants";

  interface NavLinkProps {
    href: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    onClick?: () => void;
  }

  function NavLink({ href, children, icon, onClick }: NavLinkProps) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium",
          "transition-colors duration-200",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-foreground-secondary hover:text-foreground hover:bg-background-secondary"
        )}
      >
        {icon}
        {children}
      </Link>
    );
  }

  export function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { data: session, isPending } = useSession();
    const router = useRouter();

    const toggleMobileMenu = useCallback(() => {
      setIsMobileMenuOpen((prev) => !prev);
    }, []);

    const closeMobileMenu = useCallback(() => {
      setIsMobileMenuOpen(false);
    }, []);

    const handleSignOut = useCallback(async () => {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/");
            closeMobileMenu();
          },
        },
      });
    }, [router, closeMobileMenu]);

    return (
      <header
        className="fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border"
        style={{ height: NAVBAR_HEIGHT }}
      >
        <nav className="h-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-full">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-semibold text-foreground hover:text-primary transition-colors duration-200"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-sm">
                <BookText className="w-4 h-4 text-white" />
              </div>
              <span className="hidden sm:inline text-base">PAI & Humanoids</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <NavLink href="/book" icon={<BookText className="w-4 h-4" />}>
                Textbook
              </NavLink>
              <NavLink href="/chat" icon={<MessageCircle className="w-4 h-4" />}>
                Q&A
              </NavLink>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle size="sm" />

              {isPending ? (
                <div className="w-20 h-9 rounded-xl bg-background-secondary animate-pulse" />
              ) : session?.user ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background-secondary border border-border">
                    <User className="w-4 h-4 text-foreground-muted" />
                    <span className="text-sm text-foreground-secondary max-w-[120px] truncate">
                      {session.user.name || session.user.email}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className={cn(
                      "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium",
                      "text-foreground-muted hover:text-foreground hover:bg-background-secondary",
                      "transition-colors duration-200"
                    )}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="sr-only sm:not-sr-only">Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium",
                      "text-foreground-secondary hover:text-foreground",
                      "hover:bg-background-secondary transition-colors duration-200"
                    )}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium",
                      "bg-gradient-primary text-white",
                      "hover:opacity-95 transition-opacity duration-200"
                    )}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle size="sm" />
              <button
                onClick={toggleMobileMenu}
                className={cn(
                  "p-2.5 rounded-xl",
                  "text-foreground-secondary hover:text-foreground",
                  "hover:bg-background-secondary transition-colors duration-200"
                )}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-md">
            <div className="max-w-6xl mx-auto px-4 py-4 space-y-1">
              {/* Navigation Links */}
              <NavLink
                href="/book"
                icon={<BookText className="w-4 h-4" />}
                onClick={closeMobileMenu}
              >
                Textbook
              </NavLink>
              <NavLink
                href="/chat"
                icon={<MessageCircle className="w-4 h-4" />}
                onClick={closeMobileMenu}
              >
                Q&A
              </NavLink>

              {/* Divider */}
              <hr className="my-3 border-border" />

              {/* Auth Actions */}
              {isPending ? (
                <div className="w-full h-10 rounded-lg bg-background-secondary animate-pulse" />
              ) : session?.user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background-secondary border border-border">
                    <User className="w-4 h-4 text-foreground-muted" />
                    <span className="text-sm text-foreground-secondary">
                      {session.user.name || session.user.email}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-xl",
                      "text-sm font-medium text-foreground-muted",
                      "hover:text-foreground hover:bg-background-secondary transition-colors"
                    )}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className={cn(
                      "block w-full px-4 py-2.5 rounded-xl text-center",
                      "text-sm font-medium text-foreground-secondary",
                      "border border-border hover:bg-background-secondary transition-colors"
                    )}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMobileMenu}
                    className={cn(
                      "block w-full px-4 py-2.5 rounded-xl text-center",
                      "text-sm font-medium bg-gradient-primary text-white",
                      "hover:opacity-95 transition-opacity"
                    )}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    );
  }

  export default Navbar;
