# Contributing

Thanks for taking an interest in **Zephyr**. This guide covers local setup, the conventions the codebase follows, and how to get a change merged.

## Local setup

Requires [bun](https://bun.sh); the version is pinned in `.bun-version`. Do not introduce an npm, yarn or pnpm lockfile.

```bash
bun install
bun run dev        # http://localhost:1000
```

## Before you open a pull request

Run the same gate CI runs. All three have to pass:

```bash
bun run lint       # --max-warnings 0, so warnings fail too
bun run test
bun run build
```

Tests are Vitest + jsdom and cover the pure logic (`quickParse`, `localStorageService`, `searchService`). Prefer testing pure functions there; verify UI flows by actually running the app.

## Code style

- **Functional components and hooks only.** ESLint flat config, `react/prop-types` off.
- **`eslint-plugin-react-hooks` v7 brings the React Compiler rules** (`immutability`, `refs`, `set-state-in-effect`) and they are errors. Derive values with `useMemo`, seed state from a lazy initializer, and adjust state during render when it has to follow a prop or a URL param. An effect that copies a value into state is what these rules exist to catch, fix the file rather than adding a disable comment.
- **State lives in the services**, not in a store library. `src/services/localStorage.js` is the schema; every write goes through it and broadcasts a `zephyr:change` event that the hooks in `src/hooks/useStore.js` subscribe to. Read data with `useTasks` / `useNotes` / `useSettings` rather than hand-wiring `focus`/`storage` listeners.
- **Animate with `m.` components** (`m.div`), never `motion.div`. `LazyMotion` runs in `strict` mode and will throw.
- **Use the semantic theme tokens** (`bg-background`, `text-muted-foreground`, …) from `src/index.css`; don't hardcode colors. New text has to clear 4.5:1 in *both* themes, which is why `--destructive` is split into a fill value and a `--destructive-strong` text value.
- **`vite.config.js` is hand-tuned.** The `manualChunks` order matters and the `fixChunkLoading` plugin guarantees React executes first. Read the comments before touching it.

## Commits and pull requests

- Keep commits focused, with a short imperative subject.
- Describe what you changed and how you verified it.

## Reporting bugs and requesting features

Use the issue forms under **New issue**. For anything security-sensitive, do **not** open a public issue. Follow [SECURITY.md](SECURITY.md) instead.
