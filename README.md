# CyLink (EJS + Express)

CyLink uses a single Node service with an EJS UI that now lives in the `client/` folder:

- `server/` -> Express APIs, auth/session, sockets, DB, upload integration
- `client/views/` -> EJS pages (old UI converted)
- `client/public/` -> CSS/JS assets used by EJS
- `client/src/` -> original React source preserved as backup/reference

## Run locally

```bash
cd server
npm install
npm run dev
```

Open:

- `http://localhost:5000`

## Required env

Configure `server/.env` from `server/.env.example`.

Important keys:

- `MONGO_URI`, `MONGO_DB_NAME`
- Firebase Admin credentials (`FIREBASE_SERVICE_ACCOUNT_PATH` or other supported admin vars)
- Firebase Web SDK vars (`FIREBASE_WEB_*`) for `/auth`
- Cloudinary upload vars:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

## Main routes

- `/` landing page
- `/auth` auth page (email/password + Google)
- `/app` questions UI (old style converted to EJS)
- `/app/questions/:id` question detail
- `/app/profile` profile page
