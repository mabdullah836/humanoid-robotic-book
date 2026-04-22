/**
 * RegisterForm Component Tests
 *
 * Unit tests for the user registration form component.
 * Tests form validation, submission, and OAuth flows.
 *
 * @module __tests__/components/auth/RegisterForm.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { signUp, signIn } from "@/lib/auth-client";

// Mock auth-client (already mocked in vitest.setup.ts, but we'll override for specific tests)
vi.mock("@/lib/auth-client", () => ({
  signUp: {
    email: vi.fn(),
  },
  signIn: {
    social: vi.fn(),
  },
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render the registration form with all fields", () => {
      render(<RegisterForm />);

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create account/i })
      ).toBeInTheDocument();
    });

    it("should render OAuth buttons", () => {
      render(<RegisterForm />);

      expect(
        screen.getByRole("button", { name: /continue with google/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /continue with github/i })
      ).toBeInTheDocument();
    });

    it("should render sign in link", () => {
      render(<RegisterForm />);

      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
        "href",
        "/login"
      );
    });
  });

  describe("Form Validation", () => {
    it("should show error when name is empty", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      await user.click(
        screen.getByRole("button", { name: /create account/i })
      );

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it("should show error when name is too short", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/full name/i), "A");
      await user.click(
        screen.getByRole("button", { name: /create account/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText(/name must be at least 2 characters/i)
        ).toBeInTheDocument();
      });
    });

    it("should show error when email is invalid", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/full name/i), "Test User");
      await user.type(screen.getByLabelText(/email address/i), "invalid-email");
      await user.click(
        screen.getByRole("button", { name: /create account/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
      });
    });

    it("should show error when password is too short", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/full name/i), "Test User");
      await user.type(
        screen.getByLabelText(/email address/i),
        "test@example.com"
      );
      await user.type(screen.getByLabelText(/^password$/i), "short");
      await user.click(
        screen.getByRole("button", { name: /create account/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 8 characters/i)
        ).toBeInTheDocument();
      });
    });

    it("should show error when passwords do not match", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/full name/i), "Test User");
      await user.type(
        screen.getByLabelText(/email address/i),
        "test@example.com"
      );
      await user.type(screen.getByLabelText(/^password$/i), "ValidPassword123");
      await user.type(screen.getByLabelText(/confirm password/i), "DifferentPassword");
      await user.click(
        screen.getByRole("button", { name: /create account/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText(/passwords do not match/i)
        ).toBeInTheDocument();
      });
    });

    it("should clear field error when user starts typing", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      // Submit empty form to trigger errors
      await user.click(
        screen.getByRole("button", { name: /create account/i })
      );

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });

      // Type in the name field
      await user.type(screen.getByLabelText(/full name/i), "Test");

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("should call signUp.email with correct data on valid submission", async () => {
      const user = userEvent.setup();
      const mockSignUpEmail = vi.fn();
      vi.mocked(signUp.email).mockImplementation(mockSignUpEmail);

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/full name/i), "Test User");
      await user.type(
        screen.getByLabelText(/email address/i),
        "test@example.com"
      );
      await user.type(screen.getByLabelText(/^password$/i), "ValidPassword123");
      await user.type(
        screen.getByLabelText(/confirm password/i),
        "ValidPassword123"
      );
      await user.click(
        screen.getByRole("button", { name: /create account/i })
      );

      await waitFor(() => {
        expect(mockSignUpEmail).toHaveBeenCalledWith(
          {
            email: "test@example.com",
            password: "ValidPassword123",
            name: "Test User",
          },
          expect.objectContaining({
            onRequest: expect.any(Function),
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          })
        );
      });
    });

    it("should disable form fields during submission", async () => {
      const user = userEvent.setup();
      // Mock a slow submission
      vi.mocked(signUp.email).mockImplementation(async (_, callbacks) => {
        callbacks?.onRequest?.();
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/full name/i), "Test User");
      await user.type(
        screen.getByLabelText(/email address/i),
        "test@example.com"
      );
      await user.type(screen.getByLabelText(/^password$/i), "ValidPassword123");
      await user.type(
        screen.getByLabelText(/confirm password/i),
        "ValidPassword123"
      );

      // Submit the form
      fireEvent.click(screen.getByRole("button", { name: /create account/i }));

      // Fields should be disabled
      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeDisabled();
      });
    });
  });

  describe("OAuth Flows", () => {
    it("should call signIn.social with google provider", async () => {
      const user = userEvent.setup();
      const mockSignInSocial = vi.fn();
      vi.mocked(signIn.social).mockImplementation(mockSignInSocial);

      render(<RegisterForm />);

      await user.click(
        screen.getByRole("button", { name: /continue with google/i })
      );

      await waitFor(() => {
        expect(mockSignInSocial).toHaveBeenCalledWith({
          provider: "google",
          callbackURL: "/chat",
        });
      });
    });

    it("should call signIn.social with github provider", async () => {
      const user = userEvent.setup();
      const mockSignInSocial = vi.fn();
      vi.mocked(signIn.social).mockImplementation(mockSignInSocial);

      render(<RegisterForm />);

      await user.click(
        screen.getByRole("button", { name: /continue with github/i })
      );

      await waitFor(() => {
        expect(mockSignInSocial).toHaveBeenCalledWith({
          provider: "github",
          callbackURL: "/chat",
        });
      });
    });

    it("should disable all buttons during OAuth loading", async () => {
      const user = userEvent.setup();
      // Mock a slow OAuth
      vi.mocked(signIn.social).mockImplementation(
        async () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<RegisterForm />);

      fireEvent.click(
        screen.getByRole("button", { name: /continue with google/i })
      );

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /create account/i })
        ).toBeDisabled();
        expect(
          screen.getByRole("button", { name: /continue with github/i })
        ).toBeDisabled();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display general error from signUp.email failure", async () => {
      const user = userEvent.setup();
      vi.mocked(signUp.email).mockImplementation(async (_, callbacks) => {
        callbacks?.onRequest?.();
        callbacks?.onError?.({
          error: { message: "Email already registered" },
        } as never);
      });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/full name/i), "Test User");
      await user.type(
        screen.getByLabelText(/email address/i),
        "existing@example.com"
      );
      await user.type(screen.getByLabelText(/^password$/i), "ValidPassword123");
      await user.type(
        screen.getByLabelText(/confirm password/i),
        "ValidPassword123"
      );
      await user.click(
        screen.getByRole("button", { name: /create account/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText(/email already registered/i)
        ).toBeInTheDocument();
      });
    });

    it("should display error alert with role=alert", async () => {
      const user = userEvent.setup();
      vi.mocked(signUp.email).mockImplementation(async (_, callbacks) => {
        callbacks?.onRequest?.();
        callbacks?.onError?.({
          error: { message: "Registration failed" },
        } as never);
      });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/full name/i), "Test User");
      await user.type(
        screen.getByLabelText(/email address/i),
        "test@example.com"
      );
      await user.type(screen.getByLabelText(/^password$/i), "ValidPassword123");
      await user.type(
        screen.getByLabelText(/confirm password/i),
        "ValidPassword123"
      );
      await user.click(
        screen.getByRole("button", { name: /create account/i })
      );

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(/registration failed/i);
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper form labels", () => {
      render(<RegisterForm />);

      // All inputs should have associated labels
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it("should have proper autocomplete attributes", () => {
      render(<RegisterForm />);

      expect(screen.getByLabelText(/full name/i)).toHaveAttribute(
        "autocomplete",
        "name"
      );
      expect(screen.getByLabelText(/email address/i)).toHaveAttribute(
        "autocomplete",
        "email"
      );
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute(
        "autocomplete",
        "new-password"
      );
      expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute(
        "autocomplete",
        "new-password"
      );
    });
  });
});
