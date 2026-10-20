# Architecture

Snarko is a Next.js (App Router) application written in TypeScript, using
Tailwind CSS for styling and server components by default. This document
describes the current structure and the boundaries that later phases will
build within.

## Directory layout

```
src/
├── app/            # Routes, layouts, metadata files (App Router conventions)
├── components/
│   ├── ui/         # Small presentational primitives (e.g. Badge)
│   └── shared/     # Cross-cutting behavior wrappers (e.g. AnimatedReveal)
├── config/         # Site identity and other app-wide configuration
├── constants/      # Static values shared across modules (e.g. route lists)
├── lib/            # Framework-agnostic helper functions
└── types/          # Shared TypeScript types
```

`tests/unit` and `tests/e2e` mirror this at the top level rather than living
inside `src/`, so test tooling config can target them independently of the
app's build.

Directories are only created when something real lives in them. `src/hooks`,
`src/data`, and `public/icons` / `public/images` / `public/fonts` are not
present yet — there is no reusable hook, structured content, or brand asset
that needs them in Phase 0. Create them when the first real file for that
purpose exists, not in advance.

## Component boundaries

- **`components/ui`** holds small, presentational, mostly-styling components
  with no business logic (e.g. `Badge`).
- **`components/shared`** holds components that wrap behavior used across
  multiple pages (e.g. `AnimatedReveal`, which encapsulates the
  reduced-motion-aware enter animation described in
  [ANIMATIONS.md](./ANIMATIONS.md)).

Server components are the default. A component only becomes a Client
Component (`"use client"`) when it needs interactivity, a browser API, or
client-side animation — `AnimatedReveal` is the only Client Component in the
app today, because Motion needs to run in the browser.

## Rendering and caching

`next.config.ts` has `cacheComponents` and `partialPrefetching` enabled
(Next.js 16 defaults for new apps). This means any dynamic, uncached data
access must happen inside a `<Suspense>` boundary or the build will fail.
Phase 0 has no dynamic data fetching, so this hasn't been exercised yet —
keep it in mind when Phase 1 introduces data-driven routes.

## Future platform boundaries

SNARKO is planned to grow into a catalog of many browser games, some of them
large (potentially 3D/WebGL). Three areas are kept architecturally distinct
so that growth doesn't bloat the core app:

1. **Platform application** — this Next.js app: routing, search, catalog,
   categories, and other player-facing pages. Lives in `src/app` and
   `src/components`.
2. **Game runtime** — a future isolated integration boundary for approved
   games (iframe sandboxing, a typed game registry, lifecycle states). Not
   built yet; see [GAME_DELIVERY.md](./GAME_DELIVERY.md).
3. **Asset delivery** — game binaries, textures, audio, and other large
   assets, served separately from the website's own bundle so the homepage
   never has to download every game. See [GAME_DELIVERY.md](./GAME_DELIVERY.md).

None of these are implemented in Phase 0. This document will be updated as
each boundary gets real code.

## Styling

Tailwind CSS v4's CSS-first configuration is used — there is no
`tailwind.config.js`. Design tokens are defined as CSS custom properties in
`src/app/globals.css` and exposed to Tailwind via `@theme inline`. See
`globals.css` for the full token list (surfaces, text, brand, radius, motion
durations, focus ring).

## Known, accepted tooling gap

`npm audit` reports a high-severity advisory in `braces` (via
`eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` →
`micromatch`). No fixed version of `braces` exists yet at time of writing, and
the only automated remediation (`npm audit fix --force`) would downgrade
`eslint-config-next` to a version that doesn't support Next.js 16. This is a
dev-only lint dependency, not shipped in the production bundle, and isn't
exposed to untrusted input in this project. Revisit when a patched `braces` is
released.
