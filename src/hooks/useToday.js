import { useEffect, useState } from 'react';
import { todayKey } from '../lib/taskFilters';
import { msUntilNextDay } from '../lib/dashboard';

/**
 * Today's `YYYY-MM-DD` key, re-rendering at the next local midnight so a page
 * left open overnight moves to the new day. A timer can sleep with the tab, so
 * coming back to the tab checks the day again.
 */
export function useToday() {
  const [today, setToday] = useState(() => todayKey());

  useEffect(() => {
    let timer;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setToday(todayKey());
        arm();
      }, msUntilNextDay());
    };
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      setToday(todayKey());
      arm();
    };
    arm();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return today;
}
