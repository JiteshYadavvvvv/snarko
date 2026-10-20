# Development

## Requirements

- Node.js version pinned in [`.nvmrc`](../.nvmrc) (22, the active LTS line).
  Next.js 16 requires Node 20.9+; this project targets 22 to match the
  environment it was built against.
- npm (ships with Node). This project uses npm and commits `package-lock.json`
  — don't switch package managers without updating both.

## Setup

```bash
nvm use        # or manually install the Node version in .nvmrc
npm install
cp .env.example .env.local   # optional in development; see docs/SEO.md
npm run dev
```

## Scripts

| Script                 | Purpose                                              |
| ---------------------- | ---------------------------------------------------- |
| `npm run dev`          | Start the dev server (Turbopack, default in Next 16) |
| `npm run build`        | Production build                                     |
| `npm run start`        | Run the production build                             |
| `npm run lint`         | ESLint (flat config, via the ESLint CLI directly)    |
| `npm run typecheck`    | `tsc --noEmit`                                       |
| `npm run test`         | Vitest unit/component tests, single run              |
| `npm run test:watch`   | Vitest in watch mode                                 |
| `npm run test:e2e`     | Playwright smoke test (builds, starts, tests, stops) |
| `npm run format`       | Prettier, writes changes                             |
| `npm run format:check` | Prettier, check only (used in CI)                    |

`next lint` was removed in Next.js 16; `lint` runs the ESLint CLI directly
against `eslint.config.mjs`.

## Conventions

- **Server components by default.** Add `"use client"` only when a component
  needs interactivity, a browser API, or client-side animation.
- **Type-safe route props.** Use the generated `PageProps<'/route'>` /
  `LayoutProps<'/route'>` helpers (see `src/app/layout.tsx`) instead of
  hand-writing `params`/`searchParams` types. Run `npx next typegen` if the
  generated types look stale.
- **Path alias.** Import app code via `@/*` (maps to `src/*`), not relative
  `../../..` chains.
- **No empty directories.** Don't scaffold a folder (`src/hooks`, `src/data`,
  etc.) until something real needs to live in it — see
  [ARCHITECTURE.md](./ARCHITECTURE.md).

## Testing

- **Unit/component tests** (`tests/unit`): Vitest + React Testing Library,
  jsdom environment. Config in `vitest.config.ts`; jest-dom matchers are
  registered in `tests/unit/setup.ts`.
- **E2E smoke test** (`tests/e2e`): Playwright, Chromium only. The config
  (`playwright.config.ts`) builds and starts the app on port 3100 and tears
  it down after the run — no external services or credentials required.
  Run `npx playwright install chromium` once before the first run (CI does
  this automatically).

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every pull
request: install, lint, typecheck, format check, unit tests, build, then the
Playwright smoke test against the production build.

## REA / MCP (optional developer tool)

[REA](https://github.com/morluto/rea) is a third-party reverse-engineering
agent/MCP tool. It is unrelated to SNARKO's runtime — it is not a dependency
of this project and nothing in `package.json` references it.

**Setup was intentionally not run as part of Phase 0.** `npx rea-agents setup`
is interactive, and it writes to the _global_ Claude Code configuration
(`~/.claude.json` and `~/.claude/skills`) rather than anything scoped to this
repository — a registration there would apply to every project opened with
that agent, not just SNARKO. Its setup flow can also optionally install
Hopper, a commercial disassembler, which is an unrelated heavyweight native
tool this project doesn't need. REA itself is explicitly a reverse-engineering
tool (decompilation, binary analysis); it should only be connected for a
concrete, authorized analysis task (e.g. auditing a specific third-party game
bundle before integrating it), not wired in speculatively.

If a future task needs REA: run `npx rea-agents setup` yourself (or ask your
agent to, with that specific authorized task named), review the exact plan it
prints before approving, and keep its registration scoped to what that task
requires.
