import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, CheckCircle, Circle, ListTodo, Target,
  Edit2, Calendar, Tag, Flag, ChevronDown,
  Timer as TimerIcon, CalendarClock, Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { CalendarPicker } from '../ui/calendar-picker';
import { Select } from '../ui/select';
import { Card, CardContent } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { EmptyState } from '../ui/empty-state';
import { localStorageService } from '../../services/localStorage';
import { parseQuickTask } from '../../lib/quickParse';
import { toast } from 'sonner';

const PRIORITY_STYLES = {
  high: 'text-destructive bg-destructive/10 border border-destructive/30',
  medium: 'text-amber-600 bg-amber-500/10 border border-amber-500/30',
  low: 'text-primary bg-primary/10 border border-primary/30'
};

const PRIORITY_LABELS = {
  high: 'High',
  medium: 'Medium',
  low: 'Low'
};

const TaskList = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const newTaskInputRef = useRef(null);

  // Load tasks on mount
  useEffect(() => {
    setTasks(localStorageService.getTasks());
  }, []);

  // Live, local "smart" parse of the quick-add input (date / priority / #tags).
  const parsed = useMemo(() => parseQuickTask(newTask), [newTask]);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    localStorageService.addTask({
      title: parsed.title,
      description: '',
      priority: parsed.priority || 'medium',
      dueDate: parsed.dueDate || null,
      tags: parsed.tags
    });
    localStorageService.saveOnboarding({ taskAdded: true });

    // Keep the input focused so you can add several tasks in a row.
    setTasks(localStorageService.getTasks());
    setNewTask('');
    newTaskInputRef.current?.focus();
  };

  const toggleTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updatedTask = localStorageService.updateTask(taskId, {
        completed: !task.completed
      });
      
      if (updatedTask) {
        // Reload tasks from localStorage to ensure consistency
        const allTasks = localStorageService.getTasks();
        setTasks(allTasks);
      }
    }
  };

  const deleteTask = (taskId) => {
    const removed = tasks.find((t) => t.id === taskId);
    localStorageService.deleteTask(taskId);
    setTasks(localStorageService.getTasks());
    if (removed) {
      toast('Task deleted', {
        action: {
          label: 'Undo',
          onClick: () => {
            localStorageService.saveTasks([...localStorageService.getTasks(), removed]);
            setTasks(localStorageService.getTasks());
          },
        },
      });
    }
  };

  const updateTask = (taskId, updates) => {
    const updatedTask = localStorageService.updateTask(taskId, updates);
    if (updatedTask) {
      // Reload tasks from localStorage to ensure consistency
      const allTasks = localStorageService.getTasks();
      setTasks(allTasks);
    }
    return updatedTask;
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
        : null
    };
    if (updateTask(editingTask.id, updates)) {
      setEditingTask(null);
    }
  };

  // Active tasks sort by due date (soonest first, undated last), then
  // priority — so what needs attention is always at the top.
  const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };
  const activeTasks = tasks
    .filter(task => !task.completed)
    .sort((a, b) => {
      const da = (a.dueDate || '9999').split('T')[0];
      const db = (b.dueDate || '9999').split('T')[0];
      if (da !== db) return da < db ? -1 : 1;
      return (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
    });
  const completedTasks = tasks.filter(task => task.completed);
  const completedCount = completedTasks.length;
  const totalCount = tasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const formatDate = (dateString) => {
    if (!dateString) return null;
    // Parse YYYY-MM-DD format as local date to avoid timezone issues
    const dateParts = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

    // Near dates read as words, not numbers.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((date - today) / 86400000);
    if (diffDays === -1) return 'Yesterday';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1 && diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    // Parse YYYY-MM-DD format as local date to avoid timezone issues
    const dateParts = dueDate.split('T')[0].split('-').map(Number);
    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(date);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  return (
    <div className="w-full space-y-5">
          {/* Quick add — the primary action, front and center */}
          <div>
            <form onSubmit={addTask} className="relative">
              <ListTodo className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                ref={newTaskInputRef}
                autoFocus
                placeholder='Add a task — try "Email Sam tomorrow !high #work"'
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setNewTask('')}
                className="pl-12 pr-14 h-14 text-base rounded-2xl bg-card/60 backdrop-blur-xl border-border/50 shadow-[var(--shadow-card)]"
                aria-label="Add a task"
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Add task"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-9 w-9"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </form>

            {newTask.trim() && (parsed.dueDate || parsed.priority || parsed.tags.length > 0) && (
              <div className="mt-3 flex items-center gap-2 flex-wrap text-xs animate-fade-in">
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Detected:
                </span>
                {parsed.dueDate && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    <CalendarClock className="h-3 w-3" />
                    {formatDate(parsed.dueDate)}
                  </span>
                )}
                {parsed.priority && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${PRIORITY_STYLES[parsed.priority]}`}>
                    <Flag className="h-3 w-3" />
                    {PRIORITY_LABELS[parsed.priority]}
                  </span>
                )}
                {parsed.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Active Tasks */}
          {activeTasks.length > 0 && (
            <section>
              <div className="mb-2 flex items-center justify-between gap-3 px-1">
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Active · {activeTasks.length}
                </h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground" title={`${completionRate}% complete`}>
                  <span>{completedCount}/{totalCount} done</span>
                  <div
                    className="h-1.5 w-24 rounded-full bg-muted overflow-hidden"
                    role="progressbar"
                    aria-valuenow={completionRate}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Tasks completed"
                  >
                    <div className="h-full bg-brand transition-all duration-500 ease-out" style={{ width: `${completionRate}%` }} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                {activeTasks.map((task) => {
                  const dueDate = formatDate(task.dueDate);
                  const overdue = isOverdue(task.dueDate);

                  return (
                    <m.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      onClick={() => setEditingTask(task)}
                      className="flex items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-card/70 backdrop-blur-xl border border-border/60 rounded-xl transition-colors duration-200 hover:shadow-sm hover:border-primary/30 group cursor-pointer"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Mark task complete"
                        className="p-0 h-auto hover:bg-transparent flex-shrink-0 mt-0.5 sm:mt-0"
                        onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                      >
                        <Circle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hover:text-primary transition-colors" />
                      </Button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-sm sm:text-base font-medium text-foreground">
                            {task.title}
                          </span>
                          {task.priority && (
                            <span className={`text-xs font-medium px-2 py-1 rounded-full inline-flex items-center gap-1 ${PRIORITY_STYLES[task.priority]}`}>
                              <Flag className="h-3 w-3" />
                              {PRIORITY_LABELS[task.priority]}
                            </span>
                          )}
                          {dueDate && (
                            <span className={`text-xs flex items-center gap-1 ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                              <Calendar className="h-3 w-3" />
                              {dueDate}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            {task.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground flex items-center gap-1"
                              >
                                <Tag className="h-3 w-3" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="p-2 h-auto text-muted-foreground hover:text-primary"
                          onClick={(e) => { e.stopPropagation(); navigate(`/focus?taskId=${task.id}&title=${encodeURIComponent(task.title)}&start=1`); }}
                        >
                          <TimerIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                          Focus
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 sm:p-2 h-auto text-muted-foreground hover:text-primary"
                          aria-label="Edit task"
                          onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                        >
                          <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 sm:p-2 h-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          aria-label="Delete task"
                          onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </m.div>
                  );
                })}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* Completed Tasks — collapsible */}
          {completedTasks.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setShowCompleted(!showCompleted)}
                aria-expanded={showCompleted}
                className="flex w-full items-center gap-1.5 px-1 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronDown className={cn('h-4 w-4 transition-transform', !showCompleted && '-rotate-90')} />
                Completed · {completedTasks.length}
              </button>
              {showCompleted && (
              <div className="mt-2 space-y-2">
                <AnimatePresence initial={false}>
                {completedTasks.map((task) => (
                  <m.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    className="flex items-center gap-3 p-4 bg-card/40 backdrop-blur-xl border border-border/50 rounded-xl"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto hover:bg-transparent"
                      onClick={() => toggleTask(task.id)}
                    >
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
                    </Button>
                    
                    <span className="flex-1 text-base text-muted-foreground line-through">
                      {task.title}
                    </span>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 h-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      aria-label="Delete task"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </m.div>
                ))}
                </AnimatePresence>
              </div>
              )}
            </section>
          )}

          {/* Empty State */}
          {tasks.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-0">
                <EmptyState
                  icon={Target}
                  title="No tasks yet"
                  description="Add your first task above — type a due date, priority, or #tag and it'll be picked up automatically."
                />
              </CardContent>
            </Card>
          )}

      {/* Edit Task Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
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
                <label className="text-sm font-medium block text-foreground">Title</label>
                <Input
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full h-11 text-base"
                  placeholder="Task title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block text-foreground">Description</label>
                <Input
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full h-11 text-base"
                  placeholder="Task description (optional)"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block text-foreground">Priority</label>
                <Select
                  value={editingTask.priority || 'medium'}
                  onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                  className="w-full"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block text-foreground">Due Date</label>
                <CalendarPicker
                  value={editingTask.dueDate ? editingTask.dueDate.split('T')[0] : ''}
                  onChange={(e) => {
                    const dateValue = e.target.value || null;
                    setEditingTask({ ...editingTask, dueDate: dateValue });
                  }}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveEdit} className="flex-1">
                  Save Changes
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setEditingTask(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TaskList;
