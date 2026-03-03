# Context Vault

A private, Google-authenticated workspace for capturing ideas, projects, discussions, and running context threads. Built with Next.js 16 (App Router), NextAuth, Tailwind, and Vercel Postgres-compatible storage.

## Features

- **Google-only access** – NextAuth with Google provider + email allowlist.
- **Threaded workspace** – Create threads for ideas/projects/discussions/context.
- **Rich metadata** – Track status, summary, tags, and type per thread.
- **Context timeline** – Append role- + kind-specific entries (message, context, decision).
- **Search & filters** – Keyword, status, and type filters on the dashboard.
- **Server actions** – Fully server-side mutations with automatic cache revalidation.

## Stack

- [Next.js 16](https://nextjs.org/) with the App Router
- [NextAuth](https://next-auth.js.org/) for Google OAuth
- [@vercel/postgres](https://vercel.com/docs/storage/vercel-postgres) (Neon-compatible) for persistence
- Tailwind CSS v4
- TypeScript + ESLint

## Local Development

1. Copy the environment template and fill in your secrets:

   ```bash
   cp .env.example .env.local
   ```

   Required values:

   | Variable | Purpose |
   | --- | --- |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth credentials from Google Cloud Console |
   | `NEXTAUTH_SECRET` | Can be generated with `openssl rand -base64 32` |
   | `DATABASE_URL` | Postgres connection string (use Neon/Vercel Postgres) |
   | `ALLOWED_EMAILS` | Comma-separated list of Google emails that may sign in |
| `OPENCLAW_CHAT_TO` | Optional. When set, chat requests are proxied through the local OpenClaw CLI via `openclaw agent --to ...`. |
| `OPENCLAW_BINARY` | Optional path to the OpenClaw CLI (defaults to `openclaw`). |
| `OPENCLAW_CHAT_CHANNEL` / `OPENCLAW_CHAT_REPLY_TO` / `OPENCLAW_CHAT_DELIVER` | Optional routing flags forwarded to the CLI. |
| `CHAT_IMAGE_MAX_BYTES` | Optional. Max upload size for inline chat images (default 10MB). |
| `CHAT_IMAGE_MAX_COUNT` | Optional. Max number of images per message (default 3). |
| `CHAT_ALLOWED_ATTACHMENT_PREFIXES` | Optional comma-separated MIME prefixes (default `image/`). |

2. Install dependencies (already run when this repo was created, but repeat if needed):

   ```bash
   npm install
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. Visit `http://localhost:3000`. You will be redirected to `/auth/sign-in` until your Google account is admitted via `ALLOWED_EMAILS`.

### Chat transport via OpenClaw (Retro desktop / Option B)

If you want the in-app chat to relay messages through your local OpenClaw gateway instead of OpenAI, configure the CLI bridge:

1. Ensure you can run `openclaw agent --to <target> --message "ping" --deliver` successfully in this repo.
2. Set `OPENCLAW_CHAT_TO` (and optional `OPENCLAW_CHAT_CHANNEL`, `OPENCLAW_CHAT_REPLY_TO`, etc.) in `.env.local`.
3. Restart `npm run dev`. The `/api/chat` endpoint now shells out to `openclaw agent ... --json` and returns Totoro' response straight from your gateway.
4. If the CLI bridge fails, the API falls back to OpenAI (when `OPENAI_API_KEY` is set) or returns an actionable error.

> Tip: the chat form now accepts inline image uploads. Images are stored as data URLs in the Postgres row and forwarded to Totoro through the OpenClaw bridge (with size/type limits enforced by `CHAT_IMAGE_MAX_*`).

### Database Schema

The app auto-creates the minimal schema on first request:

- `threads`: stores title, type (`idea|project|discussion|context`), `status`, summary, JSONB tags, owner email, timestamps.
- `entries`: per-thread timeline entries with `role` (`owner|assistant|note`), `kind` (`message|context|decision`), and body text.

If you prefer migrations, mirror the SQL in `src/lib/db.ts`.

## Deployment on Vercel

1. Push this repo to GitHub.
2. Create a new Vercel project pointing to the repo.
3. In **Settings → Environment Variables**, add the same vars from `.env.local` (use the “production” scope at minimum).
   - For the database, either:
     - Create a Vercel Postgres (Neon) database and copy the provided `DATABASE_URL`, or
     - Bring your own Postgres and expose its URL.
4. Add your production domain (e.g., `context.yourdomain.com`) to the Google OAuth credentials authorized origins + redirect URIs. For Vercel previews, include `https://<project-name>-<git-branch>.vercel.app/api/auth/callback/google`.
5. Deploy. All routes are protected by NextAuth middleware; only allowed Google accounts can access the UI.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm start` | Run the compiled app |
| `npm run lint` | ESLint via the Next.js config |

## Next Steps / Ideas

- Add attachments or link previews to entries.
- Introduce AI-assisted summaries per thread.
- Implement reminders or follow-ups for stalled threads.
- Add exports (Markdown/JSON) for offline archival.

Feel free to iterate—this codebase is set up for quick UI/UX changes and deployment via Vercel.
