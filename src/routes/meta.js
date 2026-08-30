// One source of truth for each route's document metadata. Pages pass their
// entry to usePageMeta at runtime, and vite.config.js reads the same object at
// build time to write a static HTML file per route — so the served head and
// the hydrated head can never disagree.
export const ROUTE_META = {
  '/': {
    title: 'Zephyr, a to-do list and Pomodoro timer',
    description:
      'Zephyr is a to-do list and Pomodoro focus timer that runs in your browser. There is no account and no server: your data stays on your device and it works offline.',
    path: '/',
  },
  '/tasks': {
    title: 'Tasks | Zephyr',
    description:
      'A to-do list with due dates, priorities and #tags. Natural-language quick add understands plain English, and the list groups itself into Overdue, Today, Tomorrow and Later.',
    path: '/tasks',
  },
  '/focus': {
    title: 'Focus Timer | Zephyr',
    description:
      'A Pomodoro focus timer with custom presets, session tracking and a daily streak. Runs accurately in a background tab and keeps working offline.',
    path: '/focus',
  },
  '/settings': {
    title: 'Settings | Zephyr',
    description:
      'Theme, notifications and data management. Export a full backup of your Zephyr data or import one on another device.',
    path: '/settings',
  },
  '/help': {
    title: 'Help & FAQ | Zephyr',
    description:
      'How Zephyr works: local-first storage, offline use, keyboard shortcuts, the command palette, and how to back your data up.',
    path: '/help',
  },
  '/privacy': {
    title: 'Privacy Policy | Zephyr',
    description:
      'Zephyr stores every task and focus session in your own browser. What is stored, the one analytics service in use, and how to delete your data.',
    path: '/privacy',
  },
  '/terms': {
    title: 'Terms of Service | Zephyr',
    description:
      'The terms for using Zephyr: MIT-licensed source code, a free hosted app, and your responsibility for backing up local data.',
    path: '/terms',
  },
};
