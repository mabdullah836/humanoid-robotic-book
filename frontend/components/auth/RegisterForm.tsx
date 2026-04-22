"use client";

/**
 * RegisterForm Component
 *
 * User registration form with email/password authentication and OAuth providers.
 * Uses Better Auth signUp.email and signIn.social for account creation.
 *
 * Features:
 * - Form fields: name, email, password, confirm password
 * - OAuth buttons for Google and GitHub (when configured)
 * - Client-side validation
 * - Password strength requirements (min 8 chars)
 * - Loading state during submission
 * - Error display
 * - Redirect to /chat on success
 * - Full dark/light mode support
 */

import { useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp, signIn } from "@/lib/auth-client";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

/**
 * Google Icon SVG Component
 */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/**
 * GitHub Icon SVG Component
 */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

/**
 * Form field state type
 */
interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Form validation errors type
 */
interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate form data and return errors
 */
function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  // Validate name
  if (!data.name.trim()) {
    errors.name = "Name is required";
  } else if (data.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  }

  // Validate email
  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!isValidEmail(data.email)) {
    errors.email = "Please enter a valid email address";
  }

  // Validate password
  if (!data.password) {
    errors.password = "Password is required";
  } else if (data.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  // Validate confirm password
  if (!data.confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
}

/**
 * RegisterForm Component
 */
export function RegisterForm() {
  const router = useRouter();
  const { refetch } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Handle OAuth sign up (uses same flow as sign in - creates account if new)
   */
  const handleOAuthSignUp = async (provider: "google" | "github") => {
    try {
      setIsOAuthLoading(provider);
      setErrors({});
      await signIn.social({
        provider,
        callbackURL: "/chat",
      });
    } catch {
      setIsOAuthLoading(null);
      setErrors({
        general: `Failed to sign up with ${provider === "google" ? "Google" : "GitHub"}. Please try again.`,
      });
    }
  };

  /**
   * Handle input change
   */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Clear previous errors
    setErrors({});

    // Submit registration
    await signUp.email(
      {
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
      },
      {
        onRequest: () => {
          setIsLoading(true);
        },
        onSuccess: async () => {
          setIsLoading(false);
          // Refresh session state before navigating to ensure auth context is updated
          await refetch();
          // Small delay to ensure session is properly set
          setTimeout(() => {
            router.push("/chat");
          }, 100);
        },
        onError: (ctx) => {
          setIsLoading(false);
          setErrors({
            general: ctx.error.message || "Registration failed. Please try again.",
          });
        },
      }
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-background-secondary border border-border shadow-lg rounded-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Create an Account
          </h1>
          <p className="text-foreground-secondary mt-2">
            Join Physical AI & Humanoid Robotics
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* General Error */}
          {errors.general && (
            <div
              className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-lg text-sm"
              role="alert"
            >
              {errors.general}
            </div>
          )}

          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground-secondary mb-2"
            >
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              className={cn(
                "w-full px-4 py-3 rounded-lg",
                "bg-background border transition-all duration-200",
                "text-foreground placeholder:text-foreground-muted",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                errors.name ? "border-red-500" : "border-border"
              )}
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-500">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground-secondary mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className={cn(
                "w-full px-4 py-3 rounded-lg",
                "bg-background border transition-all duration-200",
                "text-foreground placeholder:text-foreground-muted",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                errors.email ? "border-red-500" : "border-border"
              )}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-500">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground-secondary mb-2"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className={cn(
                "w-full px-4 py-3 rounded-lg",
                "bg-background border transition-all duration-200",
                "text-foreground placeholder:text-foreground-muted",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                errors.password ? "border-red-500" : "border-border"
              )}
              placeholder="Create a password (min. 8 characters)"
            />
            {errors.password && (
              <p className="mt-2 text-sm text-red-500">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-foreground-secondary mb-2"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              className={cn(
                "w-full px-4 py-3 rounded-lg",
                "bg-background border transition-all duration-200",
                "text-foreground placeholder:text-foreground-muted",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                errors.confirmPassword ? "border-red-500" : "border-border"
              )}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-500">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isOAuthLoading !== null}
            className={cn(
              "w-full py-3 px-4 rounded-lg font-medium text-white",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
              isLoading || isOAuthLoading !== null
                ? "bg-primary/60 cursor-not-allowed"
                : "bg-primary hover:bg-primary-dark active:scale-[0.98]"
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* OAuth Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background-secondary px-3 text-foreground-muted">
              Or continue with
            </span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={() => handleOAuthSignUp("google")}
            disabled={isLoading || isOAuthLoading !== null}
            className={cn(
              "w-full flex items-center justify-center gap-3 py-3 px-4",
              "border border-border rounded-lg",
              "bg-background text-foreground font-medium",
              "transition-all duration-200",
              isLoading || isOAuthLoading !== null
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-hover-bg hover:border-hover-border active:scale-[0.98]",
              "focus:outline-none focus:ring-2 focus:ring-primary/50"
            )}
          >
            {isOAuthLoading === "google" ? (
              <svg
                className="animate-spin h-5 w-5 text-foreground-muted"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <GoogleIcon className="h-5 w-5" />
            )}
            <span>{isOAuthLoading === "google" ? "Signing up..." : "Continue with Google"}</span>
          </button>

          {/* GitHub OAuth Button */}
          <button
            type="button"
            onClick={() => handleOAuthSignUp("github")}
            disabled={isLoading || isOAuthLoading !== null}
            className={cn(
              "w-full flex items-center justify-center gap-3 py-3 px-4",
              "border border-border rounded-lg",
              "bg-foreground text-background font-medium",
              "transition-all duration-200",
              isLoading || isOAuthLoading !== null
                ? "opacity-50 cursor-not-allowed"
                : "hover:opacity-90 active:scale-[0.98]",
              "focus:outline-none focus:ring-2 focus:ring-foreground/50"
            )}
          >
            {isOAuthLoading === "github" ? (
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <GitHubIcon className="h-5 w-5" />
            )}
            <span>{isOAuthLoading === "github" ? "Signing up..." : "Continue with GitHub"}</span>
          </button>
        </div>

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-foreground-secondary">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary-dark transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;
