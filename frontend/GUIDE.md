# Frontend Guide: Authentication & Chat Integration

**Feature Branch**: `002-auth-frontend-integration`
**Stack**: Next.js 15 + Better Auth + Drizzle ORM + Neon PostgreSQL + ChatKit

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Setup](#quick-setup)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Authentication](#authentication)
7. [Chat Integration](#chat-integration)
8. [Route Protection](#route-protection)
9. [Chat History](#chat-history)
10. [OAuth Providers](#oauth-providers)
11. [API Routes](#api-routes)
12. [Components Reference](#components-reference)
13. [Hooks Reference](#hooks-reference)
14. [Testing](#testing)
15. [Troubleshooting](#troubleshooting)

---

## Overview

This frontend implements a complete authentication system with chat functionality:

- **User Authentication**: Email/password + OAuth (Google, GitHub)
- **Session Management**: JWT tokens stored in httpOnly cookies
- **Chat Interface**: ChatKit UI integrated with FastAPI RAG backend
- **Chat History**: Persistent conversation storage with Neon PostgreSQL
- **Route Protection**: Middleware-based access control

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js 15)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Auth UI    │  │  Chat UI    │  │   History UI            │  │
│  │  - Login    │  │  - ChatKit  │  │   - ConversationList    │  │
│  │  - Register │  │  - Citations│  │   - DeleteAll           │  │
│  │  - Logout   │  │             │  │                         │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                      │                │
│  ┌──────▼──────────────────▼──────────────────────▼─────────┐   │
│  │                    API Routes (/api/*)                    │   │
│  │  - /api/auth/[...all]  - Auth endpoints                  │   │
│  │  - /api/chat           - Chat proxy to backend           │   │
│  │  - /api/chat/history   - Chat history CRUD               │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│  ┌──────────────────────────▼───────────────────────────────┐   │
│  │              Better Auth + Drizzle ORM                    │   │
│  └──────────────────────────┬───────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   Neon PostgreSQL       │     │   FastAPI Backend       │
│   - users               │     │   - /api/v1/chat        │
│   - sessions            │     │   - JWT validation      │
│   - chat_sessions       │     │   - RAG retrieval       │
│   - chat_messages       │     │                         │
└─────────────────────────┘     └─────────────────────────┘
```

---

## Quick Setup

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies (use --legacy-peer-deps if needed)
npm install --legacy-peer-deps

# 3. Copy environment template
cp .env.example .env.local

# 4. Edit .env.local with your credentials (see Environment Variables section)

# 5. Run database migrations
npx drizzle-kit generate
npx drizzle-kit migrate

# 6. Start development server
npm run dev
```

---

## Environment Variables

Create `.env.local` with the following variables:

```env
# =============================================================================
# Database Configuration (Required)
# =============================================================================
# Get from https://console.neon.tech
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# =============================================================================
# Better Auth Configuration (Required)
# =============================================================================
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-key-min-32-characters-here

# Base URL for auth callbacks
BETTER_AUTH_URL=http://localhost:3000

# =============================================================================
# Backend Configuration (Required for Chat)
# =============================================================================
# FastAPI backend URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# =============================================================================
# OAuth Providers (Optional)
# =============================================================================
# Google - https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub - https://github.com/settings/developers
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# =============================================================================
# ChatKit (Optional - for OpenAI workflow mode)
# =============================================================================
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_CHATKIT_WORKFLOW_ID=wf_...
```

### Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Secret for JWT signing (min 32 chars) |
| `BETTER_AUTH_URL` | Yes | Base URL for auth callbacks |
| `NEXT_PUBLIC_BACKEND_URL` | Yes | FastAPI backend URL |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth client secret |

---

## Database Setup

### Schema Overview

The database includes these tables:

| Table | Purpose |
|-------|---------|
| `user` | User accounts |
| `session` | Active sessions |
| `account` | OAuth provider accounts |
| `verification` | Email verification tokens |
| `chat_session` | Chat conversations |
| `chat_message` | Individual messages |

### Running Migrations

```bash
# Generate migration files from schema
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit migrate

# View database in Drizzle Studio (optional)
npx drizzle-kit studio
```

### Schema Location

- Schema definition: `lib/db/schema.ts`
- Database connection: `lib/db/index.ts`
- Drizzle config: `drizzle.config.ts`
- Migration files: `drizzle/` directory

---

## Authentication

### Using Authentication in Components

```tsx
"use client";

import { useSession, signIn, signUp, signOut } from "@/lib/auth-client";

export function MyComponent() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;

  if (!session) {
    return (
      <button onClick={() => signIn.email({ email, password })}>
        Sign In
      </button>
    );
  }

  return (
    <div>
      <p>Welcome, {session.user.name}!</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

### Sign Up

```tsx
import { signUp } from "@/lib/auth-client";

const handleSignUp = async () => {
  const { data, error } = await signUp.email({
    name: "John Doe",
    email: "john@example.com",
    password: "SecurePassword123",
  });

  if (error) {
    console.error(error.message);
    return;
  }

  // User created successfully
  console.log("User:", data.user);
};
```

### Sign In

```tsx
import { signIn } from "@/lib/auth-client";

const handleSignIn = async () => {
  const { data, error } = await signIn.email({
    email: "john@example.com",
    password: "SecurePassword123",
  });

  if (error) {
    console.error(error.message);
    return;
  }

  // Redirect to chat
  window.location.href = "/chat";
};
```

### Sign Out

```tsx
import { signOut } from "@/lib/auth-client";

const handleSignOut = async () => {
  await signOut();
  window.location.href = "/login";
};
```

### OAuth Sign In

```tsx
import { signIn } from "@/lib/auth-client";

// Google
await signIn.social({ provider: "google" });

// GitHub
await signIn.social({ provider: "github" });
```

---

## Chat Integration

### How Chat Works

1. User sends message via ChatKit UI
2. Message sent to `/api/chat` (Next.js API route)
3. API route validates session and forwards to FastAPI backend
4. Backend performs RAG retrieval and generates response
5. Response returned with citations
6. Message saved to chat history

### Using Chat in Components

The main chat interface is in `components/ChatKitPanel.tsx`:

```tsx
import { ChatKitPanel } from "@/components/ChatKitPanel";

export function ChatPage() {
  return (
    <ChatKitPanel
      theme="light"
      sessionId={sessionId}
      initialMessages={messages}
      onWidgetAction={handleWidgetAction}
      onResponseEnd={handleResponseEnd}
      onThemeRequest={handleThemeChange}
    />
  );
}
```

### ChatKitPanel Props

| Prop | Type | Description |
|------|------|-------------|
| `theme` | `"light" \| "dark"` | Color scheme |
| `sessionId` | `string \| null` | Chat session ID for history |
| `initialMessages` | `HistoryMessage[]` | Messages to restore |
| `onWidgetAction` | `(action) => Promise<void>` | Handle widget actions |
| `onResponseEnd` | `() => void` | Called when response completes |
| `onThemeRequest` | `(scheme) => void` | Handle theme change requests |

### Theme Synchronization with Book Iframe

The book page (`/book`) synchronizes the theme with the embedded textbook iframe by appending a `theme` parameter to the iframe URL. When the user changes the theme, the iframe reloads with the updated theme parameter.

**Implementation**:
1. The `useTheme` hook tracks the current theme state
2. The book page constructs the iframe URL with `?theme=light` or `?theme=dark`
3. When theme changes, the iframe src is updated to reflect the new theme
4. The Docusaurus textbook site must implement reading the theme parameter and applying the appropriate theme

**Code example**:
```tsx
// In app/book/page.tsx
const { theme, mounted } = useTheme();
const bookUrlWithTheme = mounted ? `${BOOK_URL}?theme=${theme}` : BOOK_URL;

// The iframe src uses the themed URL
<iframe src={bookUrlWithTheme} ... />
```

**Requirements for Docusaurus textbook**:
- Must read the `theme` query parameter from the URL
- Must apply the corresponding theme (light/dark) to the page
- Should gracefully handle missing theme parameter (default to light theme)

---

## Route Protection

### How Middleware Works

The middleware (`middleware.ts`) protects routes by checking for valid sessions:

```typescript
// Protected routes - require authentication
const protectedPaths = ["/chat", "/history"];

// Public routes - no authentication needed
const publicPaths = ["/login", "/register", "/"];
```

### Route Groups

| Route Group | Path | Access |
|-------------|------|--------|
| `(auth)` | `/login`, `/register` | Public |
| `(protected)` | `/chat`, `/history` | Authenticated only |

### Accessing Protected Routes

When an unauthenticated user tries to access a protected route:

1. Middleware intercepts the request
2. User is redirected to `/login?callbackUrl=/chat`
3. After login, user is redirected back to original destination

---

## Chat History

### Using Chat History Hook

```tsx
import { useChatHistory } from "@/hooks/useChatHistory";

export function HistoryPage() {
  const {
    sessions,
    isLoading,
    error,
    loadSessions,
    loadMessages,
    deleteSession,
    deleteAllSessions,
  } = useChatHistory();

  // Load all sessions
  useEffect(() => {
    loadSessions();
  }, []);

  // Load messages for a session
  const handleSelectSession = async (sessionId: string) => {
    const messages = await loadMessages(sessionId);
    // Display messages...
  };

  // Delete a session
  const handleDelete = async (sessionId: string) => {
    await deleteSession(sessionId);
  };
}
```

### Chat History API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/history` | GET | List all sessions |
| `/api/chat/history` | POST | Create new session |
| `/api/chat/history/[sessionId]` | GET | Get session details |
| `/api/chat/history/[sessionId]` | DELETE | Delete session |
| `/api/chat/history/[sessionId]/messages` | GET | Get session messages |
| `/api/chat/history/[sessionId]/messages` | POST | Add message to session |

---

## OAuth Providers

### Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Set authorized redirect URI: `{BETTER_AUTH_URL}/api/auth/callback/google`
4. Copy Client ID and Secret to `.env.local`

### Setting Up GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set authorization callback URL: `{BETTER_AUTH_URL}/api/auth/callback/github`
4. Copy Client ID and Secret to `.env.local`

### OAuth Configuration

OAuth is configured in `lib/auth.ts`:

```typescript
export const auth = betterAuth({
  // ...
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});
```

---

## API Routes

### Authentication Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/sign-up/email` | POST | Register with email/password |
| `/api/auth/sign-in/email` | POST | Login with email/password |
| `/api/auth/sign-out` | POST | Sign out (clear session) |
| `/api/auth/session` | GET | Get current session |
| `/api/auth/callback/google` | GET | Google OAuth callback |
| `/api/auth/callback/github` | GET | GitHub OAuth callback |

### Chat Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/chat` | POST | Send message to RAG backend |
| `/api/chat/history` | GET | List chat sessions |
| `/api/chat/history` | POST | Create new chat session |
| `/api/chat/history/[sessionId]` | GET | Get session details |
| `/api/chat/history/[sessionId]` | DELETE | Delete session |
| `/api/chat/history/[sessionId]/messages` | GET | Get messages |
| `/api/chat/history/[sessionId]/messages` | POST | Add message |

---

## Components Reference

### Auth Components

| Component | Path | Description |
|-----------|------|-------------|
| `AuthProvider` | `components/auth/AuthProvider.tsx` | Session context provider |
| `LoginForm` | `components/auth/LoginForm.tsx` | Login form with OAuth |
| `RegisterForm` | `components/auth/RegisterForm.tsx` | Registration form |
| `LogoutButton` | `components/auth/LogoutButton.tsx` | Sign out button |

### Chat Components

| Component | Path | Description |
|-----------|------|-------------|
| `ChatKitPanel` | `components/ChatKitPanel.tsx` | Main chat interface |
| `CitationDisplay` | `components/chat/CitationDisplay.tsx` | RAG citation renderer |
| `ConversationList` | `components/chat/ConversationList.tsx` | Chat history list |
| `NewChatButton` | `components/chat/NewChatButton.tsx` | Start new conversation |
| `DeleteAllConversations` | `components/chat/DeleteAllConversations.tsx` | Delete all history |

---

## Hooks Reference

### useSession

```tsx
import { useSession } from "@/lib/auth-client";

const { data: session, isPending, error } = useSession();

// session.user - Current user object
// session.session - Session metadata
// isPending - Loading state
// error - Error if any
```

### useChatHistory

```tsx
import { useChatHistory } from "@/hooks/useChatHistory";

const {
  sessions,      // Array of chat sessions
  isLoading,     // Loading state
  error,         // Error message
  loadSessions,  // Fetch all sessions
  loadMessages,  // Fetch messages for session
  deleteSession, // Delete single session
  deleteAllSessions, // Delete all sessions
} = useChatHistory();
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Run with coverage
npm run test:coverage
```

### Test Structure

```
frontend/__tests__/
├── components/
│   ├── auth/
│   │   ├── LoginForm.test.tsx
│   │   ├── RegisterForm.test.tsx
│   │   └── LogoutButton.test.tsx
│   └── chat/
│       ├── CitationDisplay.test.tsx
│       └── ConversationList.test.tsx
├── api/
│   ├── auth.test.ts
│   ├── chat.test.ts
│   └── chat-history.test.ts
└── e2e/
    ├── auth.spec.ts
    └── chat.spec.ts
```

### Writing Tests

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/LoginForm";

describe("LoginForm", () => {
  it("should display validation errors", async () => {
    render(<LoginForm />);

    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });
});
```

---

## Troubleshooting

### Common Issues

#### "Database connection failed"

```
Error: Connection refused
```

**Solution**: Verify `DATABASE_URL` in `.env.local` is correct and Neon project is active.

#### "Invalid session" or "Unauthorized"

**Solution**:
1. Check `BETTER_AUTH_SECRET` matches in frontend and backend
2. Clear browser cookies and try again
3. Verify `BETTER_AUTH_URL` matches your dev URL

#### "CORS error" when calling backend

**Solution**: The backend must allow requests from your frontend URL. Check FastAPI CORS settings.

#### "OAuth callback failed"

**Solution**:
1. Verify redirect URI in OAuth provider matches `{BETTER_AUTH_URL}/api/auth/callback/{provider}`
2. Check client ID and secret are correct
3. Ensure OAuth provider is enabled in `lib/auth.ts`

#### "Migration failed"

```
Error: relation "user" already exists
```

**Solution**: Drop existing migrations and regenerate:
```bash
rm -rf drizzle/
npx drizzle-kit generate
npx drizzle-kit migrate
```

#### "Module not found: better-auth"

**Solution**: Install with legacy peer deps:
```bash
npm install --legacy-peer-deps
```

### Debug Mode

Enable debug logging by adding to `.env.local`:

```env
DEBUG=better-auth:*
```

### Getting Help

1. Check [Better Auth Docs](https://www.better-auth.com/docs)
2. Check [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
3. Check [Next.js App Router Docs](https://nextjs.org/docs/app)

---

## Project Structure

```
frontend/
├── app/
│   ├── (auth)/                    # Public auth routes
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (protected)/               # Protected routes
│   │   ├── layout.tsx
│   │   ├── chat/page.tsx
│   │   └── history/page.tsx
│   ├── api/
│   │   ├── auth/[...all]/route.ts
│   │   └── chat/
│   │       ├── route.ts
│   │       └── history/
│   │           ├── route.ts
│   │           └── [sessionId]/
│   │               ├── route.ts
│   │               └── messages/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   │   ├── AuthProvider.tsx
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── LogoutButton.tsx
│   │   └── index.ts
│   ├── chat/
│   │   ├── CitationDisplay.tsx
│   │   ├── ConversationList.tsx
│   │   ├── NewChatButton.tsx
│   │   ├── DeleteAllConversations.tsx
│   │   └── index.ts
│   ├── ChatKitPanel.tsx
│   └── ErrorOverlay.tsx
├── hooks/
│   ├── useChatHistory.ts
│   └── useColorScheme.ts
├── lib/
│   ├── api/
│   │   ├── backend-adapter.ts
│   │   └── chat-history.ts
│   ├── db/
│   │   ├── index.ts
│   │   └── schema.ts
│   ├── auth.ts
│   ├── auth-client.ts
│   └── config.ts
├── __tests__/                     # Test files
├── drizzle/                       # Migration files
├── middleware.ts                  # Route protection
├── drizzle.config.ts
├── vitest.config.ts
├── .env.local                     # Environment variables
└── package.json
```

---

## Next Steps

After setup:

1. **Run migrations**: `npx drizzle-kit generate && npx drizzle-kit migrate`
2. **Start dev server**: `npm run dev`
3. **Test registration**: Go to `http://localhost:3000/register`
4. **Test login**: Go to `http://localhost:3000/login`
5. **Test chat**: Go to `http://localhost:3000/chat` (requires backend running)
6. **Run tests**: `npm run test:run`

For backend setup, see `../backend/README.md`.
