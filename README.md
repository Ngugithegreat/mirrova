# Mirrova — professional copy trading platform

Mirrova is a premium copy-trading platform: browse rigorously vetted traders with fully transparent
track records, copy their strategies proportionally in one click, and stay protected with
institutional-grade risk controls (copy stop-loss, negative balance protection, segregated funds).

## Stack

- **Next.js 16** (App Router, static generation — 57 prerendered pages)
- **React 19** · **TypeScript** · **Tailwind CSS v4** (CSS-first theme)
- Hand-rolled SVG charts (equity curves with hover tooltips, sparklines, monthly-return heatmaps,
  allocation bars) — no chart library
- Deterministic seeded data layer (`src/lib/traders.ts`): 12 curated + 24 generated trader profiles;
  every platform stat is **derived** from the roster so no number on the site can contradict another
- Practice-mode account (`src/lib/demoStore.ts`): client-side signup, copying, portfolio and
  activity feed persisted in `localStorage` — no backend required

## Pages

`/` landing · `/traders` leaderboard (search/filter/sort) · `/traders/[slug]` 36 trader profiles ·
`/dashboard` portfolio · `/how-it-works` · `/pricing` · `/learn` academy (6 in-depth guides) ·
`/about` · `/legal/{terms,privacy,risk-disclosure}` · `/signup` · `/login`

## Develop

```bash
npm install
npm run dev
```

## Deploy

Pushes to `main` deploy via Vercel. Optional env: `NEXT_PUBLIC_SITE_URL` to override the canonical
URL used in metadata.

---

Risk warning: copy trading involves significant risk of loss. This repository is a platform
preview; account features operate in practice mode.
