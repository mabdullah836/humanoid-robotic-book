/**
 * Register Page
 *
 * User registration page using the RegisterForm component.
 * Part of the (auth) route group for consistent auth page layouts.
 *
 * Route: /register
 */

import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";

/**
 * Page metadata
 */
export const metadata = {
  title: "Create Account | Physical AI & Humanoid Robotics",
  description: "Create a new account to access the Physical AI & Humanoid Robotics textbook chatbot.",
};

/**
 * Loading fallback for form
 */
function FormSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-background-secondary border border-border shadow-lg rounded-xl p-8 animate-pulse">
        <div className="h-8 bg-foreground-muted/20 rounded w-3/4 mx-auto mb-4" />
        <div className="h-4 bg-foreground-muted/20 rounded w-1/2 mx-auto mb-8" />
        <div className="space-y-5">
          <div className="h-12 bg-foreground-muted/20 rounded-lg" />
          <div className="h-12 bg-foreground-muted/20 rounded-lg" />
          <div className="h-12 bg-foreground-muted/20 rounded-lg" />
          <div className="h-12 bg-foreground-muted/20 rounded-lg" />
          <div className="h-12 bg-primary/30 rounded-lg" />
        </div>
        <div className="mt-6 space-y-3">
          <div className="h-12 bg-foreground-muted/20 rounded-lg" />
          <div className="h-12 bg-foreground-muted/20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Register Page Component
 */
export default function RegisterPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <RegisterForm />
    </Suspense>
  );
}
