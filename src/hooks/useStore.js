import { useCallback, useEffect, useRef, useState } from 'react';
import { localStorageService, CHANGE_EVENT } from '../services/localStorage';

/**
 * Subscribe a component to a slice of persisted state.
 *
 * Re-reads `read()` whenever the data changes — whether the change came from
 * this tab (our in-app `zephyr:change` event), another tab (the native
 * `storage` event), or the window regaining focus. This replaces the
 * hand-wired `focus`/`storage` listeners that were duplicated across pages.
 *
 * @param {() => T} read Pure getter that returns the current value.
 * @returns {[T, () => void]} The live value and a manual refresh function.
 * @template T
 */
export function useStoreValue(read) {
  // Keep the latest getter without making it an effect dependency, so passing
  // an inline arrow doesn't re-subscribe on every render. The refresh happens
  // after commit because a ref written during render is invisible to the
  // listeners that already closed over it.
  const readRef = useRef(read);
  useEffect(() => {
    readRef.current = read;
  });

  const [value, setValue] = useState(() => read());
  const refresh = useCallback(() => setValue(readRef.current()), []);

  // No refresh on mount: useState already seeded the value from the same
  // getter this render, so calling it here only bought a second render.
  useEffect(() => {
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  return [value, refresh];
}

// Stable module-level readers so each hook subscribes once.
const readTasks = () => localStorageService.getTasks();
const readSettings = () => localStorageService.getSettings();

export const useTasks = () => useStoreValue(readTasks);
export const useSettings = () => useStoreValue(readSettings);
