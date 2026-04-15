# Waitlist Setup (Vercel + Neon Postgres)

This project uses a Vercel Function endpoint at `POST /api/notify` to persist waitlist emails in Postgres.

## 1) Required environment variables

Set at least one of the following in Vercel:

- `POSTGRES_URL` (preferred)
- `DATABASE_URL` (fallback)

The API will fail fast if neither is set.

## 2) Create table schema

Run this SQL in the Neon SQL editor:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'site_contact_notify',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS waitlist_signups_created_at_idx
  ON waitlist_signups (created_at DESC);
```

## 3) Local development

Pull Vercel env vars into local env file:

```powershell
vercel env pull .env.development.local
```

Then run:

```powershell
npm run web:dev
```

## 4) Smoke test

Use curl or browser devtools:

```powershell
curl -X POST "http://localhost:5173/api/notify" `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"you@example.com\",\"source\":\"site_contact_notify\"}"
```

Expected response:

```json
{"ok":true,"message":"Thanks. You are on the waitlist."}
```

## 5) Notes

- Duplicate emails are safe: `ON CONFLICT (email)` updates source/metadata.
- API only accepts `POST`.
- Frontend form shows loading, success, and error states.
