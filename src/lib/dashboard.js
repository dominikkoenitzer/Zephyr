// The figures on the dashboard, as pure functions of tasks, sessions and "now",
// so the numbers are testable and Home stays a renderer.
import { bucketOf, sortByUrgency, toDayKey } from './taskFilters';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Local midnight of a `YYYY-MM-DD` day key. */
export const startOfDay = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Milliseconds from `now` to the next local midnight, DST included. */
export const msUntilNextDay = (now = new Date()) => {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next - now;
};

/** Monday 00:00 of the week `now` falls in. */
export const weekStart = (now = new Date()) => {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
};

/** The seven days of this week, Monday first, with where each sits against today. */
export const weekDays = (now = new Date()) => {
  const start = weekStart(now);
  const today = toDayKey(now);
  return DAY_LETTERS.map((letter, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = toDayKey(d);
    return {
      key,
      letter,
      name: d.toLocaleDateString('en-GB', { weekday: 'long' }),
      isToday: key === today,
      isFuture: key > today,
    };
  });
};

const isWork = (s) => s && s.type !== 'break';

/** Focused minutes per day of this week, keyed by `YYYY-MM-DD`. */
export const focusByDay = (sessions, now = new Date()) => {
  const days = weekDays(now);
  const totals = Object.fromEntries(days.map((d) => [d.key, 0]));
  sessions.filter(isWork).forEach((s) => {
    const key = toDayKey(new Date(s.date));
    if (key in totals) totals[key] += (Number(s.duration) || 0) / 60;
  });
  return days.map((d) => ({ ...d, minutes: Math.round(totals[d.key]) }));
};

/** Today's focus: finished work sessions and their minutes, from the session log. */
export const focusToday = (sessions, now = new Date()) => {
  const today = toDayKey(now);
  const done = sessions.filter((s) => isWork(s) && toDayKey(new Date(s.date)) === today);
  return {
    sessions: done.length,
    minutes: Math.round(done.reduce((sum, s) => sum + (Number(s.duration) || 0), 0) / 60),
  };
};

/** The headline figures. */
export const dashboardStats = (tasks, sessions, now = new Date()) => {
  const today = toDayKey(now);
  const start = weekStart(now).getTime();
  const active = tasks.filter((t) => !t.completed);
  const weekSessions = sessions.filter((s) => isWork(s) && new Date(s.date).getTime() >= start);

  return {
    open: active.length,
    dueToday: active.filter((t) => bucketOf(t, today) === 'today').length,
    overdue: active.filter((t) => bucketOf(t, today) === 'overdue').length,
    done: tasks.length - active.length,
    total: tasks.length,
    doneThisWeek: tasks.filter(
      (t) => t.completed && t.completedAt && new Date(t.completedAt).getTime() >= start
    ).length,
    focusMinutes: Math.round(weekSessions.reduce((sum, s) => sum + (Number(s.duration) || 0), 0) / 60),
    sessions: weekSessions.length,
  };
};

/** The task list opened on the view a stat card counts; the list clears its tag filter for it. */
export const tasksViewHref = (view) => `/tasks?view=${encodeURIComponent(view)}`;

/** The one task that most needs doing: overdue first, then soonest due, then priority. */
export const upNext = (tasks) => sortByUrgency(tasks.filter((t) => !t.completed))[0] || null;

/** The next few dated tasks, soonest first. */
export const dueSoon = (tasks, limit = 5) =>
  sortByUrgency(tasks.filter((t) => !t.completed && t.dueDate)).slice(0, limit);

/** Latest focus sessions first. */
export const recentSessions = (sessions, limit = 4) =>
  [...sessions.filter(isWork)].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit);

/**
 * Share of tasks done, as the gauge prints it. Rounded down, so 199 of 200 is
 * 99 and not a 100 with a task still open, but never 0 once one is done.
 */
export const donePercent = (done, total) => {
  if (!total || !done) return 0;
  if (done >= total) return 100;
  return Math.max(1, Math.floor((done / total) * 100));
};

/**
 * The gauge's slices as angles in degrees, in order, with `gap` between them.
 * Every slice with a value gets at least `min` degrees, taken from the larger
 * ones, so a single overdue task among eighty still shows next to its legend.
 */
export const gaugeSegments = (parts, { start = 180, sweep = 180, gap = 5, min = 4 } = {}) => {
  const shown = parts.filter((p) => p.value > 0);
  if (!shown.length) return [];
  const drawable = sweep - gap * (shown.length - 1);
  const spans = new Array(shown.length);
  const floored = new Set();
  for (;;) {
    const free = drawable - min * floored.size;
    const rest = shown.reduce((sum, p, i) => (floored.has(i) ? sum : sum + p.value), 0);
    let changed = false;
    shown.forEach((p, i) => {
      if (floored.has(i)) return;
      spans[i] = (p.value / rest) * free;
      if (spans[i] < min) {
        floored.add(i);
        changed = true;
      }
    });
    if (!changed) break;
  }
  let cursor = start;
  return shown.map((p, i) => {
    const span = floored.has(i) ? min : spans[i];
    const seg = { ...p, from: cursor, to: cursor + span };
    cursor += span + gap;
    return seg;
  });
};

/** 125 -> "2h 5m", 45 -> "45m", 0 -> "0m". */
export const formatMinutes = (minutes) => {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h ${rest}m` : `${h}h`;
};

/** How a due day reads next to a task: "Today", "2 days late", "Fri 2 Oct". */
export const dueLabel = (dueDate, now = new Date()) => {
  if (!dueDate) return 'No date';
  const today = toDayKey(now);
  const key = String(dueDate).split('T')[0];
  const [y, mo, d] = key.split('-').map(Number);
  const due = new Date(y, mo - 1, d);
  const [ty, tm, td] = today.split('-').map(Number);
  const diff = Math.round((due - new Date(ty, tm - 1, td)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return '1 day late';
  if (diff < 0) return `${-diff} days late`;
  return due.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};
