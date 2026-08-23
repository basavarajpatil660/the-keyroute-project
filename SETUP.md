# Setup Guide

This is the full, detailed walkthrough for getting Keyroute running — from a fresh clone to a live gateway. The [README](README.md) has the short version; this document assumes nothing and explains every step.

There are two ways to run the **dashboard** (the control panel — not the gateway itself, which always runs on Supabase regardless of which option you pick below):

- **[Part 1 — Local](#part-1--run-it-locally)**: runs on your own machine via `npm run dev`. Fastest to get started.
- **[Part 2 — Your own Vercel deployment](#part-2--deploy-the-dashboard-to-your-own-vercel-account)**: gives you a real HTTPS URL, reachable without your machine staying on.

You can do either one, or both against the same Supabase project. Read [Part 0](#part-0--before-you-start) first regardless of which path you pick.

---

## Part 0 — Before you start

### Prerequisites

| Requirement | Why | Check with |
|---|---|---|
| Node.js 20 or newer | Runs the dashboard | `node -v` |
| npm 10 or newer | Ships with Node | `npm -v` |
| Git | To clone the repo | `git --version` |
| A free Supabase account | Hosts your database, auth, and the gateway itself | Sign up at [supabase.com](https://supabase.com) |

### Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and click **New project**.
2. Pick any organization, give it a name, set a database password (save this somewhere — you won't need it for the one-click flow below, but you might want it later for direct database access), and choose a region close to you.
3. Wait for it to finish provisioning (a minute or two). Wait for the **Active** badge before continuing.
4. Once it's ready, open **Project Settings → API**. You'll need two values from this page in the next step:
   - **Project URL** — looks like `https://your-project-ref.supabase.co`
   - **Project API keys → anon public** — a long key, safe to expose in the browser (row-level security protects your data, not the secrecy of this key)

You do **not** need the `service_role` key for anything in this guide — the gateway edge function receives its own service credentials automatically from Supabase, and the one-click deploy flow uses a personal access token instead (explained below), not the service role key.

---

## Part 1 — Run it locally

### 1.1 Clone and install

```bash
git clone https://github.com/basavarajpatil660/the-keyroute-project.git
cd the-keyroute-project
npm install
```

(If you've forked the repo, use your fork's URL instead.)

### 1.2 Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the two values from Part 0:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Both are prefixed `VITE_`, which means they get compiled into the browser bundle — this is intentional and safe for these two specific values. Never put a `service_role` key behind a `VITE_` prefix.

### 1.3 Start the dev server

```bash
npm run dev
```

Open the URL it prints (typically `http://localhost:5173`). The homepage should render.

> **Important — do not go to `/dashboard` yet.** On a fresh install, `/dashboard`, `/dashboard/overview`, and every other dashboard route redirect straight back to the setup guide, because there's no signed-in session until you complete the next step. The one dashboard route that works right now is `/dashboard/connections` — go there directly.

### 1.4 Deploy the gateway (one click)

Go to **`/dashboard/connections`**.

1. Generate a **Supabase personal access token**: go to [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens), click **Generate new token**, name it anything, and copy it immediately (it's shown only once).
2. Paste that token into the **Supabase personal access token** field on the Connections page.
3. Click **Deploy Gateway**.

This single click:

1. Applies every SQL migration in `supabase/migrations/` to your project (creates tables, RLS policies, encryption helpers, and RPC functions)
2. Silently creates and signs you into an owner account for this install (no login form, no email — it's fully automated)
3. Deploys the gateway itself as a Supabase Edge Function

It typically takes 30–60 seconds. When it succeeds, you'll see a green confirmation with your live gateway URL:
```
https://your-project-ref.supabase.co/functions/v1/gateway
```

**This step can only be run once per fresh Supabase project.** The migrations are not written to be re-run — if Deploy Gateway fails partway through and you need to retry, you'll need to either reset that project's schema (drop everything and start clean) or use a different, genuinely fresh Supabase project. This is expected, one-shot-per-project behavior, not a bug.

Your personal access token is used exactly once, held only in memory for the duration of this request, and is never written to a database, `localStorage`, `sessionStorage`, or any log.

### 1.5 Now the dashboard works

With that owner session created, `/dashboard`, `/dashboard/overview`, `/dashboard/keys`, `/dashboard/usage`, and `/dashboard/settings` are all reachable now.

### 1.6 Add your first provider key

Go to **Provider Keys**. Add a key from OpenAI, Groq, Gemini, or any custom OpenAI-compatible endpoint, and give it a short label — this label becomes your routing prefix (e.g. `openai-work`).

### 1.7 Generate a platform key

Go to **Settings → Platform Keys** and create one. This is the key your applications use to authenticate to your gateway — it is shown once, so save it somewhere safe immediately. It never touches your provider keys directly; the gateway resolves it to the right provider key internally.

### 1.8 Test it

```bash
curl -X POST "https://your-project-ref.supabase.co/functions/v1/gateway" \
  -H "Authorization: Bearer pk_live_your_platform_key" \
  -H "Content-Type: application/json" \
  -d '{"model": "your-label/gpt-4o-mini", "messages": [{"role":"user","content":"say hello in five words"}]}'
```

A real completion response back means the entire pipeline is working end-to-end.

> **Windows PowerShell note:** the built-in `curl` is aliased to `Invoke-WebRequest`, which does not accept `-H` the same way. Use `curl.exe` instead of `curl` to get the real curl binary, or use `Invoke-RestMethod` with a `-Headers @{...}` hashtable.

---

## Part 2 — Deploy the dashboard to your own Vercel account

This is entirely optional. It doesn't change how the gateway works — that's already running permanently on Supabase after Part 1.4 above, independent of where (or whether) the dashboard is hosted. This just gives your dashboard a real HTTPS URL that doesn't depend on your own machine staying on.

### 2.1 Prerequisites

- A free [Vercel](https://vercel.com) account.
- Either your own fork of this repo on GitHub (recommended if you plan to customize anything), or a direct connection to the original repo (faster if you don't).

### 2.2 Import the project

1. Go to [vercel.com/new](https://vercel.com/new) and click **Import Git Repository**.
2. Select your fork (or the repo).
3. Vercel should auto-detect it as a **Vite** project. Confirm these build settings (they should auto-fill correctly):
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`

### 2.3 Set environment variables

**Before** your first deploy, go to the new Vercel project's **Settings → Environment Variables** and add the same two values from Part 0:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

You can point this at the **same** Supabase project you used locally, or a separate one — both are valid setups.

### 2.4 Deploy

Click **Deploy**. Vercel builds the project and gives you a URL like `your-project-name.vercel.app`. The repo already includes a `vercel.json` with the SPA routing rewrite React Router needs — nothing extra to configure there.

### 2.5 Run Deploy Gateway from the new URL

Go to `https://your-project-name.vercel.app/dashboard/connections` and repeat the same one-click flow from Part 1.4 — **but only if this is a genuinely fresh Supabase project that hasn't had Deploy Gateway run against it yet.** If you're pointing this Vercel deployment at the same Supabase project you already set up locally, skip straight to using this new URL as your dashboard — running Deploy Gateway again will fail with "already exists" errors, since migrations aren't idempotent.

### 2.6 What's different under the hood

The proxy logic that lets Deploy Gateway work around Supabase's Management API CORS restrictions runs two ways depending on where the dashboard is hosted:

- **Locally:** a Vite dev-server middleware runs the same proxy logic as part of `npm run dev`.
- **On Vercel:** the equivalent logic runs as Vercel serverless functions (`api/management-proxy.ts` and friends).

Both call the exact same underlying shared code — nothing to configure differently, and both have been tested working end-to-end.

### 2.7 Custom domain (optional)

Vercel supports adding your own domain under **Project Settings → Domains**, if you'd rather have something nicer than `*.vercel.app`.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Visiting `/dashboard` redirects you back to setup | No session exists yet | Go to `/dashboard/connections` and run Deploy Gateway first |
| Deploy Gateway fails with "relation already exists" | Migrations already ran once against this project | Use a fresh Supabase project, or manually reset this one's schema |
| "Invalid multipart boundary" during function deploy | Old cached build — this was a real bug, fixed in this repo | Pull the latest `main` |
| "Email address is invalid" during owner account creation | Old cached build — this was a real bug, fixed in this repo | Pull the latest `main` |
| "permission denied for table ..." after a successful connection | Missing table grant — this was a real bug, fixed in this repo | Pull the latest `main` |
| PowerShell `curl` errors about `-H`/`Headers` | Windows aliases `curl` to `Invoke-WebRequest` | Use `curl.exe` instead of `curl` |

---

## Questions

Open an issue on the repo, or see the in-app **Docs** and **Help** pages once the dashboard is running.
