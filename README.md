# Snarko

A premium browser gaming platform. **Phases 0–2** are implemented: project
tooling, design tokens, SEO plumbing, testing/CI, a header/footer shell, a
homepage, and dedicated, indexable routes for every sample game
(`/games/[slug]`) and category (`/games/category/[category]`), with search,
category navigation, and related-game recommendations all wired to the same
typed catalogue. There is no real game catalogue, no actual gameplay, and
nothing is marked playable yet — see [`docs/PHASES.md`](./docs/PHASES.md)
for what's deferred and why.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router, Turbopack)
- React 19 + TypeScript (strict)
- Tailwind CSS v4
- [Motion](https://motion.dev) for React (`motion/react`)
- [Lucide](https://lucide.dev) icons
- Vitest + React Testing Library (unit/component tests)
- Playwright (e2e smoke test)
- ESLint (flat config) + Prettier

## Requirements

- Node.js version pinned in [`.nvmrc`](./.nvmrc) (22, current LTS). Next.js
  16 requires Node 20.9+.
- npm (this project commits `package-lock.json`).

## Getting started

```bash
nvm use                      # or install the Node version in .nvmrc manually
npm install
npm run dev
```

A working `.env` is already present for local development; it's gitignored,
not committed. See [Environment](#environment) below.

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev          # Dev server
npm run build         # Production build
npm run start         # Run the production build
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm run test            # Vitest (unit/component)
npm run test:watch      # Vitest, watch mode
npm run test:e2e        # Playwright smoke test
npm run format           # Prettier, write
npm run format:check    # Prettier, check only
```

## Environment

`NEXT_PUBLIC_SITE_URL` controls the canonical origin used in metadata,
`robots.txt`, and `sitemap.xml` — required before a real production deploy,
optional in local development (falls back to `http://localhost:3000` if
unset). Details in
[`docs/SEO.md`](./docs/SEO.md#canonical-production-origin). `.env` holds the
local value and is gitignored; there is no `.env.example` template file —
this README and `docs/SEO.md` document the one variable that exists.

## Documentation

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — structure and
  architectural boundaries
- [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) — local workflow, scripts,
  conventions, REA/MCP status
- [`docs/SEO.md`](./docs/SEO.md) — metadata, canonical URLs, sitemap, robots
- [`docs/ANIMATIONS.md`](./docs/ANIMATIONS.md) — Motion and CSS animation
  rules, reduced-motion handling
- [`docs/GAME_DELIVERY.md`](./docs/GAME_DELIVERY.md) — future game
  integration and asset-delivery constraints
- [`docs/PHASES.md`](./docs/PHASES.md) — roadmap and what's deferred

## Deployment

No deploy has been performed and no external resources have been created.
`vercel.json` pins the framework to `nextjs` so a Vercel project with a
misconfigured Framework Preset still builds and serves this app correctly;
it sets nothing else (no output directory override). See
[`docs/SEO.md`](./docs/SEO.md#what-must-wait) for what has to be set before a
real deploy (primarily `NEXT_PUBLIC_SITE_URL`).
