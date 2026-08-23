# Setup Guide

The full walkthrough, screenshot-detail level. If you just want the fast version, the [README](README.md#quick-start) has it — this document assumes nothing and explains every single step, including what you should actually *see* at each point.

```mermaid
flowchart TD
    A([Start here]) --> B[Part 0 — Prerequisites<br/>+ create a Supabase project]
    B --> C{Where do you want<br/>the dashboard to live?}
    C -->|Just my own machine| D[Part 1 — Local<br/>npm run dev]
    C -->|A real HTTPS URL| E[Part 2 — Your own<br/>Vercel account]
    D --> F[Both end here:<br/>Deploy Gateway → add keys → test]
    E --> F
```

---

## Part 0 — Before you start

### ✅ Prerequisites checklist

- [ ] **Node.js 20 or newer** — check with `node -v`. Get it from [nodejs.org](https://nodejs.org) if needed.
- [ ] **npm 10 or newer** — ships with Node, check with `npm -v`.
- [ ] **Git** — check with `git --version`.
- [ ] **A free Supabase account** — sign up at [supabase.com](https://supabase.com). The free tier covers everything in this guide.

Don't move to the next section until every box above is genuinely true — most setup problems trace back to one of these being missing or out of date.

### Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and click **New project**.
2. Pick any organization, name it whatever you like, set a database password (write it down somewhere — you won't need it for anything in this guide, but you may want it later for direct database access), and choose a region close to you.
3. Wait for provisioning to finish. **Do not continue until you see the "Active" status badge** — trying to use the project before it's fully ready is a common source of confusing errors.
4. Once it's active, open **Project Settings → API**. You need exactly two values from this page for the rest of this guide:

| Value | Where to find it | What it looks like |
|---|---|---|
| **Project URL** | Top of the API settings page | `https://abcdefghijklmnop.supabase.co` |
| **anon public key** | Under "Project API keys" | A long string starting with `eyJ...` |

> You do **not** need the `service_role` key for anything in this guide. The gateway function gets its own service credentials automatically from Supabase. Keep the `service_role` key private regardless — it bypasses every security rule in your project.

---

## Part 1 — Run it locally

### 1.1 Clone and install

```bash
git clone https://github.com/basavarajpatil660/the-keyroute-project.git
cd the-keyroute-project
npm install
```

If you've forked the repo instead of using it directly, swap in your fork's URL.

**Expected result:** a `node_modules` folder appears, and the command finishes without red error text. If you see permission errors, you likely need to fix your npm/Node installation before continuing — that's outside the scope of this guide, but the error message itself usually names the exact problem.

### 1.2 Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` in any text editor and fill in the two values from Part 0:

```
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-actual-key...
```

Both variables are prefixed `VITE_`, which means Vite compiles them directly into the browser bundle. This is intentional and safe for exactly these two values — never put a `service_role` key behind a `VITE_` prefix, since anything with that prefix becomes publicly visible in your shipped code.

### 1.3 Start the dev server

```bash
npm run dev
```

**Expected result:** the terminal prints something like:
```
  VITE ready in 400 ms
  ➜  Local:   http://localhost:5173/
```

Open that URL in your browser. You should see the Keyroute homepage.

> ### ⚠️ Do not go to `/dashboard` yet
> On a fresh install, visiting `/dashboard`, `/dashboard/overview`, or any other dashboard route immediately redirects you back here — because there's no signed-in session yet. This is expected, correct behavior, not a bug. The one route that *does* work right now is `/dashboard/connections`, because it's specifically where that first session gets created.

### 1.4 Deploy the gateway (one click)

Navigate your browser to:
```
http://localhost:5173/dashboard/connections
```

You'll see a **"Deploy Gateway"** card. Before clicking it, you need a personal access token:

1. In a new tab, go to [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).
2. Click **Generate new token**.
3. Give it any name (e.g. `keyroute-setup`).
4. **Copy the token immediately** — it starts with `sbp_` and is shown to you exactly once. If you lose it, just generate a new one.

Back on the Connections page:

1. Paste the token into the **"Supabase personal access token"** field.
2. Click **Deploy Gateway**.

You'll see status text update as it works through several steps — this normally takes **30 to 60 seconds**. Under the hood, this one click:

```mermaid
sequenceDiagram
    participant You as Your browser
    participant Proxy as Local proxy (npm run dev)
    participant Supabase as Supabase Management API
    You->>Proxy: Click "Deploy Gateway"
    Proxy->>Supabase: Apply all SQL migrations
    Supabase-->>Proxy: Tables, RLS policies, RPCs created
    Proxy->>Supabase: Deploy gateway Edge Function
    Supabase-->>Proxy: Function live
    Proxy-->>You: Silently create + sign in owner account
    You->>You: ✅ Green success message + live gateway URL
```

**What success looks like:** a green message showing something like:
```
Gateway deployed — signed in silently as owner-xxxxxxxx@example.com.
Your project is live at: https://abcdefghijklmnop.supabase.co/functions/v1/gateway
```

> ### ⚠️ This step only works ONCE per fresh Supabase project
> The database migrations are not written to be safely re-run. If Deploy Gateway fails partway through and you click it again on the *same* project, you'll get errors like `relation "..." already exists`. If that happens, your options are:
> - Use a different, genuinely fresh Supabase project, **or**
> - Manually reset the existing project's schema (drop all tables and functions) before retrying
>
> This is expected one-shot behavior for now, not a bug to report.

### 1.5 The dashboard now works

With that owner session created, all of these are now reachable:
- `/dashboard` (Overview)
- `/dashboard/keys` (Provider Keys)
- `/dashboard/usage` (Usage)
- `/dashboard/settings` (Settings, including Platform Keys)

### 1.6 Add your first provider key

Go to **Provider Keys** in the sidebar. Click to add a key, choose the provider (OpenAI, Groq, Gemini, or Custom), paste in your real API key from that provider, and give it a short **label** — this label is what you'll use for routing later. Something like `openai-work` or `groq-fast` works well.

### 1.7 Generate a platform key

Go to **Settings → Platform Keys**. Click to create a new one.

> **Copy it the moment it appears.** Platform keys (starting with `pk_live_`) are shown exactly once, the same as the personal access token earlier. If you close the dialog without copying it, you'll need to generate a new one — there's no way to reveal the same key again later.

This is the key your own applications will use to talk to the gateway. It never touches your real provider keys directly — the gateway resolves it internally.

### 1.8 Test it

Open a terminal and run:

```bash
curl -X POST "https://abcdefghijklmnop.supabase.co/functions/v1/gateway" \
  -H "Authorization: Bearer pk_live_your_platform_key_here" \
  -H "Content-Type: application/json" \
  -d '{"model": "your-label/gpt-4o-mini", "messages": [{"role":"user","content":"say hello in five words"}]}'
```

Replace the project URL, platform key, and label/model with your own real values.

**Expected result:** a JSON response containing an actual AI-generated message, something like:
```json
{"id":"...","choices":[{"message":{"role":"assistant","content":"Hello there, nice to meet you!"}}]}
```

If you get that back, the entire pipeline — browser button, Supabase project, live routing, real AI completion — is working end to end. 🎉

> **Using Windows PowerShell?** The built-in `curl` command is secretly an alias for `Invoke-WebRequest`, which handles `-H` completely differently and will error out confusingly. Use `curl.exe` (adding `.exe` forces the real curl binary) instead of plain `curl`, or use PowerShell's native `Invoke-RestMethod` with a `-Headers @{...}` hashtable instead.

---

## Part 2 — Deploy the dashboard to your own Vercel account

Entirely optional, and it changes nothing about how the gateway works — that's already running permanently on Supabase after Part 1.4, independent of where (or whether) any dashboard is deployed anywhere. This section just gives your dashboard a real, always-reachable HTTPS URL instead of `localhost`.

### 2.1 Prerequisites

- A free [Vercel](https://vercel.com) account.
- Either your own fork of this repo on GitHub (recommended if you want to customize anything later), or a direct connection to the original repo (faster if you don't plan to change anything).

### 2.2 Import the project into Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Click **Import Git Repository** and select your fork (or the repo).
3. Vercel auto-detects this as a **Vite** project. Confirm these build settings show up correctly (they should auto-fill):

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Install command | `npm install` |

### 2.3 Set environment variables — before your first deploy

Go to the new Vercel project's **Settings → Environment Variables** and add the same two values from Part 0:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

You can point this at the **same** Supabase project you used locally in Part 1, or an entirely separate one — both are valid. If you reuse the same project, skip straight to step 2.5 below (don't run Deploy Gateway twice against one project).

### 2.4 Deploy

Click **Deploy**. Vercel builds the project and gives you a live URL, something like:
```
https://your-project-name.vercel.app
```

The repo already ships with a `vercel.json` containing the SPA routing rewrite that React Router needs to work correctly — nothing extra to configure there.

### 2.5 Run Deploy Gateway from the new URL (only if this is a fresh project)

If you're pointing this Vercel deployment at a **brand-new** Supabase project that hasn't had Deploy Gateway run against it yet, repeat exactly the same steps from **Part 1.4**, just using `https://your-project-name.vercel.app/dashboard/connections` instead of `localhost`.

If you're pointing it at the **same** Supabase project you already deployed to in Part 1, skip this — just start using the new Vercel URL as your dashboard directly. Running Deploy Gateway again would fail with "already exists" errors, same as explained in 1.4's warning.

### 2.6 What's different under the hood (informational, no action needed)

Deploy Gateway needs a server-side hop to talk to Supabase's Management API (browsers can't call it directly due to CORS). That hop runs two different ways depending on where the dashboard lives — same underlying logic either way, nothing to configure differently:

- **Local (`npm run dev`)** — a Vite dev-server middleware handles it, running inside the same Node process as your dev server.
- **Vercel** — the same logic runs as Vercel serverless functions (`api/management-proxy.ts` and its siblings).

### 2.7 Optional: custom domain

Under **Project Settings → Domains** in Vercel, you can attach your own domain if you'd rather not use the default `*.vercel.app` address.

---

## Troubleshooting

```mermaid
flowchart TD
    A[Something's not working] --> B{What are you seeing?}
    B -->|Redirected to /setup<br/>when visiting /dashboard| C[No session yet —<br/>go to /dashboard/connections first]
    B -->|"relation already exists"| D[Migrations already ran once —<br/>use a fresh Supabase project]
    B -->|"Invalid multipart boundary"| E[Old cached build —<br/>pull latest main, this was fixed]
    B -->|"Email address is invalid"| F[Old cached build —<br/>pull latest main, this was fixed]
    B -->|"permission denied for table"| G[Old cached build —<br/>pull latest main, this was fixed]
    B -->|PowerShell curl -H errors| H["Use curl.exe instead of curl"]
```

| Symptom | Cause | Fix |
|---|---|---|
| Visiting `/dashboard` redirects you back to setup | No session exists yet | Go to `/dashboard/connections` and run Deploy Gateway first |
| Deploy Gateway fails with `relation "..." already exists` | Migrations already ran once against this project | Use a fresh Supabase project, or manually reset this one's schema |
| `Invalid multipart boundary` during function deploy | Stale build predating a fix in this repo | `git pull` to get the latest `main` |
| `Email address is invalid` during owner account creation | Stale build predating a fix in this repo | `git pull` to get the latest `main` |
| `permission denied for table ...` after a successful connection | Stale build predating a fix in this repo | `git pull` to get the latest `main` |
| PowerShell `curl` complains about `-H` / `Headers` | Windows aliases `curl` to `Invoke-WebRequest` | Use `curl.exe` instead of plain `curl` |

If you hit something not on this list, open an issue with the exact error text — that's genuinely the fastest way to get it fixed for everyone.

---

## What's next

Once everything above is working, the in-app **Docs** page has the full API reference and routing details, and the **Help** page has a plain-language overview if you ever need to explain this project to someone else.
