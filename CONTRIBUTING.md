# Contributing to The Keyroute Project

Thanks for considering contributing — whether that's a bug report, a feature idea, a docs fix, or actual code. This guide covers what you need to know to get started.

## Before you start

Please read the [Code of Conduct](CODE_OF_CONDUCT.md) — contributions are expected to happen in a respectful, harassment-free environment.

## Ways to contribute

- **Report a bug** — open an [issue](https://github.com/basavarajpatil660/the-keyroute-project/issues) with clear reproduction steps, what you expected, and what actually happened. Include your Node version and OS if it's setup-related.
- **Suggest a feature** — open an issue describing the problem you're trying to solve, not just the feature itself — it helps figure out the best way to solve it.
- **Fix a documented limitation** — the README's [Limitations & known gaps](README.md#limitations--known-gaps) section lists known, real gaps (Anthropic routing, rate limiting, multi-user support) that are genuinely open for contribution.
- **Improve the docs** — README.md and SETUP.md fixes are just as valuable as code changes, especially from someone who just went through the setup process fresh and found something confusing.
- **Submit a pull request** — see below.

## Development setup

Follow [SETUP.md](SETUP.md) to get a working local install first — you'll want a real, working Keyroute instance to test any change against, not just a codebase that compiles.

```bash
git clone https://github.com/YOUR-USERNAME/the-keyroute-project.git
cd the-keyroute-project
npm install
cp .env.example .env.local
# fill in your own Supabase project's URL + anon key
npm run dev
```

## Before submitting a pull request

- **Run the linter:** `npm run lint` — should report zero new errors (there are two long-standing pre-existing warnings unrelated to most changes; don't worry about those, but don't add new ones).
- **Run the build:** `npm run build` — should complete without errors.
- **Test against a real Supabase project** if your change touches anything in `supabase/migrations/`, `supabase/functions/gateway/`, `api/`, or `src/lib/deploy-gateway.ts` — these are the most failure-prone parts of this codebase, and issues here often only show up against a genuinely fresh project, not an already-provisioned one. If you're changing a migration, test against a **fresh** Supabase project, since migrations are not written to be re-run (see [Limitations](README.md#limitations--known-gaps)).
- **Keep PRs focused** — one logical change per pull request is much easier to review than a bundle of unrelated fixes.

## Pull request process

1. Fork the repo and create a branch from `main` with a descriptive name (e.g. `fix/multipart-boundary`, `docs/setup-clarify-step-4`).
2. Make your change, following the existing code style (TypeScript, no `any` where avoidable, comments explaining *why* for anything non-obvious — this codebase leans toward well-commented over terse).
3. Open a pull request against `main` with:
   - A clear description of what changed and why
   - What you tested it against (local dev? a fresh Supabase project? both?)
   - Any relevant screenshots for UI changes
4. Be responsive to review feedback — this is a small, actively-maintained project, so review turnaround is usually reasonably quick.

## A note on database migrations specifically

If your change adds a new migration file to `supabase/migrations/`, keep in mind:

- Filenames are `<UTC-timestamp>_<name>.sql` and are applied in lexical (== chronological) order — use a timestamp later than the most recent existing migration.
- Migrations in this project are **not** written to be idempotent (no `IF NOT EXISTS` guards) — this is intentional for the current one-shot-per-project Deploy Gateway flow, so match that pattern rather than introducing a different one, unless you're specifically proposing to change that behavior project-wide (open an issue to discuss first, since it's a bigger design decision).
- If your migration touches a table's grants or RLS policies, double check both are actually correct — this project has hit real bugs before where an RLS policy existed but the matching table grant didn't (or vice versa), and PostgREST silently fails one way when that happens.

## Questions

Open an issue, or reach out at hello@basavaraj.dev.
