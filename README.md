<div align="center">

<img src="public/android-icon-192x192.png" alt="Zephyr logo" width="96" height="96" />

# Zephyr

### Flow Through Focus

A free, **local-first** productivity app: a to-do list and a Pomodoro focus timer.
No login, no signup, no backend. Your data never leaves your browser.

[![CI](https://github.com/dominikkoenitzer/Zephyr/actions/workflows/ci.yml/badge.svg)](https://github.com/dominikkoenitzer/Zephyr/actions/workflows/ci.yml)
[![Live](https://img.shields.io/badge/live-zephyr.punds.ch-0ea5e9?logo=vercel&logoColor=white)](https://zephyr.punds.ch)
[![PWA](https://img.shields.io/badge/PWA-installable-5a0fc8?logo=pwa&logoColor=white)](https://zephyr.punds.ch)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1.3-fbf0df?logo=bun&logoColor=black)

**[→ Try it live at zephyr.punds.ch](https://zephyr.punds.ch)**


<img src="docs/screenshot.png" alt="Zephyr: a to-do list and a Pomodoro focus timer" width="880" />

</div>

---

## Table of contents

- [Why Zephyr](#why-zephyr)
- [Features](#features)
- [Natural-language quick add](#natural-language-quick-add)
- [Command palette & keyboard](#command-palette--keyboard)
- [Focus presets](#focus-presets)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Privacy](#privacy)
- [Deployment & CI/CD](#deployment--cicd)
- [Contributing](#contributing)
- [Author](#author)

## Why Zephyr

Most productivity apps want an account, a subscription, and a copy of your data on their servers. Zephyr wants none of that.

- **Local-first.** Every task and focus session lives in your browser's `localStorage`. Nothing is ever uploaded.
- **No login.** Open the app and start. There is no sign-up flow because there is no server.
- **Works offline.** Zephyr is an installable Progressive Web App. Install it and it keeps working without a connection, and when a new version ships it asks before reloading instead of swapping itself out mid-session.
- **Fast and distraction-free.** Two screens, a keyboard-first interface, and light, dark or system themes.
- **Small on purpose.** Notes, a journal and a calendar all lived here once and were removed. What is left is the part people actually used.

## Features

| Feature | What it does |
|---|---|
| **Tasks** | Due dates, priorities and `#tags`. [Natural-language quick add](#natural-language-quick-add) understands plain English as you type. Filter by due window or tag, and the list groups itself into Overdue / Today / Tomorrow / This week / Later. |
| **Focus Timer** | A Pomodoro timer with four built-in [presets](#focus-presets) plus your own, fully customizable durations, session tracking, and a day streak that tells you when it is about to lapse. |
| **Home** | The week at a glance (active tasks, tasks completed, focus minutes, sessions) plus what's due today. |
| **Command palette** | <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>K</kbd> from anywhere, a phone included, searches your tasks and runs any command: new task, start a session, switch theme, export a backup. |
| **Keyboard-first** | [Single-key shortcuts](#command-palette--keyboard) for everything you do often, and <kbd>?</kbd> prints the map. |
| **Undo** | Deleting a task or clearing completed ones offers an Undo that restores them in place. |
| **Notifications** | Optional in-app reminders for upcoming due dates, plus a chime when a focus session ends. All toggleable. |
| **Light, dark, or system** | Pick a scheme or follow the OS. It changes live when your system does, and every open tab follows. |
| **Backup and restore** | Export everything to one JSON file and import it on any device. Settings shows how much storage Zephyr is using. |

## Natural-language quick add

Type a task the way you'd say it and Zephyr extracts the structure for you, locally, with no AI and no network calls. A live preview shows what it detected before you hit enter.

```
Email Sam tomorrow !high #work
```

→ **Email Sam**, due tomorrow, high priority, tagged `work`.

| Token | Examples | Becomes |
|---|---|---|
| **Date** | `today`, `tonight`, `tomorrow`, `next monday`, `friday`, `in 3 days`, `aug 5`, `12/25`, `2026-08-05` | Due date |
| **Priority** | `!high` · `!med` · `!low` (also `!h`/`!m`/`!l`, `!1`/`!2`/`!3`, `p1`/`p2`/`p3`) | Priority |
| **Tag** | `#work`, `#family` | Tags (lowercased, de-duplicated) |

## Command palette & keyboard

Press <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>K</kbd> (or <kbd>/</kbd>) anywhere to open the palette. It searches your tasks and it runs commands, so a task is two keystrokes away from being opened and a focus session is two from being started.

Single keys work whenever you're not typing in a field:

| Key | Does |
|---|---|
| <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>K</kbd> · <kbd>/</kbd> | Command palette |
| <kbd>N</kbd> | New task |
| <kbd>T</kbd> | Cycle light → dark → system |
| <kbd>G</kbd> then <kbd>H</kbd>/<kbd>T</kbd>/<kbd>F</kbd>/<kbd>S</kbd> | Go to Home / Tasks / Focus / Settings |
| <kbd>?</kbd> | The full list |

On the focus timer: <kbd>Space</kbd> starts and pauses, <kbd>R</kbd> resets, <kbd>S</kbd> skips, <kbd>F</kbd> goes full screen.

## Focus presets

| Preset | Focus | Short break | Long break | Sessions until long break |
|---|---|---|---|---|
| **Pomodoro** | 25 min | 5 min | 15 min | 4 |
| **Short Focus** | 15 min | 3 min | 10 min | 4 |
| **Deep Work** | 45 min | 10 min | 20 min | 3 |
| **Meditation** | 10 min | 2 min | 5 min | 3 |

Every duration is adjustable, and you can save your own custom presets. Completed work sessions are tracked automatically so you can build a consistent daily streak.

## Tech stack

- **[React 19](https://react.dev/)** + **[Vite 8](https://vite.dev/)** (via `@vitejs/plugin-react-swc`)
- **[React Router v7](https://reactrouter.com/)** with lazy-loaded routes
- **[Tailwind CSS 4](https://tailwindcss.com/)** + **[Radix UI](https://www.radix-ui.com/)** primitives (shadcn-style)
- **[Motion](https://motion.dev/)** for animations: page transitions, layout animations, micro-interactions, all respecting reduced-motion
- **[lucide-react](https://lucide.dev/)** icons · **[sonner](https://sonner.emilkowal.ski/)** toasts
- **[Vitest](https://vitest.dev/)** + jsdom for unit tests
- **[Bun](https://bun.sh/)** as the runtime, package manager, and script runner
- **[Vercel](https://vercel.com/)** hosting + `@vercel/analytics`
- **No backend.** State lives in the browser via `localStorage`

## Getting started

**Prerequisites:** [Bun](https://bun.sh/) 1.1.39+ (this repo pins `1.3.14` via `.bun-version`). Bun is the runtime and package manager, so no separate Node.js install is required.

```bash
# Clone
git clone https://github.com/dominikkoenitzer/Zephyr.git
cd Zephyr

# Install dependencies
bun install

# Start the dev server → http://localhost:1000
bun run dev
```

That's it. No `.env`, no database, no API keys.

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start the Vite dev server on [http://localhost:1000](http://localhost:1000) |
| `bun run build` | Production build to `dist/` |
| `bun run preview` | Serve the production build, also on [http://localhost:1000](http://localhost:1000) |
| `bun run lint` | Run ESLint (`--max-warnings 0`, so warnings fail) |
| `bun run test` | Run the Vitest unit suite |

## Project structure

```
src/
├── app/            # AppLayout, the shell around the top bar
├── components/
│   ├── CommandPalette/ # Cmd/Ctrl+K search and commands
│   ├── FocusTimer/ # Pomodoro timer
│   ├── Shortcuts/  # The printed keyboard map
│   ├── TaskManager/# Tasks, filters & quick add
│   ├── Layout/     # TopBar (the whole navigation), PageHeader
│   └── ui/         # Reusable shadcn-style primitives
├── hooks/          # useStore (reactive data hooks), useAppShortcuts, useTheme, useSEO
├── lib/            # quickParse (NL parser), taskFilters, shortcuts, backup, utils
├── pages/          # Route-level screens
├── routes/         # routes.jsx (lazy-loaded route table)
└── services/       # localStorage, search, notification, theme (singletons)
```

## Architecture

Zephyr has no Redux, Zustand, or Context store. Application state lives in **singleton service classes** under `src/services/`, each persisting to `localStorage` (all keys prefixed `zephyr_`):

- **`localStorage.js`** is the canonical data store for tasks, focus sessions, the streak and settings. It owns the schema and the add/update/delete helpers.
- **`searchService.js`** does task search by title, description and `#tag`, wired into the <kbd>Cmd</kbd>/<kbd>Ctrl</kbd> + <kbd>K</kbd> palette.
- **`notificationService.js`** polls for task due dates and plays a Web Audio chime.
- **`themeService.js`** handles light/dark/system via a class on `<html>`, applied before React renders to avoid a flash, and kept in step with the OS media query while the preference is "system".

Every write broadcasts a `zephyr:change` event. Reactive hooks in **`src/hooks/useStore.js`** (`useTasks`, `useNotes` and friends) subscribe to it, along with the native `storage` event for cross-tab sync, so views update live without a global store. Routes are defined in `src/routes/routes.jsx`, lazy-loaded, and wrapped in a Suspense loader.

## Privacy

Zephyr is built around a simple promise: **your data is yours and stays on your device.**

- All content is stored in your browser's `localStorage`. There is no server, no account, and no telemetry of your content.
- Because data is local there is no automatic cloud backup, but you can **export a full backup file** and import it on any device from **Settings → Data Management**. Clearing your browser data (or using **Clear All Local Storage**) removes everything permanently.

## Deployment & CI/CD

Zephyr is a static SPA deployed on **[Vercel](https://vercel.com/)** (live at **[zephyr.punds.ch](https://zephyr.punds.ch)**). SPA rewrites and security/cache headers are configured in [`vercel.json`](vercel.json).

Two GitHub Actions workflows are included:

- **[`ci.yml`](.github/workflows/ci.yml)** runs on every push and pull request to `main`: install, **lint**, **test**, **build**.
- **[`deploy.yml`](.github/workflows/deploy.yml)** is an optional production deploy through the Vercel CLI on push to `main`. It runs only when the `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` repository secrets are set; otherwise it's a no-op (by default, Vercel's Git integration handles deploys automatically).

[Dependabot](.github/dependabot.yml) keeps npm and GitHub Actions dependencies up to date weekly.

## Contributing

Issues and pull requests are welcome. Before opening a PR:

```bash
bun run lint    # must pass with zero warnings
bun run test
bun run build
```

Please keep features minimal and aligned with the local-first, no-backend design.

## Author

**Dominik Könitzer**, software engineer in Zürich, Switzerland.

[dk.punds.ch](https://dk.punds.ch) · [CV](https://dk.punds.ch/cv) · [@dominikkoenitzer](https://github.com/dominikkoenitzer) · [dominik.koenitzer@gmail.com](mailto:dominik.koenitzer@gmail.com)

<div align="center">

If Zephyr helps you focus, consider starring the repo.

</div>
