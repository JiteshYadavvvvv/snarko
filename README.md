# Snarko

A premium browser gaming platform. **Phase 0 (foundation)** and **Phase 1
(design system + homepage)** are implemented: project tooling, design tokens,
SEO plumbing, testing/CI, a header/footer shell, and a homepage with a local,
sample-data-driven game grid (search + category filtering). There is no real
game catalogue, per-game pages, or any gameplay yet — see
[`docs/PHASES.md`](./docs/PHASES.md) for what's deferred and why.

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
cp .env.example .env         # optional locally; see docs/SEO.md
npm run dev
```

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

See [`.env.example`](./.env.example). `NEXT_PUBLIC_SITE_URL` controls the
canonical origin used in metadata, `robots.txt`, and `sitemap.xml` — required
before a real production deploy, optional in local development (falls back
to `http://localhost:3000`). Details in
[`docs/SEO.md`](./docs/SEO.md#canonical-production-origin).

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

Not configured in Phase 0. No deploy has been performed and no external
resources have been created. See
[`docs/SEO.md`](./docs/SEO.md#what-must-wait) for what has to be set before a
real deploy (primarily `NEXT_PUBLIC_SITE_URL`).
