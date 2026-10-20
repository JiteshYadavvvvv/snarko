# Phased roadmap

## Phase 0 — Foundation (this phase)

Development foundation only: tooling, project structure, design tokens, SEO
plumbing, testing, CI, documentation. See the other docs in this folder for
what's actually implemented.

Explicitly **not** built in Phase 0:

- The real homepage, logo, navigation, or any finished brand design.
- Any game catalog, category pages, search, or player-facing features.
- Any actual game integration, game registry, or CDN/asset pipeline (see
  [GAME_DELIVERY.md](./GAME_DELIVERY.md)).
- A database, game engine, physics engine, multiplayer framework, or 3D
  rendering engine.
- GSAP, Lenis, Three.js, React Three Fiber, or particle libraries (deferred
  until a specific feature justifies them — see
  [ANIMATIONS.md](./ANIMATIONS.md)).
- Any deployment, external resource creation, or DNS/domain configuration.
- REA/MCP setup (investigated, deliberately not applied — see
  [DEVELOPMENT.md](./DEVELOPMENT.md)).

## Later phases (not yet planned in detail)

The rough shape of what comes after Phase 0, in no particular committed
order:

- **Visual identity** — real logo, icon set, and finished homepage design on
  top of the design tokens established here.
- **Navigation and layout shell** — header, footer, and the page layout the
  rest of the app builds on.
- **Catalog and search** — category pages, search, and the data model behind
  them (this is also when `src/data` and a real `src/hooks` likely appear).
- **Game runtime** — the player/integration boundary and typed game registry
  described in [GAME_DELIVERY.md](./GAME_DELIVERY.md).
- **First real game integration** — exercising the game runtime end to end
  with one approved game before scaling to a full catalog.

This list will be revised as real decisions get made; treat it as a
directional sketch, not a commitment.
