# Design System Master File — Keyroute

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Keyroute
**Generated:** 2026-08-12 (ui-ux-pro-max skill — variance 4 · motion 3 · density 5)
**Category:** API Gateway / Developer Infrastructure Tool
**Design Dials:** Variance 4/10 (Balanced / Modern) | Motion 3/10 (Subtle) | Density 5/10 (Standard)

---

## Design Philosophy

Keyroute is not a marketing product — it is infrastructure. The design signals:
- **Trustworthiness** through clean hierarchy, not decoration
- **Technical precision** through monospace accents, structured layout, and deliberate spacing
- **Distinctiveness** through an amber+indigo duality that references routing (signals on wires) rather than AI clichés

**Anti-identities (explicitly avoided):**
- Generic SaaS blue-gradient
- AI purple/pink gradient gimmicks
- Cream + terracotta warmth
- Plain dark + neon cyberpunk

---

## Color Tokens

### Dark Theme (Primary)

| Token | Value | CSS Variable | Usage |
|-------|-------|--------------|-------|
| Base background | `#0a0f1a` | `--color-base` | Page background |
| Alt background | `#0d1420` | `--color-base-alt` | Section alternation |
| Surface | `#111827` | `--color-surface` | Cards, panels |
| Surface-2 | `#1a2235` | `--color-surface-2` | Nested surfaces, code bg |
| Border | `#1e2d45` | `--color-border` | Card borders |
| Border-muted | `#162035` | `--color-border-muted` | Dividers |
| Text primary | `#f0f4ff` | `--color-text-primary` | Headings, labels |
| Text muted | `#7a8ba8` | `--color-text-muted` | Body, secondary |
| Text faint | `#3d5170` | `--color-text-faint` | Placeholders, captions |
| Amber (accent 1) | `#e8a020` | `--color-amber` | Primary CTA, routing labels |
| Amber dim | `#b37818` | `--color-amber-dim` | Hover state |
| Amber glow | `rgba(232,160,32,0.22)` | `--color-amber-glow` | Glow effects |
| Amber btn text | `#0a0f1a` | `--color-amber-btn-text` | Text on amber buttons |
| Indigo (accent 2) | `#7c8ff5` | `--color-indigo` | Routing paths, links, info |
| Indigo dim | `#5c6fd4` | `--color-indigo-dim` | Hover |
| Indigo glow | `rgba(124,143,245,0.18)` | `--color-indigo-glow` | Glow |
| Green | `#22c55e` | `--color-green` | Success |
| Red | `#f87171` | `--color-red` | Error |

### Light Theme (Override via `html[data-theme='light']`)

| Token | Value | CSS Variable |
|-------|-------|--------------|
| Base background | `#f4f6fb` | `--color-base` |
| Alt background | `#eaeff8` | `--color-base-alt` |
| Surface | `#ffffff` | `--color-surface` |
| Surface-2 | `#f8faff` | `--color-surface-2` |
| Border | `#d0d9ee` | `--color-border` |
| Border-muted | `#e2e8f7` | `--color-border-muted` |
| Text primary | `#0d1629` | `--color-text-primary` |
| Text muted | `#4a5d7a` | `--color-text-muted` |
| Text faint | `#8ea0bc` | `--color-text-faint` |
| Amber | `#c07010` | `--color-amber` |
| Amber dim | `#9a5a08` | `--color-amber-dim` |
| Amber btn text | `#ffffff` | `--color-amber-btn-text` |
| Indigo | `#4c5fd6` | `--color-indigo` |
| Green | `#16a34a` | `--color-green` |
| Red | `#dc2626` | `--color-red` |

---

## Typography

**Font:** Inter (weights 300/400/500/600/700) — single cohesive family
**Mono:** JetBrains Mono > Fira Code > ui-monospace

| Role | Size | Weight | Letter spacing |
|------|------|--------|---------------|
| Display hero | clamp(36px, 5.5vw, 64px) | 700 | -0.025em |
| H1 | clamp(28px, 4vw, 48px) | 700 | -0.025em |
| H2 | clamp(22px, 3.5vw, 36px) | 700 | -0.02em |
| H3 | clamp(18px, 2.5vw, 24px) | 600 | -0.015em |
| Body large | 18px / 1.7 | 400 | 0 |
| Body | 16px / 1.6 | 400 | 0 |
| Body small | 14px / 1.55 | 400 | 0 |
| Caption | 12px | 500 | 0 |
| Mono label | 12–13px | 500 | 0 |
| Eyebrow | 11px | 600 | 0.1em |

---

## Spacing Scale (Density 5/10)

| Token | Value |
|-------|-------|
| `--space-xs` | `4px` |
| `--space-sm` | `8px` |
| `--space-md` | `16px` |
| `--space-lg` | `24px` |
| `--space-xl` | `32px` |
| `--space-2xl` | `48px` |
| `--space-3xl` | `64px` |

---

## Radii

| Token | Value |
|-------|-------|
| `--radius-sm` | `6px` |
| `--radius-md` | `10px` |
| `--radius-lg` | `14px` |
| `--radius-xl` | `20px` |

---

## Shadows

| Token | Dark Value |
|-------|------------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)` |
| `--shadow-card` | `0 4px 12px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)` |
| `--shadow-card-hover` | `0 8px 24px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)` |
| `--shadow-lg` | `0 16px 40px rgba(0,0,0,0.6)` |

Light theme reduces all `rgba(0,0,0,X)` values by ~75% and removes white inner rings.

---

## Hero Background

**Approach:** Deliberate SVG Routing Topology Map (replaces broken canvas network)
- Fixed grid of provider nodes (OpenAI, Groq, Gemini, Custom) around a central hub
- Clean bezier paths connecting providers to hub
- CSS `stroke-dashoffset` animated packets on paths (subtle, reduced-motion safe)
- `aria-hidden` on all decorative SVG elements
- Colors use `--color-border` for paths, `--color-amber` for hub, `--color-indigo` for packets

---

## Component Specs

### Primary Button
- `background: var(--color-amber)`, `color: var(--color-amber-btn-text)`
- `padding: 12px 24px`, `border-radius: var(--radius-md)`
- `font: 600 15px Inter`, `transition: 150ms ease`
- Hover: `background: var(--color-amber-dim)`, `translateY(-1px)`, amber glow shadow
- Focus: `outline: 2px solid var(--color-amber)`, `outline-offset: 3px`

### Ghost Button
- `background: transparent`, `border: 1px solid var(--color-border)`
- `color: var(--color-text-primary)`, `padding: 11px 23px`
- Hover: `border-color: var(--color-text-muted)`, `background: rgba(124,143,245,0.05)`
- Focus: `outline: 2px solid var(--color-indigo)`, `outline-offset: 3px`

### Surface Card
- `background: var(--color-surface)`, `border: 1px solid var(--color-border)`
- `border-radius: var(--radius-lg)`, `box-shadow: var(--shadow-card)`
- Hover: `box-shadow: var(--shadow-card-hover)`

### Form Input
- `background: var(--color-surface-2)`, `border: 1px solid var(--color-border)`
- `padding: 11px 14px`, `border-radius: var(--radius-md)`, `font-size: 14px`
- Focus: `border-color: var(--color-amber)`, amber glow ring

---

## Icons

- All structural icons: SVG only. No emoji in UI positions.
- Size: 16×16 nav, 20×20 features, 16×16 dashboard sidebar
- Stroke-width: 1.5 (consistent across all icons)
- Color: `currentColor` (theme-adaptive)

---

## Motion

All animations wrapped in `@media (prefers-reduced-motion: no-preference)`.

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Color/border transitions | 150ms | ease |
| Card hover | 200ms | ease-out |
| Page fade | 200ms | ease |
| Hero packets | 2.5–4s | linear (looping) |

---

## Breakpoints

| Name | Width | Container |
|------|-------|-----------|
| Mobile | ≥375px | 16px padding |
| Tablet | ≥768px | 24px padding |
| Desktop | ≥1440px | max-width 1200px |

---

## Pre-Delivery Checklist

- [ ] No emoji as structural icons (SVG only)
- [ ] `cursor: pointer` on all clickable elements
- [ ] Hover states: 150–200ms transitions
- [ ] Dark text contrast ≥ 4.5:1 primary, ≥ 3:1 muted
- [ ] Light text contrast ≥ 4.5:1 primary, ≥ 3:1 muted
- [ ] `:focus-visible` outlines on all interactive elements
- [ ] `prefers-reduced-motion` respected everywhere
- [ ] Verified at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] No content hidden behind 64px sticky navbar
- [ ] `aria-hidden` on all decorative graphics
- [ ] Form fields have associated `<label>` elements
