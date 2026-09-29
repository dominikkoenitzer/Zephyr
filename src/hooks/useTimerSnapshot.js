import { useEffect, useState } from 'react';
import { localStorageService } from '../services/localStorage';
import { useStoreValue } from './useStore';

const readTimer = () => localStorageService.getTimerState();

/**
 * The focus timer as seen from outside the Focus page: what is stored, with
 * the time that has passed since it was saved taken off while it runs.
 *
 * The countdown itself lives in `usePomodoro` and only ticks while Focus is
 * mounted, so everywhere else reads the saved state and counts down from its
 * `lastSaved` stamp. Returns null before the timer has ever been used.
 */
export function useTimerSnapshot() {
  const [state] = useStoreValue(readTimer);
  const [now, setNow] = useState(() => Date.now());
  const running = Boolean(state?.isRunning);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  if (!state) return null;
  const elapsed = running && state.lastSaved ? Math.max(0, Math.floor((now - state.lastSaved) / 1000)) : 0;
  const timeLeft = Math.max(0, (Number(state.timeLeft) || 0) - elapsed);
  const total = (state.isBreak ? state.breakTime : state.workTime) || state.workTime || 0;

  return { ...state, running, timeLeft, total };
}

export default useTimerSnapshot;
