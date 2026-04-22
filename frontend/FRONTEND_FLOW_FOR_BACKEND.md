# Frontend Flow for Backend Implementation

This document describes how the frontend works so you can build a backend that integrates with it.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Public routes: /, /book, /login, /register                                   │
│  Protected routes: /chat, /history (require auth)                             │
│                                                                               │
│  Auth: Better Auth (handled inside Next.js; user/session in PostgreSQL)        │
│  Chat history: Stored in Next.js DB (PostgreSQL via Drizzle)                  │
│  RAG/Chat LLM: Proxied to YOUR backend (NEXT_PUBLIC_BACKEND_URL)              │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │  Only this is your backend
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    YOUR BACKEND (e.g. FastAPI)                                │
│  - POST /api/v1/chat  (RAG question → answer + citations)                      │
│  - Optional: session_id for conversation continuity                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Auth and chat history live in the frontend app** (Next.js + PostgreSQL). You do **not** implement user sign-up/sign-in or chat session/message storage in your backend unless you want to replace the frontend’s behavior.
- **Your backend’s only required contract** is the **chat API** described in §4.

---

## 2. Routing & Protection

| Route            | Auth    | Description                          |
|------------------|--------|--------------------------------------|
| `/`              | Public | Landing (Hero, BookPreview, etc.)    |
| `/book`          | Public | Textbook iframe (external URL)       |
| `/login`         | Public | Sign in (email/password + optional OAuth) |
| `/register`      | Public | Sign up (email/password)            |
| `/chat`          | Protected | Main chat UI; `?session=<id>` for a conversation |
| `/history`       | Protected | List of past conversations          |

- **Middleware** (`middleware.ts`): For paths under `/chat`, `/history`, `/profile`, `/settings`, it calls `/api/auth/get-session` (Better Auth). If there is no session, it redirects to `/login?callbackUrl=<original path>`.
- **Public paths**: `/`, `/book`, `/login`, `/register`, and anything under `/api/auth` are not protected.

You don’t need to implement these routes; they are fully frontend. Your backend only needs to accept optional user context (see §4).

---

## 3. Authentication (Better Auth – Frontend Only)

- **Provider**: Better Auth.
- **Endpoints**: All under `/api/auth/*` (e.g. sign-up, sign-in, sign-out, get-session). Handled by `app/api/auth/[...all]/route.ts` and `lib/auth.ts`.
- **Database**: PostgreSQL; Better Auth uses tables: `user`, `session`, `account`, `verification` (see `lib/db/schema.ts`).
- **Client**: `lib/auth-client.ts` exposes `signIn`, `signUp`, `signOut`, `useSession`. Login/register forms use these; on success they redirect (e.g. to `callbackUrl` or `/chat`).

**Backend implication:** You do **not** implement login/register. The frontend will send requests to **your** API with user context in headers when using the chat proxy (§4).

---

## 4. Chat API – What Your Backend Must Provide

The frontend uses a **Next.js proxy** for chat so that the browser sends requests to the same origin (with cookies). The proxy then calls your backend.

### 4.1 Frontend → Next.js proxy (`/api/chat`)

- **Method:** `POST`
- **Body (JSON):**
  - `message` (string, required): user message text
  - `session_id` (string, optional): conversation/session id for continuity

### 4.2 Next.js proxy → Your backend

The proxy (`app/api/chat/route.ts`) does the following:

1. Ensures the user is logged in (Better Auth session). If not, it returns 401.
2. Builds the body for your backend:
   - `query`: same as `message` (trimmed)
   - `k`: `5` (number of retrieval results)
   - `session_id`: forwarded if provided
3. Sends **headers** (you can use these for logging or personalization):
   - `X-User-ID`: Better Auth user id
   - `X-User-Email`: user email (if present)
   - `X-User-Name`: user name (if present)
4. Calls: **`POST {BACKEND_URL}/api/v1/chat`**  
   `BACKEND_URL` is from `NEXT_PUBLIC_BACKEND_URL` (e.g. `http://localhost:8000`).

So your backend must implement:

**Endpoint:** `POST /api/v1/chat`

**Request body (JSON):**

```json
{
  "query": "user message text",
  "k": 5,
  "session_id": "optional-session-id"
}
```

**Request headers (optional but sent by frontend):**

- `X-User-ID`
- `X-User-Email`
- `X-User-Name`

**Response (JSON) – success (e.g. 200):**

```json
{
  "answer": "Assistant reply text",
  "citations": [
    {
      "title": "Chapter or section title",
      "url": "https://... or path",
      "excerpt": "optional snippet",
      "score": 0.95
    }
  ],
  "metadata": {
    "chunks_retrieved": 5,
    "processing_time_ms": 120,
    "model": "optional"
  }
}
```

- `answer` is required; the frontend maps it to the assistant message. `citations` is optional; the UI can show them. `metadata` is optional.

**Error response:** Return appropriate status (4xx/5xx) and a JSON body that may include:

- `detail` (string or object with `message`, `error`, etc.)
- or `error`, `message`

The frontend will show a generic error message if the proxy receives a non-2xx response.

**Reference (frontend types):** `lib/api/backend-adapter.ts` – `BackendChatRequest`, `BackendChatResponse`, `Citation`.

---

## 5. Chat History (Stored in Frontend DB Only)

Chat **sessions** and **messages** are stored in the **frontend’s** PostgreSQL via Drizzle, not in your backend:

- **Tables:** `chat_session`, `chat_message` (see `lib/db/schema.ts`).
- **APIs:** All under `/api/chat/history/*`; implemented in Next.js and use `lib/api/chat-history.ts`.

Flow when the user sends a message (see `app/(protected)/chat/page.tsx` and `hooks/useChatHistory.ts`):

1. **Create session if needed:** `POST /api/chat/history` with optional `title` or `firstMessage` (body JSON). Returns `{ session: { id, userId, title, createdAt, updatedAt } }`.
2. **Add user message:** `POST /api/chat/history/:sessionId/messages` with `{ role: "user", content: "..." }`.
3. **Call RAG:** Frontend calls `sendChatMessageViaProxy(message, { sessionId })` → Next.js `POST /api/chat` → your `POST /api/v1/chat` (with `query`, `k`, optional `session_id`).
4. **Add assistant message:** `POST /api/chat/history/:sessionId/messages` with `{ role: "assistant", content: "<answer>", citations: "<JSON string of Citation[]>" }`.

So:

- **Session IDs** in the frontend are created and stored by the frontend. The frontend may send one of these as `session_id` to your backend for context; you can use it for conversation continuity (e.g. in RAG or LLM context) or ignore it.
- You do **not** need to implement session or message CRUD; the frontend already does.

---

## 6. Frontend API Routes Summary (for your reference)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| (all) | `/api/auth/*` | - | Better Auth (sign-up, sign-in, get-session, etc.) |
| POST | `/api/chat` | Session | Proxy to your backend `POST /api/v1/chat`; adds `X-User-*` headers |
| GET | `/api/chat/history` | Session | List current user’s chat sessions |
| POST | `/api/chat/history` | Session | Create a new chat session |
| DELETE | `/api/chat/history` | Session | Delete all sessions for current user |
| GET | `/api/chat/history/[sessionId]` | Session | Get one session + its messages |
| PATCH | `/api/chat/history/[sessionId]` | Session | Update session (e.g. title) |
| DELETE | `/api/chat/history/[sessionId]` | Session | Delete one session |
| GET | `/api/chat/history/[sessionId]/messages` | Session | Get messages for a session |
| POST | `/api/chat/history/[sessionId]/messages` | Session | Add a message (user or assistant) |
| POST | `/api/create-session` | - | OpenAI ChatKit session (separate from chat history; used by App.tsx/ChatKit if applicable) |

Only the proxy `POST /api/chat` talks to your backend; the rest are internal to the frontend.

---

## 7. Environment & Config

- **Backend URL:** `NEXT_PUBLIC_BACKEND_URL` (e.g. `http://localhost:8000`). No trailing slash.
- **Database:** Used by Next.js for Better Auth and chat history (`DATABASE_URL`, Drizzle).
- **Auth:** `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`; optional OAuth env vars for Google/GitHub.

See `.env.example` for a full list. For your backend you only need to run at the URL set in `NEXT_PUBLIC_BACKEND_URL` and implement `POST /api/v1/chat` as above.

---

## 8. Minimal Backend Checklist

To support the frontend:

1. **Implement `POST /api/v1/chat`**
   - Accept JSON: `query` (required), `k` (optional, default 5), `session_id` (optional).
   - Return JSON: `answer` (required), `citations` (optional array of `{ title, url, excerpt?, score? }`), optional `metadata`.
   - Optionally read `X-User-ID`, `X-User-Email`, `X-User-Name` for logging or personalization.

2. **CORS:** If the frontend ever called your backend directly from the browser, you’d need CORS. Currently it does not: all chat goes through the Next.js proxy, so no CORS is required for chat.

3. **Auth:** You do not need to implement sign-up/sign-in or session management; the frontend handles that and only proxies authenticated requests to you with user headers.

4. **Chat history:** You do not need to store sessions or messages; the frontend stores them and optionally sends `session_id` for you to use only for conversation context in RAG/LLM.

---

## 9. Optional: Conversation Continuity

If you want multi-turn context in RAG/LLM:

- The frontend sends `session_id` (its own UUID for the conversation) in the body to the proxy, and the proxy forwards it to your backend.
- You can use `session_id` as a key to store or retrieve prior turns (e.g. in a cache or DB) and pass them as context to your model. The frontend does not send the full history in the chat request; it only sends the current `query` and `session_id`. So if you want continuity, your backend must persist or look up history by `session_id` itself.

---

**Summary:** The frontend owns auth, routing, and chat history. Your backend only needs to expose **`POST /api/v1/chat`** with the request/response shape above; the rest of the flow is already implemented in the frontend.
