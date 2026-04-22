/**
 * LogoutButton Component Tests
 *
 * Unit tests for the logout button component.
 * Tests button rendering, logout flow, and callbacks.
 *
 * @module __tests__/components/auth/LogoutButton.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { signOut } from "@/lib/auth-client";

// Mock auth-client
vi.mock("@/lib/auth-client", () => ({
  signOut: vi.fn(),
}));

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: mockRefresh,
  }),
}));

describe("LogoutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render with default text", () => {
      render(<LogoutButton />);

      expect(
        screen.getByRole("button", { name: /sign out/i })
      ).toBeInTheDocument();
    });

    it("should render with custom children text", () => {
      render(<LogoutButton>Log Out</LogoutButton>);

      expect(
        screen.getByRole("button", { name: /log out/i })
      ).toBeInTheDocument();
    });

    it("should render as button variant by default", () => {
      render(<LogoutButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("rounded-lg");
      expect(button).toHaveClass("px-4");
    });

    it("should render as link variant when specified", () => {
      render(<LogoutButton variant="link" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("underline-offset-2");
    });

    it("should be disabled when disabled prop is true", () => {
      render(<LogoutButton disabled />);

      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  describe("Logout Flow", () => {
    it("should call signOut when clicked", async () => {
      const user = userEvent.setup();
      const mockSignOut = vi.fn().mockResolvedValue(undefined);
      vi.mocked(signOut).mockImplementation(mockSignOut);

      render(<LogoutButton />);

      await user.click(screen.getByRole("button", { name: /sign out/i }));

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    it("should call signOut with fetchOptions", async () => {
      const user = userEvent.setup();
      const mockSignOut = vi.fn().mockResolvedValue(undefined);
      vi.mocked(signOut).mockImplementation(mockSignOut);

      render(<LogoutButton />);

      await user.click(screen.getByRole("button", { name: /sign out/i }));

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({
          fetchOptions: expect.objectContaining({
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          }),
        });
      });
    });

    it("should show loading state during logout", async () => {
      const user = userEvent.setup();
      vi.mocked(signOut).mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      render(<LogoutButton />);

      user.click(screen.getByRole("button", { name: /sign out/i }));

      await waitFor(() => {
        expect(screen.getByText(/signing out.../i)).toBeInTheDocument();
      });
    });

    it("should disable button during loading", async () => {
      const user = userEvent.setup();
      vi.mocked(signOut).mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      render(<LogoutButton />);

      user.click(screen.getByRole("button", { name: /sign out/i }));

      await waitFor(() => {
        expect(screen.getByRole("button")).toBeDisabled();
      });
    });

    it("should have aria-busy during loading", async () => {
      const user = userEvent.setup();
      vi.mocked(signOut).mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      render(<LogoutButton />);

      user.click(screen.getByRole("button", { name: /sign out/i }));

      await waitFor(() => {
        expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
      });
    });

    it("should not trigger multiple logouts on rapid clicks", async () => {
      const user = userEvent.setup();
      const mockSignOut = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      vi.mocked(signOut).mockImplementation(mockSignOut);

      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /sign out/i });

      // Rapid clicks
      await user.click(button);
      await user.click(button);
      await user.click(button);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Redirect", () => {
    it("should redirect to default path (/) on successful logout", async () => {
      const user = userEvent.setup();
      let onSuccessCallback: (() => void) | undefined;

      vi.mocked(signOut).mockImplementation(async (options) => {
        onSuccessCallback = options?.fetchOptions?.onSuccess;
        onSuccessCallback?.();
      });

      render(<LogoutButton />);

      await user.click(screen.getByRole("button", { name: /sign out/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("should redirect to custom path when specified", async () => {
      const user = userEvent.setup();

      vi.mocked(signOut).mockImplementation(async (options) => {
        options?.fetchOptions?.onSuccess?.();
      });

      render(<LogoutButton redirectTo="/goodbye" />);

      await user.click(screen.getByRole("button", { name: /sign out/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/goodbye");
      });
    });
  });

  describe("Callbacks", () => {
    it("should call onLogoutSuccess callback on successful logout", async () => {
      const user = userEvent.setup();
      const onLogoutSuccess = vi.fn();

      vi.mocked(signOut).mockImplementation(async (options) => {
        options?.fetchOptions?.onSuccess?.();
      });

      render(<LogoutButton onLogoutSuccess={onLogoutSuccess} />);

      await user.click(screen.getByRole("button", { name: /sign out/i }));

      await waitFor(() => {
        expect(onLogoutSuccess).toHaveBeenCalled();
      });
    });

    it("should call onLogoutError callback on logout error", async () => {
      const user = userEvent.setup();
      const onLogoutError = vi.fn();

      vi.mocked(signOut).mockImplementation(async (options) => {
        options?.fetchOptions?.onError?.({
          error: { message: "Logout failed" },
        });
      });

      render(<LogoutButton onLogoutError={onLogoutError} />);

      await user.click(screen.getByRole("button", { name: /sign out/i }));

      await waitFor(() => {
        expect(onLogoutError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it("should call onLogoutError on thrown error", async () => {
      const user = userEvent.setup();
      const onLogoutError = vi.fn();

      vi.mocked(signOut).mockRejectedValue(new Error("Network error"));

      render(<LogoutButton onLogoutError={onLogoutError} />);

      await user.click(screen.getByRole("button", { name: /sign out/i }));

      await waitFor(() => {
        expect(onLogoutError).toHaveBeenCalledWith(
          expect.objectContaining({ message: "Network error" })
        );
      });
    });
  });

  describe("Accessibility", () => {
    it("should have type=button attribute", () => {
      render(<LogoutButton />);

      expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    });

    it("should accept additional button props", () => {
      render(<LogoutButton data-testid="logout-btn" aria-label="Custom label" />);

      const button = screen.getByTestId("logout-btn");
      expect(button).toHaveAttribute("aria-label", "Custom label");
    });

    it("should accept custom className", () => {
      render(<LogoutButton className="custom-class" />);

      expect(screen.getByRole("button")).toHaveClass("custom-class");
    });
  });
});
