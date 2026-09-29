import { useEffect, useState } from 'react';
import { localStorageService } from '../services/localStorage';
import { timerSnapshot } from '../lib/timer';
import { useStoreValue } from './useStore';

const readTimer = () => localStorageService.getTimerState();

/**
 * The focus timer as seen from outside the Focus page, ticking once a second
 * while it runs.
 *
 * The countdown itself lives in `usePomodoro` and only ticks while Focus is
 * mounted, so everywhere else reads the saved state and counts down from its
 * `lastSaved` stamp. The maths is `timerSnapshot` in lib/timer, which is
 * tested; this hook only supplies the clock.
 */
export function useTimerSnapshot() {
  const [state] = useStoreValue(readTimer);
  const [now, setNow] = useState(() => Date.now());
  const ticking = Boolean(state?.isRunning);

  useEffect(() => {
    if (!ticking) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ticking]);

  return timerSnapshot(state, now);
}

export default useTimerSnapshot;
