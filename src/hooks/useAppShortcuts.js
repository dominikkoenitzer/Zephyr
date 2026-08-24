import { useEffect, useRef } from 'react';

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** Is the keystroke aimed at a field the user is writing in? */
const isTyping = (target) =>
  !!target && (TYPING_TAGS.has(target.tagName) || target.isContentEditable);

/**
 * A Radix dialog, popover or select is open. Single-letter shortcuts stand
 * down while one is: inside a dialog, `t` belongs to whatever has focus.
 */
const isOverlayOpen = () =>
  !!document.querySelector(
    '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [role="listbox"][data-state="open"]'
  );

/** How long a `g` stays armed while you reach for the second key. */
const CHORD_MS = 1400;

/**
 * The app-wide keyboard map. Behaviour lives here; the printed list of what
 * exists lives in `src/lib/shortcuts.js`, so keep the two in step.
 *
 * Handlers are read through a ref so the listener is attached once and never
 * re-registers as the callbacks change identity between renders.
 *
 * @param {object} handlers
 * @param {() => void} handlers.onOpenPalette
 * @param {() => void} handlers.onOpenShortcuts
 * @param {() => void} handlers.onNewTask
 * @param {() => void} handlers.onToggleTheme
 * @param {(path: string) => void} handlers.onNavigate
 */
export function useAppShortcuts(handlers) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    let chordTimer = null;
    let chord = null;

    const clearChord = () => {
      chord = null;
      if (chordTimer) clearTimeout(chordTimer);
      chordTimer = null;
    };

    const armChord = () => {
      chord = 'g';
      if (chordTimer) clearTimeout(chordTimer);
      chordTimer = setTimeout(clearChord, CHORD_MS);
    };

    const onKeyDown = (event) => {
      const h = handlersRef.current;
      const mod = event.metaKey || event.ctrlKey;

      // ⌘K / Ctrl+K works even inside a text field. That is the point of it.
      if (mod && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        clearChord();
        h.onOpenPalette();
        return;
      }

      if (mod || event.altKey || event.repeat) return;
      if (isTyping(event.target) || isOverlayOpen()) return;

      const key = event.key;

      if (chord === 'g') {
        const routes = {
          h: '/',
          t: '/tasks',
          f: '/focus',
          s: '/settings',
          '?': '/help',
          '/': '/help',
        };
        const path = routes[key.toLowerCase()];
        clearChord();
        if (path) {
          event.preventDefault();
          h.onNavigate(path);
        }
        return;
      }

      switch (key) {
        case '/':
          event.preventDefault();
          h.onOpenPalette();
          return;
        case '?':
          event.preventDefault();
          h.onOpenShortcuts();
          return;
        default:
          break;
      }

      switch (key.toLowerCase()) {
        case 'g':
          armChord();
          break;
        case 'n':
          event.preventDefault();
          h.onNewTask();
          break;
        case 't':
          event.preventDefault();
          h.onToggleTheme();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      clearChord();
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);
}

export default useAppShortcuts;
