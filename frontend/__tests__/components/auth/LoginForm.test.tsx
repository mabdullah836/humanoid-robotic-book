/**
 * LoginForm Component Tests
 *
 * Unit tests for the user login form component.
 * Tests form validation, submission, OAuth flows, and error handling.
 *
 * @module __tests__/components/auth/LoginForm.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/LoginForm";
import { signIn } from "@/lib/auth-client";

// Mock auth-client
vi.mock("@/lib/auth-client", () => ({
  signIn: {
    email: vi.fn(),
    social: vi.fn(),
  },
}));

// Mock next/navigation
const mockPush = vi.fn();
const mockGet = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(null); // Default: no callbackUrl
  });

  describe("Rendering", () => {
    it("should render the login form with all fields", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it("should render OAuth buttons", () => {
      render(<LoginForm />);

      expect(
        screen.getByRole("button", { name: /continue with google/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /continue with github/i })
      ).toBeInTheDocument();
    });

    it("should render register link", () => {
      render(<LoginForm />);

      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /create one/i })).toHaveAttribute(
        "href",
        "/register"
      );
    });

    it("should display welcome message", () => {
      render(<LoginForm />);

      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      expect(
        screen.getByText(/sign in to physical ai & humanoid robotics/i)
      ).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show error when email is empty", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it("should show error when email is invalid", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email address/i), "invalid-email");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
      });
    });

    it("should show error when password is empty", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.type(
        screen.getByLabelText(/email address/i),
        "test@example.com"
      );
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it("should clear field error when user starts typing", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Submit empty form to trigger errors
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      // Type in the email field
      await user.type(screen.getByLabelText(/email address/i), "test@");

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("should call signIn.email with correct data on valid submission", async () => {
      const user = userEvent.setup();
      const mockSignInEmail = vi.fn();
      vi.mocked(signIn.email).mockImplementation(mockSignInEmail);

      render(<LoginForm />);

      await user.type(
        screen.getByLabelText(/email address/i),
        "test@example.com"
      );
      await user.type(screen.getByLabelText(/password/i), "MyPassword123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignInEmail).toHaveBeenCalledWith(
          {
            email: "test@example.com",
            password: "MyPassword123",
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
      vi.mocked(signIn.email).mockImplementation(async (_, callbacks) => {
        callbacks?.onRequest?.();
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      render(<LoginForm />);

      await user.type(
        screen.getByLabelText(/email address/i),
        "test@example.com"
      );
      await user.type(screen.getByLabelText(/password/i), "MyPassword123");

      // Submit the form
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      // Fields should be disabled
      await waitFor(() => {
        expect(screen.getByLabelText(/email address/i)).toBeDisabled();
      });
    });

    it("should show loading text during submission", async () => {
      const user = userEvent.setup();
      vi.mocked(signIn.email).mockImplementation(async (_, callbacks) => {
        callbacks?.onRequest?.();
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      render(<LoginForm />);

      await user.type(
        screen.getByLabelText(/email address/i),
        "test@example.com"
      );
      await user.type(screen.getByLabelText(/password/i), "MyPassword123");

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/signing in.../i)).toBeInTheDocument();
      });
    });
  });

  describe("OAuth Flows", () => {
    it("should call signIn.social with google provider and default callbackURL", async () => {
      const user = userEvent.setup();
      const mockSignInSocial = vi.fn();
      vi.mocked(signIn.social).mockImplementation(mockSignInSocial);

      render(<LoginForm />);

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

      render(<LoginForm />);

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

    it("should use custom callbackUrl from search params", async () => {
      const user = userEvent.setup();
      mockGet.mockReturnValue("/dashboard");
      const mockSignInSocial = vi.fn();
      vi.mocked(signIn.social).mockImplementation(mockSignInSocial);

      render(<LoginForm />);

      await user.click(
        screen.getByRole("button", { name: /continue with google/i })
      );

      await waitFor(() => {
        expect(mockSignInSocial).toHaveBeenCalledWith({
          provider: "google",
          callbackURL: "/dashboard",
        });
      });
    });

    it("should disable all buttons during OAuth loading", async () => {
      const user = userEvent.setup();
      vi.mocked(signIn.social).mockImplementation(
        async () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<LoginForm />);

      fireEvent.click(
        screen.getByRole("button", { name: /continue with google/i })
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();
        expect(
          screen.getByRole("button", { name: /continue with github/i })
        ).toBeDisabled();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display general error from signIn.email failure", async () => {
      const user = userEvent.setup();
      vi.mocked(signIn.email).mockImplementation(async (_, callbacks) => {
        callbacks?.onRequest?.();
        callbacks?.onError?.({
          error: { message: "Invalid credentials" },
        } as never);
      });

      render(<LoginForm />);

      await user.type(
        screen.getByLabelText(/email address/i),
        "test@example.com"
      );
      await user.type(screen.getByLabelText(/password/i), "WrongPassword");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/invalid email or password/i)
        ).toBeInTheDocument();
      });
    });

    it("should display error alert with role=alert", async () => {
      const user = userEvent.setup();
      vi.mocked(signIn.email).mockImplementation(async (_, callbacks) => {
        callbacks?.onRequest?.();
        callbacks?.onError?.({
          error: { message: "Account locked" },
        } as never);
      });

      render(<LoginForm />);

      await user.type(
        screen.getByLabelText(/email address/i),
        "test@example.com"
      );
      await user.type(screen.getByLabelText(/password/i), "SomePassword");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toBeInTheDocument();
      });
    });

    it("should display OAuth error message", async () => {
      const user = userEvent.setup();
      vi.mocked(signIn.social).mockRejectedValue(new Error("OAuth failed"));

      render(<LoginForm />);

      await user.click(
        screen.getByRole("button", { name: /continue with google/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText(/failed to sign in with google/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper form labels", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("should have proper autocomplete attributes", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute(
        "autocomplete",
        "email"
      );
      expect(screen.getByLabelText(/password/i)).toHaveAttribute(
        "autocomplete",
        "current-password"
      );
    });

    it("should have proper input types", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute(
        "type",
        "email"
      );
      expect(screen.getByLabelText(/password/i)).toHaveAttribute(
        "type",
        "password"
      );
    });
  });
});
