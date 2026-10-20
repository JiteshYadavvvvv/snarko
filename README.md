# Snarko

A premium browser gaming platform. Pick a game, hit play, done — no
downloads, no accounts.

Two games are genuinely playable today:

- **[Neon Breaker](src/components/games/neon-breaker/)** — a paddle-and-block
  arcade game with real collision physics, scoring, lives, five levels, and
  keyboard/mouse/touch input.
- **[Ridge Runner](src/components/games/ridge-runner/)** — a physics-based
  hill-driving game. Manage gas and brake to keep momentum through rolling
  countryside terrain, collect fuel and coins, and spend what you earn in the
  garage on a better engine, suspension, and tires. One crash or an empty
  tank ends the run; your best distance and coins carry over to the next one.

Every other catalogue entry is a `coming-soon` sample — the UI is always
honest about this (a disabled "Not playable yet" action, never a fake
"Play" button).

## Stack

- [Next.js](https://nextjs.org) 16 (App Router, Turbopack)
- React 19 + TypeScript (strict)
- Tailwind CSS v4
- [Motion](https://motion.dev) for React (`motion/react`)
- [Lucide](https://lucide.dev) icons
- Vitest + React Testing Library (unit/component tests)
- Playwright (e2e tests)
- ESLint (flat config) + Prettier

No game engine library is used. Both playable games are built the same way:
a plain, framework-free TypeScript module owns the simulation (state,
physics, collisions, scoring) and is directly unit-testable without a
browser; a thin React/Canvas component owns rendering, input, and the
`requestAnimationFrame` loop. See
[Playable games](#playable-games-and-the-game-registry) below.

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
npm run build        # Production build
npm run start        # Run the production build
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run test           # Vitest (unit/component)
npm run test:watch     # Vitest, watch mode
npm run test:e2e       # Playwright (builds, starts, tests, tears down)
npm run format          # Prettier, write
npm run format:check   # Prettier, check only
```

## Architecture

```
src/
├── app/            # Routes, layouts, metadata files (App Router conventions)
├── components/
│   ├── ui/         # Small presentational primitives (Badge, Button, IconButton, SearchBar)
│   ├── shared/     # Cross-cutting pieces used by more than one route
│   ├── site/       # Site-wide chrome rendered in the root layout (header, footer, brand mark)
│   ├── home/       # Homepage-specific sections and the game discovery state
│   └── games/      # Game-detail-page sections, the playable-game registry,
│       │           # and each game's own implementation (neon-breaker/, ridge-runner/)
├── config/         # Site identity and other app-wide configuration
├── constants/      # Static values shared across modules (routes, nav items, category metadata)
├── lib/            # Framework-agnostic helper functions and the sample game data
└── types/          # Shared TypeScript types
```

Server components are the default. A component becomes a Client Component
only when it needs interactivity, a browser API, or client-side animation.

### Catalogue and data model

`src/types/game.ts` defines `Game` as a discriminated union on
`availability`:

```ts
type Game =
  | (GameBase & { availability: "coming-soon" })
  | (GameBase & { availability: "playable"; playUrl: string });
```

TypeScript will not compile a game marked `"playable"` without a `playUrl`,
so it's structurally impossible to ship a "Play" button with nowhere real to
send the player.

`src/lib/sample-games.ts` exports `SAMPLE_GAMES` — the catalogue. Categories
are defined once, in `src/constants/game-categories.ts`
(`GAME_CATEGORY_META`: label, description, icon per category); nothing else
defines or duplicates the category list.

Routes: `/` (homepage), `/games/[slug]` (one per catalogue entry),
`/games/category/[category]` (one per category) — all statically generated
with real per-route metadata and sitemap entries.

### Playable games and the game registry

`src/components/games/game-registry.tsx` exports
`PLAYABLE_GAME_COMPONENTS`, a `Record<string, ComponentType>` mapping a slug
to that game's React component. The detail page
(`src/app/games/[slug]/page.tsx`) looks this up only when
`game.availability === "playable"`, and renders it through `GamePlayer`
(`src/components/games/game-player.tsx`), which shows a static preview and a
"Play {title}" button — nothing about a game's Canvas setup, input
listeners, or render loop runs until the visitor actually clicks it.

**Adding a future game:**

1. Add an entry to `SAMPLE_GAMES` matching the `Game` type (route, sitemap
   entry, and metadata are generated automatically from the catalogue).
2. Write its simulation as a pure, framework-free module — explicit state,
   explicit input, a `step(state, input, dt)`-shaped function, no
   `Math.random`/`Date.now` inside the simulation itself — so it is directly
   unit-testable. See `neon-breaker/engine.ts` for a simple example and
   `ridge-runner/engine/` for a larger one split across terrain, vehicle
   physics, economy, progression, and run-state modules.
3. Write its renderer: a client component owning the Canvas, input, resize
   handling, HUD-as-DOM (so it stays screen-reader accessible), and cleanup
   on unmount.
4. Add one entry to `PLAYABLE_GAME_COMPONENTS`.
5. Only then flip that catalogue entry's `availability` to `"playable"` with
   `playUrl` pointing at its own route.

If a future game is meaningfully larger, hosted externally, or needs iframe
sandboxing, that's a signal to build a real game-runtime boundary (asset
delivery separate from the main bundle, sandboxed embedding, loading/timeout
states) rather than stretching this simple registry further. Nothing like
that exists yet — both current games are small enough to ship as part of the
main app bundle, loading only on their own route.

### Ridge Runner's architecture

`src/components/games/ridge-runner/engine/` holds the entire simulation as
plain TypeScript, with no React or DOM imports:

- `terrain.ts` — procedural terrain generation from a seed (deterministic,
  unit-tested), ground-height lookup, and collectible placement.
- `vehicle.ts` — the vehicle physics: gravity, a two-wheel spring/damper
  suspension model, chassis rotation from off-center suspension and drive
  forces, traction capped by available grip, and chassis/ground crash
  detection.
- `economy.ts` — upgrade costs and how upgrade levels scale a vehicle's
  config (engine power, suspension, grip).
- `progression.ts` — `localStorage`-backed save data (coins, best distance,
  upgrade levels), with pure functions for applying a run's result or an
  upgrade purchase, separate from the storage I/O itself.
- `run.ts` — composes the above into the run-level state machine (garage →
  playing → paused/crashed/out-of-fuel), including collectible pickup and
  fuel/game-over rules.

`ridge-runner-game.tsx` is the Canvas renderer, input handling (keyboard and
on-screen touch buttons), camera follow, and HUD. `garage.tsx` is the
pre-run upgrade screen.

One vehicle and one environment ("countryside hills") are implemented today,
built with a registry/config shape (`VehicleConfig`, upgrade categories,
terrain config) designed so a second vehicle or environment is a new config
entry, not a rewrite — but only the one of each that actually exists is
presented in the UI. No locked/greyed-out placeholder vehicles or
environments are shown.

## Testing

- **Unit/component** (`tests/unit`): Vitest + React Testing Library, jsdom
  environment. Both games' entire simulation logic is tested as plain data
  transformations — initial state, physics responses, collisions, scoring,
  game-over conditions — with no animation frames or timing-sensitive waits.
- **E2E** (`tests/e2e`): Playwright, Chromium only, against a real production
  build (`playwright.config.ts` builds and starts the app, then tears it
  down after the run). Covers homepage/search/category discovery, both
  games' full play journeys (Neon Breaker: reveal → start → launch → score →
  pause → resume → restart; Ridge Runner: garage → drive → pause → resume →
  back to garage), and 404s for unknown routes.

Run `npx playwright install chromium` once before the first `test:e2e` run.

## Environment

`NEXT_PUBLIC_SITE_URL` controls the canonical origin used in metadata,
`robots.txt`, and `sitemap.xml` — required before a real production deploy,
optional in local development (falls back to `http://localhost:3000` if
unset). `.env` holds the local value and is gitignored; there is no
`.env.example` file.

## Deployment

No deploy has been performed and no external resources have been created.
`vercel.json` pins the framework to `nextjs` so a Vercel project with a
misconfigured Framework Preset still builds and serves this app correctly.
`NEXT_PUBLIC_SITE_URL` must be set before a real production deploy.
