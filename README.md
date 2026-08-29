# The Keyroute Project — Self-Hosted AI Gateway on Supabase

**A self-hosted AI gateway you deploy inside your own Supabase project — one platform key routes to all your existing OpenAI, Claude, Gemini, and Groq API keys. No third-party relay. No hosted middleman.**

> Note: "Keyroute" also refers to an unrelated travel-booking app and a community wireless network — this project is **The Keyroute Project**, a self-hosted AI gateway built on Supabase Edge Functions. If you're searching for a self-hosted LiteLLM alternative, a self-hosted Portkey alternative, or a BYOK AI gateway that never leaves your own infrastructure, you're in the right place.

[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen)](LICENSE)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Self-Hosted](https://img.shields.io/badge/Deployment-Self--Hosted-blue)]()

---

## What The Keyroute Project Is

The Keyroute Project is a self-hosted AI gateway and BYOK (bring-your-own-key) key router. It runs entirely as a Supabase Edge Function inside **your own Supabase project** — there is no external server, no SaaS backend, and no relay that ever sees your provider keys in plaintext.

Unlike hosted AI gateway products, self-hosting Keyroute means your API keys, your usage logs, and your request traffic never leave infrastructure you control.

**What it is not:** Keyroute is not a model marketplace or model aggregator. It doesn't resell or provide models. It's a key router — it lets you access the provider keys you already own (OpenAI, Anthropic/Claude, Google Gemini, Groq, and more) through a single label-based platform key.

## Why Self-Host an AI Gateway With Keyroute

| | The Keyroute Project | Hosted gateways (OpenRouter, Portkey Cloud) | Self-hosted alternatives (LiteLLM, Portkey OSS) |
|---|---|---|---|
| Where it runs | Entirely inside your own Supabase project | Vendor's servers | Your own server/container you must provision |
| Key custody | Your keys, encrypted via Supabase Vault, never leave your project | Vendor holds/proxies your keys | You manage your own key storage |
| Setup | One-click Deploy Gateway button, no CLI required | Sign up, add billing | Manual server setup, Docker/config files |
| Billing model | Free — you only pay your own provider costs | Markup or subscription | Free, but you run and maintain the infra |

If you already have a Supabase project and want a self-hosted AI gateway without standing up a separate server, this is the gap Keyroute fills.

## Architecture

- **Gateway logic** (key validation, Vault decryption, provider routing, streaming, usage logging) runs as a Supabase Edge Function (Deno runtime) — permanent, inside your project, independent of any local server
- **Dashboard**: React/Vite/TypeScript control panel — pure frontend, talks to your Supabase project
- **Auth**: silent auto-provisioned single-owner account created during the Deploy Gateway flow — no separate signup step
- **Key storage**: Supabase Vault (pgcrypto), never stored in plaintext, never logged
- **Supported providers**: OpenAI, Anthropic/Claude, Google Gemini, Groq (Anthropic routing currently a stub — see roadmap)

## Getting Started

1. Fork or clone this repo
2. Connect your own Supabase project
3. Click **Deploy Gateway** in the dashboard — this provisions the owner account, deploys the Edge Function, and seeds the Vault encryption key automatically
4. Add your provider API keys through the dashboard (encrypted at rest via Vault)
5. Point your app at your gateway endpoint using a label-based platform key (e.g. `openai/gpt-4` or let it auto-select your sole active key)

No manual CLI deployment steps. No external relay to configure.

## FAQ

**Is Keyroute a self-hosted LiteLLM alternative?**
Yes — if you want an AI gateway that runs inside your own Supabase project rather than a separately hosted proxy server, Keyroute is built for that use case specifically.

**Does Keyroute ever see or store my provider API keys unencrypted?**
No. Provider keys are encrypted via Supabase Vault (pgcrypto) at rest and decrypted only at request time inside your own Supabase Edge Function.

**Do I need Vercel or any external hosting to run Keyroute?**
No — Vercel is optional. The gateway itself runs entirely on Supabase Edge Functions.

**What's the difference between Keyroute and Keyroute.net or the Keyroute travel app?**
None of these projects are related. The Keyroute Project is an open-source, self-hosted AI API gateway built on Supabase — unrelated to any travel-booking service or wireless network project sharing a similar name.

## Comparison

See [`docs/comparison.md`](docs/comparison.md) for a detailed comparison against LiteLLM, Portkey, and OpenRouter on the BYOK/key-custody/billing axis.

## License

MIT — see [LICENSE](LICENSE)

## Contributing

Contributions welcome. Open an issue or PR.

---

Built by [**@basavarajpatil660**](https://github.com/basavarajpatil660) — part of a broader push toward serverless, free-tier-first AI infrastructure. See also [Ultimate AI Agent](https://github.com/basavarajpatil660/Ultimate-Ai) and [basavaraj.dev](https://basavaraj.dev).
