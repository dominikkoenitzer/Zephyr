// The keyboard map, written once and read by both the ⌘K palette's shortcut
// sheet and the Help page. Adding a shortcut means adding it here and in
// `useAppShortcuts`; this file is the documentation, not the behaviour.

/** Macs say ⌘, everything else says Ctrl. */
export const isMac = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '');

export const modKey = () => (isMac() ? '⌘' : 'Ctrl');

export const SHORTCUT_GROUPS = [
  {
    title: 'Anywhere',
    items: [
      { keys: ['mod', 'K'], label: 'Open the command palette' },
      { keys: ['/'], label: 'Search your tasks' },
      { keys: ['N'], label: 'New task' },
      { keys: ['T'], label: 'Switch light / dark / system' },
      { keys: ['?'], label: 'Show these shortcuts' },
      { keys: ['Esc'], label: 'Close a dialog, or clear the field you are in' },
    ],
  },
  {
    title: 'Go to',
    items: [
      { keys: ['G', 'H'], label: 'Home' },
      { keys: ['G', 'T'], label: 'Tasks' },
      { keys: ['G', 'F'], label: 'Focus timer' },
      { keys: ['G', 'S'], label: 'Settings' },
      { keys: ['G', '?'], label: 'Help' },
    ],
  },
  {
    title: 'Focus timer',
    items: [
      { keys: ['Space'], label: 'Start or pause the session' },
      { keys: ['R'], label: 'Reset the session' },
      { keys: ['F'], label: 'Full screen, and Esc to leave it' },
      { keys: ['S'], label: 'Skip to the next session' },
    ],
  },
  {
    title: 'Writing',
    items: [
      { keys: ['Enter'], label: 'Add the task you are typing' },
      { keys: ['mod', 'Enter'], label: 'Save the task you are editing' },
    ],
  },
];

/** Resolve the `mod` placeholder for display. */
export const renderKeys = (keys) => keys.map((k) => (k === 'mod' ? modKey() : k));
