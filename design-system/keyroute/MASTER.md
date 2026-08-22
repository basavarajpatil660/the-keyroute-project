# Design System Master File — Keyroute

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Keyroute
**Category:** API Gateway / Developer Infrastructure Tool (WEB, not mobile)
**Design Dials:** Variance 4/10 (Balanced / Modern) | Motion 3/10 (Subtle) | Density 5/10 (Standard)

---

## Design Philosophy

Keyroute is infrastructure, not a mobile app and not an enterprise sales product. Signal trustworthiness through clean hierarchy, technical precision through monospace accents and structured layout, and distinctiveness through an amber+indigo duality that references routing (signals on wires).

**Explicitly forbidden — do not introduce any of these under any circumstance:**
- Green as an accent color anywhere on this project (this was a past mistake — the ONLY accent colors are amber and indigo, defined below)
- Mobile-app patterns: glassmorphism blur headers, haptic feedback references, Reanimated/React Native animation code, bottom nav bars
- Enterprise B2B sales patterns: "Contact Sales" CTAs, "Client Logos" sections, "Solutions by Industry/Role" navigation
- Neon colors, cyberpunk aesthetics
- Cream + terracotta warmth

## Color Tokens (exact — do not substitute or invent new colors)

### Dark Theme (Primary)
| Token | Value | CSS Variable |
|-------|-------|--------------|
| Base background | `#0a0f1a` | `--color-base` |
| Alt background | `#0d1420` | `--color-base-alt` |
| Surface | `#111827` | `--color-surface` |
| Surface-2 | `#1a2235` | `--color-surface-2` |
| Border | `#1e2d45` | `--color-border` |
| Text primary | `#f0f4ff` | `--color-text-primary` |
| Text muted | `#7a8ba8` | `--color-text-muted` |
| Text faint | `#3d5170` | `--color-text-faint` |
| Amber (accent 1, ONLY warm accent) | `#e8a020` | `--color-amber` |
| Indigo (accent 2, ONLY cool accent) | `#7c8ff5` | `--color-indigo` |
| Green (success states ONLY, never decorative/accent) | `#22c55e` | `--color-green` |
| Red (error states only) | `#f87171` | `--color-red` |

### Light Theme
| Token | Value |
|-------|-------|
| Base background | `#f4f6fb` |
| Surface | `#ffffff` |
| Text primary | `#0d1629` |
| Amber | `#c07010` |
| Indigo | `#4c5fd6` |

All exact values already live in `src/index.css` under `:root` and `html[data-theme='light']` — that file is the actual live source of truth for hex values. This document describes intent; index.css has the numbers.

## Typography
Inter (single family, 300–700). Mono: JetBrains Mono → Fira Code → ui-monospace.

## Site structure (already built — do not restructure)
Home (`/`) → Docs (`/docs`) → Pricing (`/pricing`) → Sign in (`/signin`) → Dashboard (`/dashboard`, auth-gated)

CTA pattern: "Start for free" / "Get started — it's free" — this is a free developer tool, never "Contact Sales."

## Component Specs
Use `.surface-card`, `.btn-primary`, `.btn-ghost`, `.section-alt` classes already defined in `src/index.css`. Do not create parallel/duplicate class names for the same purpose.

## Motion
Subtle only: 150-300ms transitions on hover/focus. No spring physics, no haptic references, no ambient floating blob animations. Respect `prefers-reduced-motion` everywhere (already implemented in index.css).

## Pre-Delivery Checklist
- [ ] Zero green used as decoration/accent (green = success states only)
- [ ] Zero glassmorphism/haptic/mobile-app patterns
- [ ] Zero "Contact Sales" or enterprise B2B patterns
- [ ] All colors pulled from the exact tokens above — no invented hex values
- [ ] Contrast ≥4.5:1 primary text, ≥3:1 muted text, both themes
- [ ] `prefers-reduced-motion` respected
- [ ] No content hidden behind sticky navbar