# Deployment Guide

This guide is for contributors and self-hosters who want to run OpenSaga beyond local demo mode.

OpenSaga can run in two modes:

- **Demo mode:** no Supabase credentials. The UI remains explorable with mock/demo data.
- **Configured mode:** Supabase Auth, Postgres, RLS, migrations, and optional Edge Functions.

## Prerequisites

- Node.js 20+
- A Supabase project
- A deployment host such as Vercel, Netlify, or Cloudflare Pages
- Optional: Supabase CLI for migrations and Edge Functions

## 1. Clone and Install

```bash
git clone https://github.com/demarcuscrump/opensaga.git
cd opensaga
npm install
```

## 2. Create Environment Variables

```bash
cp .env.example .env.local
```

Fill in:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Only use the public anon key in frontend environments. Never expose the Supabase service role key to the browser.

## 3. Apply Database Migrations

Option A: Supabase SQL Editor

1. Open Supabase Dashboard.
2. Go to SQL Editor.
3. Run `supabase/migrations/001_initial_schema.sql`.
4. Run `supabase/migrations/002_reputation_rpc.sql`.

Option B: Supabase CLI

```bash
supabase link --project-ref your-project-ref
supabase db push
```

After migrations, verify these tables exist:

- `profiles`
- `worlds`
- `bible_sections`
- `entities`
- `votes`
- `memberships`
- `activity`

## 4. Configure Auth Providers

In Supabase Dashboard:

1. Go to Authentication -> Providers.
2. Enable the providers you want: GitHub, Discord, and/or Google.
3. Add provider client IDs and secrets.
4. Add redirect URLs for local and production environments.

Common redirect URLs:

```text
http://localhost:3000
https://your-production-domain.com
```

Also configure Site URL in Supabase Authentication settings.

## 5. Deploy the App

### Vercel

Build command:

```bash
npm run build
```

Output directory:

```bash
dist
```

Environment variables:

```bash
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### Netlify

Build command:

```bash
npm run build
```

Publish directory:

```bash
dist
```

For hash routing, no extra rewrite is required. If OpenSaga moves to browser history routing later, add a SPA fallback.

### Cloudflare Pages

Build command:

```bash
npm run build
```

Output directory:

```bash
dist
```

## 6. Deploy Proposal Tally Edge Function

The Edge Function lives at:

```text
supabase/functions/tally-proposals/index.ts
```

Deploy:

```bash
supabase functions deploy tally-proposals
```

The function needs these server-side environment variables:

```bash
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Schedule it with Supabase cron, an external scheduler, or a trusted backend job. Do not call it from the browser with a service role key.

## 7. Verify

Run local checks:

```bash
npm run check
npm run test:e2e
```

Manual production smoke test:

1. Load the deployed app.
2. Sign in with a configured OAuth provider.
3. Create a world.
4. Submit a proposal.
5. Vote on the proposal with a different account.
6. Verify proposal tallying through the trusted Edge Function path.
7. Confirm RLS prevents unauthorized updates.

## 8. Security Checklist Before Public Beta

- RLS reviewed for anonymous, member, author, creator, and non-member roles
- OAuth redirect URLs verified
- Service role key never exposed to frontend code
- Content Security Policy configured
- BYOK/localStorage risk reviewed
- User-generated content sanitization reviewed
- Edge Function authentication verified
- Dependency audit process documented

## Troubleshooting

### App runs but only shows demo data

Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present in the deployment environment and that the app was rebuilt after setting them.

### OAuth redirects fail

Check Supabase Authentication settings. The production domain and local domain must be allowed redirect URLs.

### Proposal tallying does not run

Confirm the Edge Function is deployed, has server-side env vars, and is called by a trusted scheduler.

### RLS blocks expected writes

Verify the authenticated user has a profile and that the relevant `creator_id`, `author_id`, or `user_id` matches `auth.uid()`.
