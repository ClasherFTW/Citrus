# Citrus Monorepo

Citrus has two apps:

- `server/` -> Backend (Express + MongoDB + Firebase Auth + Socket.io + AI endpoint)
- `client/` -> Frontend (React + Vite + Firebase client auth)

## What is already connected

- Firebase auth is used end-to-end.
- User profiles are stored in MongoDB (`users` collection).
- Questions, answers, chats, and messages are stored in MongoDB.
- Realtime 1-to-1 chat is powered by Socket.io and persists to DB.
- AI endpoint uses local Ollama (`qwen2.5-coder:7b`) with streaming support.

## 1) Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Firebase project with Authentication enabled (Google and/or email/password)
- Ollama (for Citrus Bot LLM)

## 2) Configure backend (`server/.env`)

Create `server/.env` from `server/.env.example` and set:

- `MONGO_URI`
- `MONGO_DB_NAME`
- `CORS_ORIGIN=http://localhost:6969`
- Firebase Admin credentials (one method):

Method A (recommended):
- Put service account JSON in `server/` (ignored by git) matching `*-firebase-adminsdk-*.json`

Method B:
- Fill env vars:
  - `FIREBASE_SERVICE_ACCOUNT_JSON` (single-line JSON string)
  - OR `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

AI (Citrus Bot):
- `OLLAMA_BASE_URL=http://localhost:11434`
- `OLLAMA_MODEL=qwen2.5-coder:7b`

## 3) Configure frontend (`client/.env`)

Create `client/.env` from `client/.env.example` and set:

- `VITE_API_BASE_URL=http://localhost:5000`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

## 4) Run both apps

Terminal 1 (backend):

```bash
cd server
npm install
npm run dev
```

Before using Citrus Bot, ensure Ollama is running in a separate terminal:

```bash
ollama pull qwen2.5-coder:7b
ollama serve
```

Terminal 2 (frontend):

```bash
cd client
npm install
npm run dev
```

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:6969`

## 5) Quick integration checks

- Health: `GET http://localhost:5000/health`
- Frontend login: Google or email/password through Firebase
- After login, app should open `/app`
- Post question -> visible in question list
- Open chat page, search users, start chat, send message
- Open second device/browser with another user -> realtime message delivery

## MongoDB data model (collections)

- `users`
- `questions`
- `answers`
- `chats`
- `messages`

Chats/messages are persisted by default in `server/src/services/chatService.js`.

## LLM integration steps

1. Install/start Ollama locally.
2. Pull model: `ollama pull qwen2.5-coder:7b`.
3. Set `OLLAMA_BASE_URL` and `OLLAMA_MODEL` in `server/.env`.
4. Restart backend.
5. Frontend Citrus Bot calls:
   - `POST /ai/chat` (non-stream)
   - `POST /ai/chat/stream` (streaming token output)

## Realtime websocket notes

- Socket auth uses Firebase ID token.
- Events implemented:
  - `joinRoom`
  - `leaveRoom`
  - `typing`
  - `sendMessage`
  - server emits `receiveMessage`
- Multi-device realtime works when both users are authenticated and connected.

## Additional improvements to make it production-ready

1. Add refresh-token/session revocation strategy with Firebase Admin checks.
2. Add rate limiting (`express-rate-limit`) for auth/chat/ai endpoints.
3. Add request IDs and structured logs for observability.
4. Add unit/integration tests for auth sync and chat flows.
5. Add retries/queue for AI calls and timeout handling.
6. Add presence/unread counts in chat.
7. Add HTTPS + secure deployment env separation.
