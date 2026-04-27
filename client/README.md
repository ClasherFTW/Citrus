# Citrus Frontend (React + Vite)

Modern multi-page frontend aligned to the existing Citrus backend.

## Run

```bash
cd client
npm install
npm run dev
```

Default dev URL: `http://localhost:6969`

Set backend URL in `.env`:

```bash
VITE_API_BASE_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

Production (Vercel):

```bash
VITE_API_BASE_URL=https://citrus-9lf9.onrender.com
```

`vercel.json` is included with an SPA rewrite to `index.html` so deep links work.

## Main Features

- Landing, login/register, main Q&A page, question detail page
- Google login on auth page via Firebase popup
- Profile pages (`/app/profile`, `/app/users/:id`)
- Edit/Delete UI for your own questions and answers
- Markdown editor with preview for questions/answers
- Realtime chat page (`/app/chat`) using Socket.io + HTTP fallback
  - user search + start chat flow
- Global toast notifications
- Saved/bookmarked questions
- Advanced filters (tag, date range, unanswered only, most voted this week)
- Citrus Bot upgrades:
  - per-question bot thread history
  - use a selected answer as extra context
  - streamed token output in the bot panel ("typing" effect)
  - backend model target: Ollama `qwen2.5-coder:7b`
- UX polish (skeletons, empty states, retry actions)
- React Query data layer + react-hook-form + zod validation
- Playwright baseline e2e setup

## Test

```bash
npm run test:e2e
```
