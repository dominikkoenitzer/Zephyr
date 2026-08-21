// The focus streak has been counted and stored since the timer existed, and
// never shown anywhere. Reading it needs one rule the writer doesn't apply:
// a streak whose last day is older than yesterday is over, even though the
// stored count still says otherwise.

/** Midnight of a date, local. */
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * How many days the streak is actually worth today.
 *
 * @param {{count?: number, lastDate?: string|null}} streak Stored streak.
 * @param {Date} [today] Injected so tests don't depend on the clock.
 * @returns {number} 0 once the chain is broken.
 */
export function activeStreak(streak, today = new Date()) {
  const count = Math.max(0, Number(streak?.count) || 0);
  if (!count || !streak?.lastDate) return 0;

  const last = startOfDay(new Date(streak.lastDate));
  if (Number.isNaN(last.getTime())) return 0;

  const days = Math.round((startOfDay(today) - last) / 86400000);
  // Today keeps it, yesterday keeps it alive until midnight, anything older
  // has already been missed.
  return days === 0 || days === 1 ? count : 0;
}

/** True while today's session has not been logged but the streak still stands. */
export function streakAtRisk(streak, today = new Date()) {
  if (activeStreak(streak, today) === 0) return false;
  const last = startOfDay(new Date(streak.lastDate));
  return Math.round((startOfDay(today) - last) / 86400000) === 1;
}
