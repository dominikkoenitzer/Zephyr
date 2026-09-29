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
  // `sessionTotal` is the running phase's own length; a long break is longer
  // than `breakTime`, and states saved before it existed fall back to that.
  const total = Number(state.sessionTotal) || (state.isBreak ? state.breakTime : state.workTime) || state.workTime || 0;

  return {
    ...state,
    timeLeft,
    total,
    running: ticking && timeLeft > 0,
    paused: !ticking && total > 0 && timeLeft > 0 && timeLeft < total,
    progress: total ? Math.min(100, ((total - timeLeft) / total) * 100) : 0,
  };
}

/**
 * Where the timer goes when a phase runs out at `endedAt`, seen at `now`.
 *
 * Focus is followed by a break (the long one when it is due) and a break by
 * focus. The next phase starts by itself only when its auto-start setting is
 * on, and then from the moment the last one ended rather than from `now`: a
 * background tab ticks late and a closed one not at all, and the break should
 * not grow by that delay.
 *
 * Only the phase that was really running is finished here, so a session is
 * counted once however long the timer went unwatched. A break that ran out
 * unseen is simply over; a focus session that would have run out unseen is
 * never started, so nothing is logged for time no one was there. Either way
 * the timer comes to rest on a focus session, ready.
 */
export function nextPhase({
  isBreak,
  completed = 0,
  every = 4,
  workTime,
  breakTime,
  longBreakTime,
  autoStartBreaks = false,
  autoStartFocus = false,
  endedAt,
  now = Date.now(),
}) {
  const sessionsCompleted = isBreak ? completed : completed + 1;
  const ready = { isBreak: false, sessionsCompleted, timeLeft: workTime, isRunning: false };
  const since = (start) => Math.max(0, Math.floor((now - (Number(start) || now)) / 1000));

  const startFocus = (start) => {
    if (!autoStartFocus) return ready;
    const timeLeft = workTime - since(start);
    return timeLeft > 0 ? { ...ready, timeLeft, isRunning: true } : ready;
  };

  if (isBreak) return startFocus(endedAt);

  const length = longBreakDue(sessionsCompleted, every) ? longBreakTime : breakTime;
  if (!autoStartBreaks) return { isBreak: true, sessionsCompleted, timeLeft: length, isRunning: false };
  const timeLeft = length - since(endedAt);
  if (timeLeft > 0) return { isBreak: true, sessionsCompleted, timeLeft, isRunning: true };
  return startFocus((Number(endedAt) || now) + length * 1000);
}
