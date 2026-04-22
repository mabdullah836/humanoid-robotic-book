import { ColorScheme, StartScreenPrompt, ThemeOption } from "@openai/chatkit";

/**
 * Backend base URL for the FastAPI RAG chatbot service.
 * Set via NEXT_PUBLIC_BACKEND_URL (local or hosted); no code change needed to switch.
 */
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000";

export const WORKFLOW_ID =
  process.env.NEXT_PUBLIC_CHATKIT_WORKFLOW_ID?.trim() ?? "";

export const CREATE_SESSION_ENDPOINT = "/api/create-session";

export const STARTER_PROMPTS: StartScreenPrompt[] = [
  {
    label: "What is Physical AI?",
    prompt: "Explain Physical AI and its applications in robotics.",
    icon: "sparkle",
  },
  {
    label: "Humanoid robotics basics",
    prompt: "What are the key components of humanoid robotics?",
    icon: "cube",
  },
  {
    label: "Robot kinematics",
    prompt: "Explain forward and inverse kinematics in robotics.",
    icon: "settings-slider",
  },
  {
    label: "ROS2 fundamentals",
    prompt: "What are the fundamentals of ROS2 for robotics?",
    icon: "book-open",
  },
];

export const PLACEHOLDER_INPUT = "Ask about Physical AI & Robotics...";

export const GREETING = "Physical AI & Humanoid Robotics Assistant";

export const getThemeConfig = (theme: ColorScheme): ThemeOption => ({
  color: {
    grayscale: {
      hue: 220,
      tint: 6,
      shade: theme === "dark" ? -1 : -4,
    },
    accent: {
      primary: theme === "dark" ? "#f1f5f9" : "#0f172a",
      level: 1,
    },
  },
  radius: "round",
  // Add other theme options here
  // chatkit.studio/playground to explore config options
});
