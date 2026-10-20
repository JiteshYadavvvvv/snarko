# Game delivery (future work)

None of this is built yet. Phase 0 has no game registry, player, or CDN
pipeline — this document records the constraints future phases need to
design against, so early architectural decisions (bundle splitting, route
structure) don't paint the project into a corner.

## The core rule

**Never load every game's binary on the homepage, or anywhere outside the
game's own page.** The catalog, search, and homepage must stay cheap to load
regardless of how many games the platform hosts or how large any individual
game is. A game's assets load only when a player actually opens that game.

## Bundle separation

- The main Next.js app bundle must not import game code or game assets
  directly. Keep the "game runtime" (the player/integration surface) as an
  isolated boundary — a typed game registry describing each game (metadata,
  entry point, required capabilities), not the games themselves.
- Large game bundles (binaries, textures, audio, especially for heavier
  3D/WebGL titles) belong on asset delivery infrastructure suited to large
  static files and CDN distribution — not necessarily the same place the
  Next.js app is hosted. Don't assume Vercel (or any single platform) is the
  right place for every large asset; evaluate per asset size/type when that
  decision is actually in front of you.

## Player integration

- Plan for **iframe sandboxing** of third-party/approved game content, with
  deliberate `sandbox`/`allow` attribute choices per game rather than a
  permissive default.
- Plan for explicit **loading, timeout, failure, and retry** states for each
  game load — a game fetched from external asset infrastructure can fail or
  hang in ways a same-origin page load doesn't.
- Plan for **fullscreen**, keyboard focus handling (focus must move into the
  game frame and back out cleanly), mobile touch controls, and
  game-specific input mapping. These vary per game and shouldn't be
  hard-coded into the platform shell.
- Avoid **unlimited client-side caching** of game assets — define eviction/
  size limits before caching anything, not after.

## Why this is separated now

Section boundaries in [ARCHITECTURE.md](./ARCHITECTURE.md) (platform
application / game runtime / asset delivery) exist specifically so that when
real games are integrated, they extend an isolated boundary instead of
getting woven into `src/app` and `src/components` directly. Phase 0
intentionally does not build the registry, player, or any actual game
integration — this document is the brief for when that work starts.
