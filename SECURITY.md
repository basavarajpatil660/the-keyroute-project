# Security Policy

## Reporting a vulnerability

If you find a security issue in Keyroute, please **do not open a public GitHub issue**. Instead, email **hello@basavaraj.dev** with:

- A description of the issue and its potential impact
- Steps to reproduce it, if possible
- Any relevant logs, screenshots, or code snippets

You should expect an initial response within a few days. Since this is a self-hosted, community-maintained project rather than a company with a formal security team, response times may vary — but every report is taken seriously and will be acknowledged.

Please give a reasonable amount of time to investigate and fix an issue before disclosing it publicly.

## Supported versions

This project doesn't currently maintain multiple release branches — security fixes are applied to `main` only. Self-hosted installs should track `main` and pull updates periodically, especially for anything flagged as a security fix in a commit message or release note.

## What's already been hardened

For transparency, here's what the current security model already covers (see the [README's Security model section](README.md#security-model) for full detail):

- Provider API keys are encrypted at rest via Supabase Vault (AES-256) — the application layer never reads them back in plaintext.
- Every user-data table has both row-level security policies **and** the matching table-level grants required to actually enforce them via Supabase's REST API.
- All mutating operations go through `SECURITY DEFINER` database functions with explicit, minimal role grants (`REVOKE ALL FROM PUBLIC` → `REVOKE ALL FROM anon` → `GRANT EXECUTE TO authenticated`).
- The one-click deploy flow's Supabase personal access token is held only in browser memory for the duration of one request and is never persisted anywhere — not to a database, `localStorage`, `sessionStorage`, or any log.

## Things to keep in mind as a self-hoster

Since you're running your own instance, a few things are on you rather than the project:

- **Keep your Supabase personal access token private** — it's account-wide. Only paste it directly into the Deploy Gateway field, never into chat tools, screenshots, or anywhere else.
- **Rotate tokens and platform keys** if you ever suspect they've been exposed — both can be regenerated freely from the Supabase dashboard and the Keyroute Settings page, respectively.
- **Keep your Supabase project's database password private** — it's not used by the app itself, but it's still a sensitive credential for your project.

## Known limitations

This project doesn't currently include built-in rate limiting or spend caps at the gateway level — see the README's [Limitations & known gaps](README.md#limitations--known-gaps) section. This isn't a security vulnerability in the traditional sense, but it's worth knowing if you're self-hosting for anything beyond personal use.
