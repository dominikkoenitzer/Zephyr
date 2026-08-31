import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import {
  Check, Plus, Trash2, Target, Edit2, ArrowRight,
  Timer as TimerIcon, Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { CalendarPicker } from '../ui/calendar-picker';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { EmptyState } from '../ui/empty-state';
import { localStorageService } from '../../services/localStorage';
import { parseQuickTask } from '../../lib/quickParse';
import { clearCompletedWithUndo, deleteTaskWithUndo } from '../../lib/taskActions';
import {
  TASK_VIEWS, TASK_VIEW_IDS, collectTags, countsByView, filterActive, groupTasks, todayKey,
} from '../../lib/taskFilters';
import { useTasks } from '../../hooks/useStore';

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

/** A group heading: the label, a hairline running to the count, the count. */
function GroupHeading({ label, count, tone = 'muted' }) {
  return (
    <h2 className="mb-1 flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.22em]">
      <span className={tone === 'alert' ? 'text-destructive-strong' : 'text-muted-foreground'}>
        {label}
      </span>
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
      <span className="tabular-nums text-muted-foreground">{count}</span>
    </h2>
  );
}

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
  const [tagFilter, setTagFilter] = useState(
    () => localStorageService.getViewPrefs().taskTag || ''
  );

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
  const newParam = searchParams.get('new');
  const taskParam = searchParams.get('task');
  const [handledParams, setHandledParams] = useState(null);
  const paramKey = `${newParam || ''}|${taskParam || ''}`;
  if (paramKey !== handledParams) {
    setHandledParams(paramKey);
    if (taskParam) {
      const target = tasks.find((t) => t.id === taskParam);
      if (target) setEditingTask(target);
    }
  }

  useEffect(() => {
    if (!newParam && !taskParam) return;
    if (newParam) newTaskInputRef.current?.focus();
    setSearchParams({}, { replace: true });
  }, [newParam, taskParam, setSearchParams]);

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
   * One task. No card and no border of its own; the list's hairlines separate
   * the rows, the meta sits quiet on the right, and the row's actions take the
   * meta's place on hover so nothing moves under the cursor.
   */
  const renderTask = (task) => {
    const due = formatDate(task.dueDate);
    const overdue = isOverdue(task.dueDate);
    const priority = PRIORITY_TEXT[task.priority];

    return (
      <m.li key={task.id} {...rowMotion} className="group/row">
        <div
          onClick={() => setEditingTask(task)}
          className="flex cursor-pointer items-start gap-4 py-3.5 pr-1"
        >
          <button
            type="button"
            aria-label={`Mark "${task.title}" complete`}
            onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
            className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-muted-foreground/50 text-transparent transition-colors hover:border-primary-strong hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[16px] leading-6 text-foreground">{task.title}</p>
            {(task.description || (task.tags && task.tags.length > 0)) && (
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                {task.description && <span className="truncate">{task.description}</span>}
                {(task.tags || []).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); chooseTag(tagFilter === tag ? '' : tag); }}
                    aria-label={`Filter by ${tag}`}
                    className="transition-colors hover:text-foreground"
                  >
                    #{tag}
                  </button>
                ))}
              </p>
            )}
          </div>

          {/* Meta and actions share one slot: the meta fades out as the actions
              fade in, so the row never reflows under the cursor. */}
          <div className="relative mt-0.5 shrink-0">
            <span
              className={cn(
                'flex items-center gap-3 text-[13px] leading-6 tabular-nums text-muted-foreground transition-opacity duration-150 sm:group-hover/row:opacity-0 sm:group-focus-within/row:opacity-0'
              )}
            >
              {priority && <span>{priority}</span>}
              {/* Only the date goes red when it is late: a low-priority task
                  that happens to be overdue is not suddenly urgent. */}
              {due && <span className={overdue ? 'text-destructive-strong' : undefined}>{due}</span>}
            </span>

            <div className="pointer-events-none absolute -top-1.5 right-0 hidden items-center gap-0.5 opacity-0 transition-opacity duration-150 sm:flex sm:group-hover/row:pointer-events-auto sm:group-hover/row:opacity-100 sm:group-focus-within/row:pointer-events-auto sm:group-focus-within/row:opacity-100">
              <button
                type="button"
                aria-label={`Start a focus session on "${task.title}"`}
                title="Start a focus session"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/focus?taskId=${task.id}&title=${encodeURIComponent(task.title)}&start=1`);
                }}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <TimerIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={`Edit "${task.title}"`}
                onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={`Delete "${task.title}"`}
                onClick={(e) => { e.stopPropagation(); deleteTaskWithUndo(task.id); }}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </m.li>
    );
  };

  const filterButton = (label, active, onClick, count, key) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex shrink-0 items-center gap-1.5 border-b-2 pb-1.5 text-[12px] font-medium uppercase tracking-[0.16em] transition-colors',
        active
          ? 'border-foreground text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      )}
    >
      {label}
      {count !== undefined && <span className="tabular-nums opacity-60">{count}</span>}
    </button>
  );

  return (
    <div className="w-full">
      {/* Quick add: a line to write on, not a box. */}
      <form onSubmit={addTask}>
        <div className="flex items-center gap-3 border-b border-border pb-3 transition-colors focus-within:border-foreground">
          <Plus className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            ref={newTaskInputRef}
            autoFocus
            placeholder='Add a task, like "Email Sam tomorrow !high #work"'
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
            className="w-full min-w-0 bg-transparent py-1 text-[18px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {newTask.trim() && (
            <button
              type="submit"
              aria-label="Add task"
              className="flex shrink-0 items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Add
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {newTask.trim() && (parsed.dueDate || parsed.priority || parsed.tags.length > 0) && (
          <p className="animate-fade-in mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary-strong" aria-hidden="true" />
            {[
              parsed.dueDate && formatDate(parsed.dueDate),
              parsed.priority && `${parsed.priority} priority`,
              ...parsed.tags.map((t) => `#${t}`),
            ]
              .filter(Boolean)
              .map((label, index, all) => (
                <span key={label} className="text-foreground/80">
                  {label}
                  {index < all.length - 1 && <span className="ml-2.5 text-muted-foreground">·</span>}
                </span>
              ))}
          </p>
        )}
      </form>

      {/* Filters: words on a rule, not a row of pills */}
      {activeTotal > 0 && (
        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-border">
          <div
            className="scrollbar-hide -mx-1 flex max-w-full flex-nowrap items-end gap-x-5 overflow-x-auto px-1 sm:mx-0 sm:flex-wrap sm:gap-y-2 sm:overflow-visible sm:px-0"
            role="group"
            aria-label="Filter tasks"
          >
            {TASK_VIEWS.map((v) =>
              filterButton(v.label, view === v.id, () => chooseView(v.id), counts[v.id], v.id)
            )}
            {allTags.length > 0 && (
              <span className="mb-2 hidden h-3 w-px bg-border sm:block" aria-hidden="true" />
            )}
            {allTags.map((tag) =>
              filterButton(
                `#${tag}`,
                tagFilter === tag,
                () => chooseTag(tagFilter === tag ? '' : tag),
                undefined,
                tag
              )
            )}
          </div>
          <p className="pb-1.5 text-[12px] font-medium uppercase tracking-[0.16em] tabular-nums text-muted-foreground">
            {completedCount} of {totalCount} done
          </p>
        </div>
      )}

      {/* Active tasks */}
      {activeTasks.length > 0 && (
        <section className="mt-7">
          {grouped ? (
            <div className="space-y-7">
              {grouped.map((group) => (
                <div key={group.id}>
                  <GroupHeading
                    label={group.label}
                    count={group.tasks.length}
                    tone={group.id === 'overdue' ? 'alert' : 'muted'}
                  />
                  <ul className="divide-y divide-border">
                    <AnimatePresence initial={false}>{group.tasks.map(renderTask)}</AnimatePresence>
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              <AnimatePresence initial={false}>{activeTasks.map(renderTask)}</AnimatePresence>
            </ul>
          )}
        </section>
      )}

      {/* Nothing matches the current filter, but tasks do exist */}
      {activeTasks.length === 0 && activeTotal > 0 && (
        <div className="mt-10">
          <p className="text-lg text-muted-foreground">No active tasks match this filter.</p>
          <button
            type="button"
            onClick={() => { chooseView('all'); chooseTag(''); }}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-foreground transition-colors hover:text-primary-strong"
          >
            Show all {activeTotal}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Completed: collapsed by default; the list is about what is left */}
      {completedTasks.length > 0 && (
        <section className="mt-12 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setShowCompleted(!showCompleted)}
              aria-expanded={showCompleted}
              className="text-[12px] font-medium uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Completed · <span className="tabular-nums">{completedTasks.length}</span>
            </button>
            {showCompleted && (
              <button
                type="button"
                onClick={() => clearCompletedWithUndo()}
                className="text-[12px] font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-destructive-strong"
              >
                Clear
              </button>
            )}
          </div>

          {showCompleted && (
            <ul className="mt-1 divide-y divide-border">
              <AnimatePresence initial={false}>
                {completedTasks.map((task) => (
                  <m.li key={task.id} {...rowMotion} className="group/row">
                    <div className="flex items-center gap-4 py-3">
                      <button
                        type="button"
                        aria-label={`Mark "${task.title}" not complete`}
                        onClick={() => toggleTask(task.id)}
                        className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-primary-strong/50 bg-primary/10 text-primary-strong transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </button>
                      <span className="min-w-0 flex-1 truncate text-[16px] text-muted-foreground line-through">
                        {task.title}
                      </span>
                      <button
                        type="button"
                        aria-label={`Delete "${task.title}"`}
                        onClick={() => deleteTaskWithUndo(task.id)}
                        className="rounded-md p-1.5 text-muted-foreground transition-opacity hover:text-destructive-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:opacity-0 sm:group-hover/row:opacity-100 sm:group-focus-within/row:opacity-100"
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

      {/* Empty state */}
      {tasks.length === 0 && (
        <EmptyState
          icon={Target}
          title="No tasks yet"
          description="Add your first task on the line above. Type a due date, a priority or a #tag into it and Zephyr picks them up as you write."
        />
      )}

      {/* Edit task dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-md">
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
                <label className="block text-sm font-medium text-foreground">Title</label>
                <Input
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="h-11 w-full text-base"
                  placeholder="Task title"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Description</label>
                <Input
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="h-11 w-full text-base"
                  placeholder="Task description (optional)"
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
                <label className="block text-sm font-medium text-foreground">Due date</label>
                <CalendarPicker
                  value={editingTask.dueDate ? editingTask.dueDate.split('T')[0] : ''}
                  onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value || null })}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
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
                <div className="flex gap-2">
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
