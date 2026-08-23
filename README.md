# The Keyroute Project

**One URL for every AI provider you use — running entirely inside your own Supabase project.**

Keyroute is a self-hostable AI API gateway. You add the provider keys you already have (OpenAI, Groq, Gemini, Anthropic-compatible, or any custom OpenAI-compatible endpoint), give each one a short label, and get back a single OpenAI-compatible URL. Switching providers or keys later means changing one word in your code — not re-plumbing your whole app.

Everything — key storage, encryption, request routing, usage logging — runs as a Supabase Edge Function **inside your own Supabase project**. There is no third-party server in the request path. Nobody but you ever sees your keys, your prompts, or your usage data.

<p align="center">
  <img src="docs/homepage.png" alt="Keyroute homepage" width="800">
</p>

<p align="center">
  <img src="docs/dashboard-overview.png" alt="Keyroute dashboard overview" width="800">
</p>

---

## Why this exists

This project started from a simple annoyance: juggling API keys for OpenAI, Groq, and Gemini across a handful of personal projects, and having to hardcode a different base URL and a different key into every single one of them. Rotating a key meant hunting down every project that used it. Trying a different provider for a project meant editing code, not just flipping a setting.

The obvious answer was some kind of gateway — one URL, one key, route by label. Plenty of hosted "AI gateway" products already do this. The problem is they all want your provider keys sitting on *their* servers. That's a real trust requirement for something as sensitive as API keys that can rack up real charges — and it's a single point of failure if their service goes down or shuts down.

Keyroute exists to remove that trade-off entirely: you get the one-URL, one-key convenience, but the entire thing runs inside infrastructure you already control — your own Supabase project. Nothing to trust a third party with. Nothing that stops working if some company pivots or shuts down. If you can create a free Supabase project, you can run this permanently, for free, forever.

Along the way, getting the self-host flow to work as an actual one-click button (rather than "here's fifteen CLI commands, good luck") turned into its own project — Supabase's Management API doesn't allow direct browser calls, function deployment needs real multipart form data, synthetic accounts need real-looking email domains, and PostgreSQL grants and RLS policies are two separate things that both need to be right. All of that is already solved here so you don't have to rediscover it yourself.

---

## What you get

- **One routing convention, any provider.** Prefix a model name with your key's label — `openai-work/gpt-4o`, `groq-fast/llama-3.3-70b`, `gemini-pro/gemini-2.0-flash` — and Keyroute resolves it to the right provider and the right key automatically. Only one key configured? Skip the prefix entirely.
- **Drop-in OpenAI compatibility.** Point any existing OpenAI SDK (Python, JS, or raw HTTP) at your Keyroute URL, swap in your Keyroute platform key, and everything else about your code stays the same — including streaming.
- **Your keys never leave your project.** Provider keys are encrypted with Supabase Vault (AES-256) before they're stored. Only a security-definer database function inside your own project can decrypt them — the dashboard application layer never sees the plaintext key again after you paste it in.
- **Real usage visibility.** Every request is logged with model, token counts, latency, and status — so you can actually see what you're spending and where, broken down by key and by provider.
- **Runs without you.** Once deployed, the gateway is a Supabase Edge Function. It keeps working whether or not your laptop, your terminal, or this dashboard happen to be open. The dashboard is a control panel, not a dependency.
- **One-click deploy.** No CLI commands required to get running — see [Quick start](#quick-start) below.

---

## How it works, architecturally

```
Your app / SDK
      │
      │  Bearer pk_live_...
      ▼
┌─────────────────────────────────────────────┐
│   Gateway (Supabase Edge Function, Deno)     │
│   — validates your platform key              │
│   — resolves label/model → provider + key    │
│   — decrypts the real provider key (Vault)   │
│   — forwards the request, streams the reply  │
│   — logs usage                               │
└─────────────────────────────────────────────┘
      │
      ▼
 OpenAI / Groq / Gemini / custom endpoint
```

The React dashboard (this repo) is a control panel for managing keys and viewing usage — it talks to the same Supabase project via the normal Supabase client library, protected by row-level security. It is never in the path of an actual AI request; the Edge Function handles that directly.

---

## Supported providers

| Provider | Status |
|---|---|
| OpenAI | ✅ |
| Groq | ✅ |
| Gemini (OpenAI-compatible layer) | ✅ |
| Any custom OpenAI-compatible endpoint | ✅ |
| Anthropic | 🚧 Not yet — message format differs from the OpenAI-compatible shape the gateway currently speaks. Adding a key shows an explicit "not implemented yet" notice rather than silently failing. |

---

## Quick start

You need a free [Supabase](https://supabase.com) account. That's the only external dependency.

```bash
git clone https://github.com/basavarajpatil660/the-keyroute-project.git
cd the-keyroute-project
npm install
cp .env.example .env.local
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project's
# Settings → API page
npm run dev
```

Then, **in the browser**, go straight to `/dashboard/connections` (not `/dashboard` — see note below), paste in a [Supabase personal access token](https://supabase.com/dashboard/account/tokens), and click **Deploy Gateway**. That one click:

1. Applies all database migrations to your Supabase project
2. Deploys the gateway as an always-on Edge Function
3. Silently provisions and signs you into an owner account for this install

No CLI commands, no manual dashboard clicking beyond that one button.

> **Why `/dashboard/connections` specifically?** Every other dashboard route (`/dashboard`, `/dashboard/overview`, etc.) requires a signed-in session, which doesn't exist yet on a fresh install — visiting them redirects you straight to the setup guide. `/dashboard/connections` is the one route that's reachable before that session exists, because it's where you create it.

For the full walkthrough — including how to deploy the dashboard itself to your own Vercel account instead of running it locally — see **[SETUP.md](SETUP.md)**.

---

## Routing convention

```
POST https://<your-project-ref>.supabase.co/functions/v1/gateway
Authorization: Bearer pk_live_...
Content-Type: application/json

{
  "model": "openai-work/gpt-4o",
  "messages": [{ "role": "user", "content": "hello" }],
  "stream": true
}
```

The part before the slash is the label you gave a provider key in the dashboard. The part after the slash is the model name exactly as that provider expects it. If you've only configured one provider key, you can omit the label and slash entirely.

Streaming, non-streaming, and token usage all behave exactly as they do calling the provider directly — Keyroute is a pass-through, not a re-implementation.

---

## Security model

- Provider keys are encrypted via **Supabase Vault** before being written to the database; the application layer never reads them back in plaintext.
- Every user-data table has **row-level security** scoping every row to its owner (`auth.uid() = user_id`), plus the matching table-level grants to actually make that enforceable via the REST API — both pieces are required, and it's easy to add one without the other.
- All mutations (adding a key, rotating it, deleting a connection) go through **`SECURITY DEFINER`** RPC functions with explicit, minimal grants — `REVOKE ALL FROM PUBLIC`, then `REVOKE ALL FROM anon`, then `GRANT EXECUTE TO authenticated` only where needed.
- The one-click deploy flow uses a Supabase personal access token that is **used once, in your browser's memory, and discarded immediately** — it is never written to a database, `localStorage`, `sessionStorage`, or any log.

---

## Tech stack

- **Frontend:** React 19, Vite, TypeScript, React Router, TanStack Query
- **Backend:** Supabase (Postgres, Auth, Vault, Edge Functions on Deno)
- **Optional hosting:** Vercel (for the dashboard only — the gateway itself is Supabase-native regardless of where, or whether, the dashboard is deployed)

---

## Project status

Actively developed, self-host flow fully tested end-to-end against fresh Supabase projects on both local (`npm run dev`) and Vercel-hosted dashboards. Anthropic routing is the one known gap (see [Supported providers](#supported-providers)).

## License

MIT — see [LICENSE](LICENSE). Self-host it, fork it, modify it, ship it.

## Questions / feedback

Open an issue on this repo, or reach out at hello@basavaraj.dev.
