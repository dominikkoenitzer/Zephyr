# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Zephyr (package name `zephyr`) is a **local-first, no-login productivity app**: tasks, notes, and a Pomodoro focus timer. There is **no backend** — every piece of user data lives in the browser's `localStorage`. Deployed on Vercel at **https://zephyr.punds.ch** (use this domain for all canonical/OG/sitemap URLs).

> The Journal and Calendar features were both removed in favor of a simpler app. `localStorageService` still contains journal helper methods and legacy storage keys (`zephyr_journal_entries`, `zephyr_calendar_events` — kept so `clearAllData` wipes old data), but nothing in the UI uses them. `/journal` redirects to `/notes` and `/calendar` redirects to `/tasks`. Keep new features minimal and do not re-add that complexity unless asked.

Stack: React 18 + Vite 6 (`@vitejs/plugin-react-swc`), React Router v6, Tailwind CSS 3, Radix UI primitives (shadcn-style), motion (animations), recharts, lucide-react, sonner (toasts), `@vercel/analytics`.

Animations use **motion** (`motion/react`) behind `LazyMotion` with `strict` mode in `AppLayout` — always animate with the `m.` components (`m.div`), never `motion.div` (strict mode throws). `MotionConfig reducedMotion="user"` is set globally, so respect it and don't hand-roll reduced-motion checks.

## Commands

Package manager is **Bun only** (do not introduce npm/yarn/pnpm lockfiles). The Bun version is pinned in `.bun-version`.

```bash
bun install
bun run dev        # Vite dev server on http://localhost:1000 (port + host preset in vite.config.js)
bun run lint       # eslint with --max-warnings 0 — warnings fail the build, so keep it clean
bun run build      # vite build → dist/
bun run preview    # serve the production build
bun run test       # Vitest run (unit tests in src/**/*.test.{js,jsx})
```

Always run `bun run lint` and `bun run build` before finishing — both are required to catch errors. Tests run on **Vitest + jsdom** (`vitest.config.js`); current coverage is the pure logic (`quickParse`, `localStorageService`, `searchService`). Prefer testing pure functions/services there; full UI flows are best checked by running the app.

## Architecture

### Data layer is the center of gravity

There is no Redux/Zustand/Context store. Application state lives in **singleton service classes** under `src/services/`, each persisting to `localStorage` (all keys prefixed `zephyr_`):

- **`localStorage.js`** (`localStorageService`) — the canonical data store: tasks, task folders, notes, focus sessions, focus streak, settings, wellness, onboarding (plus legacy journal helpers). Provides the add/update/delete helpers (`addTask`, `updateNote`, etc.) that assign IDs and timestamps. Treat this as the schema; read it before changing any data shape.
- **`searchService.js`** — unified search across notes/tasks, reading from `localStorageService`. Wired into the header search (Cmd/Ctrl+K).
- **`notificationService.js`** — its own `localStorage` keys; polls every 60s for task due dates and plays a Web Audio chime. Started/stopped by the app shell.
- **`themeService.js`** — light/dark via a class on `<html>`. Simplified (legacy "garden" themes are actively stripped out on init).

Every write goes through the service, which broadcasts a `zephyr:change` `CustomEvent` (see `emitChange` in `localStorage.js`). The reactive hooks in **`src/hooks/useStore.js`** (`useTasks`, `useNotes`, `useFolders`, `useSettings`) subscribe to that event plus the native `storage` (other tabs) and `focus` events, so views update live without a global store. **Prefer these hooks for new read-and-display code** instead of hand-wiring `focus`/`storage` listeners. The native `storage` event only fires in *other* tabs, which is why the in-app `zephyr:change` event exists for same-tab updates — any new service that writes outside `localStorageService` (e.g. `notificationService`) should call `emitChange` too.

### App shell and routing

- `src/main.jsx` is the entry point. It **applies the theme before React renders** (to avoid a flash) and calls `themeService.initialize()`, then mounts `RouterProvider` + Vercel `<Analytics>`.
- **Routes are defined in `src/routes/routes.jsx`**, not in `main.jsx`. Every page is `lazy()`-imported and wrapped with `withPageLoader` (Suspense + `PageLoader`). Keep new routes lazy. `/journal` still redirects to `/notes` and `/calendar` to `/tasks` for old links; unmatched `*` redirects to `/`.
- `src/app/AppLayout.jsx` is the shell rendered as the layout route (`src/App.jsx` just re-exports it). It renders `Sidebar` (desktop + mobile), `Header`, the `<Outlet>`, and the sonner `Toaster`. On mount it runs `themeService.initialize()` and `notificationService.startChecking()`, with `stopChecking()` on cleanup — **preserve this init/teardown** when editing the shell.
- `src/hooks/useSEO.js` updates `document.title` and meta/OpenGraph/Twitter/canonical tags per route from a pathname→metadata map. Add an entry there when adding a route.

Structure: `src/pages/` are route-level screens; `src/components/<Feature>/` hold feature components (TaskManager, Notes, Planner, FocusTimer, Notifications, Search, Layout); `src/components/ui/` are the reusable primitives.

### Styling and UI conventions

- **Tailwind-first.** Reuse the primitives in `src/components/ui/` before writing new UI; use `cn()` from `src/lib/utils.js` (clsx + tailwind-merge) to compose classes. shadcn config is in `components.json` (base color slate, CSS variables).
- Use the **semantic theme tokens** (`bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, etc.) — they map to CSS variables defined in `src/index.css` and drive dark mode. Don't hardcode raw colors.
- `PageHeader` (`src/components/Layout/PageHeader.jsx`) gives pages a consistent title/description/actions header.
- The `@` import alias resolves to `src/`.

### Build configuration (handle with care)

`vite.config.js` contains **hand-tuned, fragile logic** — do not casually refactor it:

- A custom `manualChunks` splits vendors into `react-vendor`, `router-vendor`, `radix-vendor`, `motion-vendor`, `charts-vendor`, `icons-vendor`, `utils-vendor`, and a catch-all `vendor`. The intent is that **everything React-dependent lands in `react-vendor` so it loads first**. The `motion-vendor` check must stay *before* the react checks — motion ships `dist/react.mjs` paths that would otherwise be split across chunks.
- The custom `fixChunkLoading` plugin rewrites the `react-vendor` `modulepreload` link into a real `<script>` tag in `index.html` to guarantee React executes before other chunks. Keep this plugin and the chunking logic intact; breaking load order causes runtime "React is undefined" failures.

## Conventions

- Functional components and hooks only. ESLint flat config (`eslint.config.js`) has `react/prop-types` off and treats `react-refresh/only-export-components` as a warning — and `--max-warnings 0` means warnings still fail `bun run lint`.
- Keep browser-only APIs (Web Audio, `localStorage`, `matchMedia`, `document`) behind effects or guards — though note services are intentionally instantiated at import time.
- Don't edit generated output in `dist/`; source is under `src/`.
- Keep env files, logs, caches, and editor cruft out of version control (follow `.gitignore`).
