// Clock formatting, kept apart from the timer hook so the sidebar and the
// dashboard can print a time without pulling the whole timer into the entry
// bundle.

/** mm:ss for a duration in seconds. Fractions and negatives never reach the screen. */
export const formatTime = (seconds) => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};
