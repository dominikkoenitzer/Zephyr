import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import {
  Check, Plus, Trash2, Edit2, ArrowRight,
  Timer as TimerIcon, Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { CalendarPicker } from '../ui/calendar-picker';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { localStorageService } from '../../services/localStorage';
import { parseQuickTask } from '../../lib/quickParse';
import { clearCompletedWithUndo, deleteTaskWithUndo } from '../../lib/taskActions';
import {
  TASK_GROUPS, TASK_VIEWS, TASK_VIEW_IDS, collectTags, countsByView, filterActive, groupTasks, tagInUse, todayKey,
} from '../../lib/taskFilters';
import { useTasks } from '../../hooks/useStore';
import { useScrollEdges } from '../../hooks/useScrollEdges';

// Medium is the default every task gets, so printing it on every row says
// nothing. Only a deliberate priority earns a word.
const PRIORITY_TEXT = {
  high: 'high',
  low: 'low',
};

const rowMotion = {
  layout: true,
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, transition: { duration: 0.12 } },
  transition: { type: 'spring', stiffness: 520, damping: 42 },
};

/** A group heading: the label and its count in a small pill. */
function GroupHeading({ label, count, tone = 'muted' }) {
  return (
    <h2 className="mb-1 flex items-center gap-2 px-3 text-[13px] font-semibold">
      <span className={tone === 'alert' ? 'text-destructive-strong' : 'text-foreground'}>{label}</span>
      <span
        className={cn(
          'rounded-full px-2 py-px text-[11px] tabular-nums',
          tone === 'alert' ? 'bg-destructive/10 text-destructive-strong' : 'bg-accent text-muted-foreground'
        )}
      >
        {count}
      </span>
    </h2>
  );
}

/** Which filter view each summary row opens. */
const GROUP_VIEW = {
  overdue: 'overdue',
  today: 'today',
  tomorrow: 'upcoming',
  week: 'upcoming',
  later: 'upcoming',
  undated: 'undated',
};

const TaskList = () => {
  const navigate = useNavigate();
  // Every write below goes through localStorageService, which broadcasts the
  // change, so the list re-reads itself, here and in any other open tab.
  const [tasks] = useTasks();
  const [newTask, setNewTask] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const newTaskInputRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Which filter you left the list on survives a reload. An unfiltered list
  // after every refresh is the thing that makes filters not worth using.
  const [view, setView] = useState(() => {
    const saved = localStorageService.getViewPrefs().taskView;
    return TASK_VIEW_IDS.includes(saved) ? saved : 'all';
  });
  const [savedTag, setTagFilter] = useState(
    () => localStorageService.getViewPrefs().taskTag || ''
  );
  // A saved tag no task carries any more would hide the whole list behind a
  // chip that is no longer shown, so it counts as no filter.
  const tagFilter = tagInUse(savedTag, tasks);

  const chooseView = (next) => {
    setView(next);
    localStorageService.saveViewPrefs({ taskView: next });
  };
  const chooseTag = (next) => {
    setTagFilter(next);
    localStorageService.saveViewPrefs({ taskTag: next });
  };

  // Live, local "smart" parse of the quick-add input (date / priority / #tags).
  const parsed = useMemo(() => parseQuickTask(newTask), [newTask]);

  // Inbound intent from the ⌘K palette: `?new=1` puts the cursor in the quick
  // add, `?task=<id>` opens that task's editor. Answered during render, the
  // same way the palette deep-links, so the dialog is open on the first
  // paint; the param is stripped afterwards so the same link works twice.
  // `?view=<id>` comes from a dashboard card: it opens the view the card counts
  // and clears the tag, so a filter left on cannot hide those tasks.
  const newParam = searchParams.get('new');
  const taskParam = searchParams.get('task');
  const viewParam = TASK_VIEW_IDS.includes(searchParams.get('view')) ? searchParams.get('view') : null;
  const [handledParams, setHandledParams] = useState(null);
  const paramKey = `${newParam || ''}|${taskParam || ''}|${viewParam || ''}`;
  if (paramKey !== handledParams) {
    setHandledParams(paramKey);
    if (taskParam) {
      const target = tasks.find((t) => t.id === taskParam);
      if (target) setEditingTask(target);
    }
    if (viewParam) {
      setView(viewParam);
      setTagFilter('');
    }
  }

  useEffect(() => {
    if (!newParam && !taskParam && !viewParam) return;
    if (newParam) newTaskInputRef.current?.focus();
    if (viewParam) localStorageService.saveViewPrefs({ taskView: viewParam, taskTag: '' });
    setSearchParams({}, { replace: true });
  }, [newParam, taskParam, viewParam, setSearchParams]);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    localStorageService.addTask({
      title: parsed.title,
      description: '',
      priority: parsed.priority || 'medium',
      dueDate: parsed.dueDate || null,
      tags: parsed.tags,
    });
    localStorageService.saveOnboarding({ taskAdded: true });

    // Keep the input focused so you can add several tasks in a row.
    setNewTask('');
    newTaskInputRef.current?.focus();
  };

  const toggleTask = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      localStorageService.updateTask(taskId, { completed: !task.completed });
    }
  };

  const saveEdit = () => {
    if (!editingTask?.title?.trim()) return;
    const updates = {
      title: editingTask.title.trim(),
      description: editingTask.description?.trim() || '',
      priority: editingTask.priority || 'medium',
      dueDate: editingTask.dueDate
        ? (editingTask.dueDate.includes('T')
            ? editingTask.dueDate.split('T')[0]
            : editingTask.dueDate)
        : null,
    };
    if (localStorageService.updateTask(editingTask.id, updates)) {
      setEditingTask(null);
    }
  };

  // Sorting, filtering and the due-date headings are all pure functions in
  // `lib/taskFilters`, and this component only renders what they return.
  const today = todayKey();
  const allTags = useMemo(() => collectTags(tasks), [tasks]);
  const counts = useMemo(() => countsByView(tasks, tagFilter, today), [tasks, tagFilter, today]);
  const activeTasks = useMemo(
    () => filterActive(tasks, { view, tag: tagFilter }, today),
    [tasks, view, tagFilter, today]
  );
  // Headings only help when the list is mixed; a single-bucket view (Today,
  // Overdue, No date) would just repeat the chip you already pressed.
  const grouped = useMemo(
    () => (view === 'all' || view === 'upcoming' ? groupTasks(activeTasks, today) : null),
    [activeTasks, view, today]
  );

  const completedTasks = tasks.filter((task) => task.completed);
  const completedCount = completedTasks.length;
  const totalCount = tasks.length;
  const activeTotal = totalCount - completedCount;

  const formatDate = (dateString) => {
    if (!dateString) return null;
    // Parse YYYY-MM-DD as a local date so a timezone can't shift the day.
    const parts = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);

    // Near dates read as words, not numbers.
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.round((date - now) / 86400000);
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'tomorrow';
    if (diffDays === -1) return '1 day late';
    if (diffDays < -1) return `${Math.abs(diffDays)} days late`;
    if (diffDays > 1 && diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    }

    return date
      .toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      })
      .toLowerCase();
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const parts = dueDate.split('T')[0].split('-').map(Number);
    const due = new Date(parts[0], parts[1] - 1, parts[2]);
    due.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return due < now;
  };

  /**
   * One task: a row inside the list card that lights up under the cursor. The
   * meta sits on the right as small pills, and the row's actions take the
   * meta's place on hover so nothing moves under the cursor.
   */
  const renderTask = (task) => {
    const due = formatDate(task.dueDate);
    const overdue = isOverdue(task.dueDate);
    const priority = PRIORITY_TEXT[task.priority];
    const meta = (
      <>
                {priority && (
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5',
                      priority === 'high' ? 'bg-primary/10 text-primary-strong' : 'bg-accent text-muted-foreground'
                    )}
                  >
                    {priority}
                  </span>
                )}
                {/* Only the date goes red when it is late: a low-priority task
                    that happens to be overdue is not suddenly urgent. */}
                {due && (
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5',
                      overdue ? 'bg-destructive/10 text-destructive-strong' : 'bg-accent text-foreground'
                    )}
                  >
                    {due}
                  </span>
                )}
      </>
    );
    const roundAction =
      'flex h-8 w-8 items-center justify-center rounded-full bg-card text-muted-foreground shadow-(--shadow-sm) transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

    return (
      <m.li key={task.id} {...rowMotion} className="group/row">
        <div
          onClick={() => setEditingTask(task)}
          className="flex cursor-pointer items-start gap-3.5 rounded-2xl px-3 py-3 transition-colors hover:bg-accent/60"
        >
          <button
            type="button"
            aria-label={`Mark "${task.title}" complete`}
            onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[9px] bg-accent text-transparent shadow-[inset_0_0_0_1.5px_hsl(var(--foreground)/0.12)] transition-[background-color,box-shadow,color,transform] active:scale-90 hover:bg-primary hover:text-primary-foreground hover:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <Check className="h-3 w-3" strokeWidth={3.5} />
          </button>

          <div className="min-w-0 flex-1">
            {/* The row opens the editor on a click anywhere; the title is its
                button, because below `sm` the row's own Edit button is hidden
                and a keyboard had no way in. */}
            <p className="text-[15.5px] font-medium leading-6 text-foreground wrap-anywhere">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                className="rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {task.title}
              </button>
            </p>
            {(task.description || (task.tags && task.tags.length > 0) || priority || due) && (
              <p
                className={cn(
                  'mt-1.5 flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground',
                  task.description || task.tags?.length ? 'flex' : 'flex sm:hidden'
                )}
              >
                <span className="flex items-center gap-1.5 font-semibold tabular-nums sm:hidden">{meta}</span>
                {task.description && <span className="mr-1 truncate text-[13px]">{task.description}</span>}
                {(task.tags || []).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); chooseTag(tagFilter === tag ? '' : tag); }}
                    aria-label={`Filter by ${tag}`}
                    className="rounded-full bg-accent px-2 py-0.5 font-semibold transition-colors hover:bg-foreground hover:text-background"
                  >
                    #{tag}
                  </button>
                ))}
              </p>
            )}
          </div>

          {/* Meta and actions share one slot: the meta fades out as the actions
              fade in, so the row never reflows under the cursor. */}
          <div className="relative hidden shrink-0 sm:block">
            <span className="flex items-center gap-1.5 text-[12px] font-semibold leading-6 tabular-nums transition-opacity duration-150 sm:group-hover/row:opacity-0 sm:group-focus-within/row:opacity-0">
              {meta}
            </span>

            <div className="pointer-events-none absolute -top-1 right-0 hidden items-center gap-1 opacity-0 transition-opacity duration-150 sm:flex sm:group-hover/row:pointer-events-auto sm:group-hover/row:opacity-100 sm:group-focus-within/row:pointer-events-auto sm:group-focus-within/row:opacity-100">
              <button
                type="button"
                aria-label={`Start a focus session on "${task.title}"`}
                title="Start a focus session"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/focus?taskId=${task.id}&title=${encodeURIComponent(task.title)}&start=1`);
                }}
                className={cn(roundAction, 'hover:text-foreground')}
              >
                <TimerIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={`Edit "${task.title}"`}
                onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                className={cn(roundAction, 'hover:text-foreground')}
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={`Delete "${task.title}"`}
                onClick={(e) => { e.stopPropagation(); deleteTaskWithUndo(task.id); }}
                className={cn(roundAction, 'hover:text-destructive-strong')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </m.li>
    );
  };

  // Both filter rows scroll on a phone; each fades the edge it continues past.
  const viewsRef = useScrollEdges(view);
  const tagsRef = useScrollEdges(tagFilter);

  const filterButton = (label, active, onClick, count, key, group = 'view') => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'relative isolate flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        // The sliding pill paints the active state; the button's own fill is
        // the same night underneath, so the text never sits on white.
        active ? 'bg-hero-to text-hero-foreground' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {active && (
        <m.span
          layoutId={`task-${group}-active`}
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          className="absolute inset-0 -z-10 rounded-full bg-linear-to-br from-hero-from to-hero-to dark:ring-1 dark:ring-inset dark:ring-white/12"
        />
      )}
      {label}
      {count !== undefined && <span className="tabular-nums opacity-70">{count}</span>}
    </button>
  );

  // The summary card's rows: every heading the list can show, with its count.
  const groupCounts = useMemo(() => {
    const all = groupTasks(tasks.filter((t) => !t.completed), today);
    return TASK_GROUPS.map((g) => ({ ...g, count: all.find((x) => x.id === g.id)?.tasks.length || 0 }));
  }, [tasks, today]);
  const donePct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const card = 'rounded-3xl bg-card shadow-(--shadow-card)';

  return (
    <div className="w-full">
      {/* Quick add: a white pill to write in, with the add button inside it. */}
      <form onSubmit={addTask}>
        <div className={cn(card, 'flex h-16 items-center gap-3 rounded-full pl-3 pr-2 transition-shadow focus-within:ring-2 focus-within:ring-primary/35')}>
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-strong">
            <Plus className="h-5 w-5" />
          </span>
          <input
            ref={newTaskInputRef}
            autoFocus
            placeholder="Add a task"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Escape') return;
              // Escape clears the draft; a second Escape steps out of the
              // field, which is what makes the single-key shortcuts reachable
              // on the one page that autofocuses an input.
              if (newTask) setNewTask('');
              else e.currentTarget.blur();
            }}
            aria-label="Add a task"
            className="w-full min-w-0 bg-transparent text-[16px] font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground focus:outline-none sm:text-[17px]"
          />
          {newTask.trim() && (
            <Button type="submit" aria-label="Add task" className="h-12 shrink-0">
              Add
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>

        {newTask.trim() && (parsed.dueDate || parsed.priority || parsed.tags.length > 0) && (
          <p className="animate-fade-in mt-3 flex flex-wrap items-center gap-1.5 px-3 text-[12px] font-semibold">
            <Sparkles className="mr-1 h-3.5 w-3.5 text-primary-strong" aria-hidden="true" />
            {[
              parsed.dueDate && formatDate(parsed.dueDate),
              parsed.priority && `${parsed.priority} priority`,
              ...parsed.tags.map((t) => `#${t}`),
            ]
              .filter(Boolean)
              .map((label) => (
                <span key={label} className="rounded-full bg-card px-2.5 py-1 text-foreground shadow-(--shadow-sm)">
                  {label}
                </span>
              ))}
          </p>
        )}
      </form>

      {/* Filters: one segmented pill for the views, one for the tags */}
      {activeTotal > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className={cn(card, 'max-w-full overflow-hidden rounded-full p-1')}>
            <div
              ref={viewsRef}
              className="scroll-edges scrollbar-hide flex items-center gap-0.5 overflow-x-auto rounded-full"
              role="group"
              aria-label="Filter tasks"
            >
              {TASK_VIEWS.map((v) =>
                filterButton(v.label, view === v.id, () => chooseView(v.id), counts[v.id], v.id)
              )}
            </div>
          </div>
          {allTags.length > 0 && (
            <div className={cn(card, 'max-w-full overflow-hidden rounded-full p-1')}>
              <div
                ref={tagsRef}
                className="scroll-edges scrollbar-hide flex items-center gap-0.5 overflow-x-auto rounded-full"
                role="group"
                aria-label="Filter by tag"
              >
                {allTags.map((tag) =>
                  filterButton(
                    `#${tag}`,
                    tagFilter === tag,
                    () => chooseTag(tagFilter === tag ? '' : tag),
                    undefined,
                    `tag:${tag}`,
                    'tag'
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tasks.length > 0 && (
        <div className="mt-5 grid grid-cols-1 items-start gap-(--panel-gap) xl:grid-cols-12">
          {/* The list */}
          <section className={cn(card, 'p-3 sm:p-4 xl:col-span-8')} aria-label="Open tasks">
            {activeTasks.length > 0 ? (
              grouped ? (
                <div className="space-y-5 py-1">
                  {grouped.map((group) => (
                    <div key={group.id}>
                      <GroupHeading
                        label={group.label}
                        count={group.tasks.length}
                        tone={group.id === 'overdue' ? 'alert' : 'muted'}
                      />
                      <ul>
                        <AnimatePresence initial={false}>{group.tasks.map(renderTask)}</AnimatePresence>
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <ul>
                  <AnimatePresence initial={false}>{activeTasks.map(renderTask)}</AnimatePresence>
                </ul>
              )
            ) : activeTotal > 0 ? (
              /* Nothing matches the current filter, but tasks do exist */
              <div className="px-3 py-8">
                <p className="text-lg font-medium">Nothing here</p>
                <button
                  type="button"
                  onClick={() => { chooseView('all'); chooseTag(''); }}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-strong transition-colors hover:text-foreground"
                >
                  Show all {activeTotal}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="px-3 py-8">
                <p className="text-lg font-medium">All done</p>
              </div>
            )}
          </section>

          <div className="space-y-(--panel-gap) xl:col-span-4">
            {/* Summary: how far through the list you are, and each heading's
                count as a row that filters to it. */}
            <section className={cn(card, 'p-6')} aria-labelledby="summary-title">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="summary-title" className="text-[17px] font-semibold tracking-[-0.015em]">Summary</h2>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold tabular-nums text-foreground">{completedCount}</span> of {totalCount} done
                </p>
              </div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-accent" aria-hidden="true">
                <m.div
                  initial={{ width: 0 }}
                  animate={{ width: `${donePct}%` }}
                  transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                  className="h-full rounded-full bg-linear-to-r from-primary to-sun"
                />
              </div>
              <ul className="mt-5 space-y-0.5">
                {groupCounts.map((g) => (
                  <li key={g.id}>
                    <button
                      type="button"
                      disabled={g.count === 0}
                      onClick={() => chooseView(GROUP_VIEW[g.id])}
                      className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-1.5 text-left text-[14px] transition-colors hover:bg-accent/70 disabled:pointer-events-none disabled:opacity-45"
                    >
                      <span className={cn('flex-1 font-medium', g.id === 'overdue' && g.count ? 'text-destructive-strong' : 'text-foreground')}>
                        {g.label}
                      </span>
                      <span className="w-24 overflow-hidden rounded-full bg-accent" aria-hidden="true">
                        <span
                          className={cn('block h-1.5 rounded-full', g.id === 'overdue' ? 'bg-destructive' : 'bg-night')}
                          style={{ width: `${activeTotal ? Math.round((g.count / activeTotal) * 100) : 0}%` }}
                        />
                      </span>
                      <span className="w-5 text-right font-semibold tabular-nums">{g.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {/* Completed: collapsed by default; the list is about what is left */}
            {completedTasks.length > 0 && (
              <section className={cn(card, 'p-6')}>
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCompleted(!showCompleted)}
                    aria-expanded={showCompleted}
                    className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.015em] transition-colors hover:text-primary-strong"
                  >
                    Completed
                    <span className="rounded-full bg-accent px-2 py-px text-[12px] tabular-nums text-muted-foreground">
                      {completedTasks.length}
                    </span>
                  </button>
                  {showCompleted ? (
                    <button
                      type="button"
                      onClick={() => clearCompletedWithUndo()}
                      className="rounded-full px-3 py-1 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive-strong"
                    >
                      Clear
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCompleted(true)}
                      className="rounded-full px-3 py-1 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      Show
                    </button>
                  )}
                </div>

                {showCompleted && (
                  <ul className="mt-3">
                    <AnimatePresence initial={false}>
                      {completedTasks.map((task) => (
                        <m.li key={task.id} {...rowMotion} className="group/row">
                          <div className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-accent/60">
                            <button
                              type="button"
                              aria-label={`Mark "${task.title}" not complete`}
                              onClick={() => toggleTask(task.id)}
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[9px] bg-primary text-primary-foreground transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                            >
                              <Check className="h-3 w-3" strokeWidth={3.5} />
                            </button>
                            <span className="min-w-0 flex-1 truncate text-[14px] text-muted-foreground line-through">
                              {task.title}
                            </span>
                            <button
                              type="button"
                              aria-label={`Delete "${task.title}"`}
                              onClick={() => deleteTaskWithUndo(task.id)}
                              className="rounded-full p-1.5 text-muted-foreground transition-opacity hover:text-destructive-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:opacity-0 sm:group-hover/row:opacity-100 sm:group-focus-within/row:opacity-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </m.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </section>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className={cn(card, 'mt-5')}>
          <p className="px-6 py-10 text-center text-[15px] text-muted-foreground">No tasks yet</p>
        </div>
      )}

      {/* Edit task dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit task</DialogTitle>
            </DialogHeader>
            <div
              className="space-y-5 py-2"
              onKeyDown={(e) => {
                // Enter in a text field (or Ctrl/Cmd+Enter anywhere) saves.
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || e.target.tagName === 'INPUT')) {
                  e.preventDefault();
                  saveEdit();
                }
              }}
            >
              <div className="space-y-2">
                <label htmlFor="edit-task-title" className="block text-sm font-medium text-foreground">Title</label>
                <Input
                  id="edit-task-title"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="h-11 w-full text-base"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-task-description" className="block text-sm font-medium text-foreground">Description</label>
                <Input
                  id="edit-task-description"
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="h-11 w-full text-base"
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground" id="edit-priority-label">
                  Priority
                </label>
                {/* `Select` is the Radix root, so it needs a trigger and items:
                    the plain <option> list it used to hold rendered as three
                    words of loose text with nothing to click. */}
                <Select
                  value={editingTask.priority || 'medium'}
                  onValueChange={(value) => setEditingTask({ ...editingTask, priority: value })}
                >
                  <SelectTrigger className="h-11 w-full" aria-labelledby="edit-priority-label">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground" id="edit-due-label">Due date</label>
                {/* The picker's trigger is a button, not a field, so the label
                    names it by id, followed by the date it shows. */}
                <CalendarPicker
                  id="edit-due-trigger"
                  aria-labelledby="edit-due-label edit-due-trigger"
                  value={editingTask.dueDate ? editingTask.dueDate.split('T')[0] : ''}
                  onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value || null })}
                  className="w-full"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                {/* Phones never see the row's hover actions, so deleting and
                    focusing live here too. */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive-strong"
                    onClick={() => {
                      deleteTaskWithUndo(editingTask.id);
                      setEditingTask(null);
                    }}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      navigate(
                        `/focus?taskId=${editingTask.id}&title=${encodeURIComponent(editingTask.title)}&start=1`
                      )
                    }
                  >
                    <TimerIcon className="mr-1.5 h-4 w-4" />
                    Focus
                  </Button>
                </div>
                <div className="ml-auto flex gap-2">
                  <Button variant="outline" onClick={() => setEditingTask(null)}>
                    Cancel
                  </Button>
                  <Button onClick={saveEdit}>Save</Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TaskList;
