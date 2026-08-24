// Pure helpers behind the task list's views, grouping and counts.
// Everything here is date maths on `YYYY-MM-DD` day keys, with no storage and
// no React, so the behaviour is unit-testable and the list component stays a
// renderer.

/** The filter chips above the list, in the order they are shown. */
export const TASK_VIEWS = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'undated', label: 'No date' },
];

export const TASK_VIEW_IDS = TASK_VIEWS.map((v) => v.id);

/** Group headings for active tasks, in the order they are rendered. */
export const TASK_GROUPS = [
  { id: 'overdue', label: 'Overdue' },
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'week', label: 'This week' },
  { id: 'later', label: 'Later' },
  { id: 'undated', label: 'No date' },
];

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

const pad = (n) => String(n).padStart(2, '0');

/** Local-calendar day key for a Date. */
export const toDayKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Day key for a stored due date (`YYYY-MM-DD` or a full ISO string). */
export const dueDayKey = (value) => (value ? String(value).split('T')[0] : null);

/** Today's key. Passed around explicitly so tests never depend on the clock. */
export const todayKey = (now = new Date()) => toDayKey(now);

/**
 * Whole days from `today` to `day`, both `YYYY-MM-DD`. Negative is in the past.
 * Parsed as local dates so a UTC-midnight due date doesn't slip a day.
 */
export const daysUntil = (day, today) => {
  if (!day) return null;
  const [ay, am, ad] = day.split('-').map(Number);
  const [by, bm, bd] = today.split('-').map(Number);
  const a = new Date(ay, am - 1, ad);
  const b = new Date(by, bm - 1, bd);
  return Math.round((a - b) / 86400000);
};

/** Which heading a task belongs under. */
export const bucketOf = (task, today) => {
  const day = dueDayKey(task.dueDate);
  if (!day) return 'undated';
  const diff = daysUntil(day, today);
  if (diff === null || Number.isNaN(diff)) return 'undated';
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff <= 7) return 'week';
  return 'later';
};

/** Does a task belong in a filter view? Views only ever see active tasks. */
export const matchesView = (task, view, today) => {
  if (view === 'all') return true;
  const bucket = bucketOf(task, today);
  if (view === 'today') return bucket === 'today' || bucket === 'overdue';
  if (view === 'overdue') return bucket === 'overdue';
  if (view === 'undated') return bucket === 'undated';
  if (view === 'upcoming') return bucket === 'tomorrow' || bucket === 'week' || bucket === 'later';
  return true;
};

const matchesTag = (task, tag) =>
  !tag || (task.tags || []).some((t) => String(t).toLowerCase() === tag.toLowerCase());

/**
 * Soonest due first (undated last), then priority, so what needs attention
 * stays at the top of whatever group it lands in.
 */
export const sortByUrgency = (tasks) =>
  [...tasks].sort((a, b) => {
    const da = dueDayKey(a.dueDate) || '9999-99-99';
    const db = dueDayKey(b.dueDate) || '9999-99-99';
    if (da !== db) return da < db ? -1 : 1;
    return (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
  });

/** Active tasks passing the current view + tag, urgency-sorted. */
export const filterActive = (tasks, { view = 'all', tag = '' } = {}, today = todayKey()) =>
  sortByUrgency(
    tasks.filter((t) => !t.completed && matchesView(t, view, today) && matchesTag(t, tag))
  );

/** The same list split under its headings; empty groups are dropped. */
export const groupTasks = (tasks, today = todayKey()) => {
  const byBucket = new Map(TASK_GROUPS.map((g) => [g.id, []]));
  sortByUrgency(tasks).forEach((task) => {
    byBucket.get(bucketOf(task, today)).push(task);
  });
  return TASK_GROUPS.map((g) => ({ ...g, tasks: byBucket.get(g.id) })).filter(
    (g) => g.tasks.length > 0
  );
};

/** How many active tasks each chip would show, for the chip badges. */
export const countsByView = (tasks, tag = '', today = todayKey()) => {
  const active = tasks.filter((t) => !t.completed && matchesTag(t, tag));
  return Object.fromEntries(
    TASK_VIEW_IDS.map((id) => [id, active.filter((t) => matchesView(t, id, today)).length])
  );
};

/** Every tag in use, lowercased and de-duplicated, alphabetical. */
export const collectTags = (tasks) =>
  [...new Set(tasks.flatMap((t) => (t.tags || []).map((x) => String(x).toLowerCase())))].sort();
