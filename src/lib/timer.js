// The focus timer's rules, as pure functions so they can be tested without a
// browser: when a long break is due, and what the saved timer looks like from
// outside the Focus page.

/**
 * The long break follows every `every`th finished session, and never the
 * zeroth: with nothing finished yet, `0 % n === 0` used to hand out a long
 * break before any work had been done.
 */
export const longBreakDue = (completed, every = 4) => {
  const n = Math.max(1, Number(every) || 4);
  return completed > 0 && completed % n === 0;
};

/**
 * The saved timer as the sidebar and the dashboard see it at `now`: the time
 * that has passed since it was saved comes off while it runs, and it says
 * whether it is running, paused part way through, or ready. Null before the
 * timer has ever been used.
 */
export function timerSnapshot(state, now = Date.now()) {
  if (!state) return null;
  const ticking = Boolean(state.isRunning);
  const elapsed = ticking && state.lastSaved ? Math.max(0, Math.floor((now - state.lastSaved) / 1000)) : 0;
  const timeLeft = Math.max(0, (Number(state.timeLeft) || 0) - elapsed);
  const total = (state.isBreak ? state.breakTime : state.workTime) || state.workTime || 0;

  return {
    ...state,
    timeLeft,
    total,
    running: ticking && timeLeft > 0,
    paused: !ticking && total > 0 && timeLeft > 0 && timeLeft < total,
    progress: total ? Math.min(100, ((total - timeLeft) / total) * 100) : 0,
  };
}
