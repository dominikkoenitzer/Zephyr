import { useEffect } from 'react';
import { finishExpiredPhase } from '../services/focusTimer';

/**
 * Finishes a focus timer phase that runs out while the Focus page is not open.
 *
 * The Focus page counts down itself. Everywhere else used to leave a finished
 * session alone until Focus was opened again, so it chimed late or never, and
 * was logged at the time of that visit, often on the wrong day.
 */
export function useTimerWatch(active) {
  useEffect(() => {
    if (!active) return undefined;
    const check = () => finishExpiredPhase();
    check();
    const id = setInterval(check, 1000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', check);
    };
  }, [active]);
}

export default useTimerWatch;
