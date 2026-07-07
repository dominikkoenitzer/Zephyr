import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, CheckCircle, Circle, ListTodo, Target,
  FolderPlus, Edit2, Calendar, Tag, Flag, ChevronDown,
  X, Timer as TimerIcon, CalendarClock, Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { CalendarPicker } from '../ui/calendar-picker';
import { Select } from '../ui/select';
import { Card, CardContent } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
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

const folderChipClass = (active) =>
  cn(
    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
    active
      ? 'border-primary/30 bg-primary/10 text-primary'
      : 'border-border/60 text-muted-foreground hover:bg-accent/50 hover:text-foreground'
  );

const TaskList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showCompleted, setShowCompleted] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const newTaskInputRef = useRef(null);

  // Load tasks and folders on mount. Folders are persisted by the service
  // on every mutation, so there is no save-on-change effect here (one used
  // to exist and could race the initial load, wiping folders).
  useEffect(() => {
    setTasks(localStorageService.getTasks());
    setFolders(localStorageService.getFolders());
  }, []);

  // Pick requested folder from query params (e.g., ?folder=<id> or ?folder=today)
  useEffect(() => {
    const folderParam = searchParams.get('folder') || searchParams.get('t');
    if (!folderParam) return;
    const match =
      folders.find(f => f.id === folderParam) ||
      (folderParam === 'today' && folders.find(f => f.name?.toLowerCase() === 'today'));
    if (match) {
      setSelectedFolder(match.id);
    }
  }, [searchParams, folders]);

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
      tags: parsed.tags,
      folderId: selectedFolder || null
    });
    localStorageService.saveOnboarding({ taskAdded: true });

    // Keep the input focused so you can add several tasks in a row.
    setTasks(localStorageService.getTasks());
    setNewTask('');
    newTaskInputRef.current?.focus();
  };

  const addFolder = () => {
    if (!newFolderName.trim()) return;
    const folder = localStorageService.addFolder({ name: newFolderName });
    setFolders(prev => [...prev, folder]);
    setNewFolderName('');
    setShowFolderDialog(false);
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

  const deleteFolder = (folderId) => {
    localStorageService.deleteFolder(folderId);
    // Reload folders from localStorage to ensure consistency
    const allFolders = localStorageService.getFolders();
    setFolders(allFolders);
    if (selectedFolder === folderId) {
      setSelectedFolder(null);
    }
    // Reload tasks to update folder references
    const allTasks = localStorageService.getTasks();
    setTasks(allTasks);
  };

  // Tasks scoped to the selected folder. Completed visibility is handled by
  // the collapsible Completed section, not by filtering.
  const filteredTasks = useMemo(() => {
    if (selectedFolder === null) return tasks;
    return tasks.filter(task => task.folderId === selectedFolder);
  }, [tasks, selectedFolder]);

  const activeTasks = filteredTasks.filter(task => !task.completed);
  const completedTasks = filteredTasks.filter(task => task.completed);
  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getFolderName = (folderId) => {
    if (!folderId) return null;
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : null;
  };

  const getFolderColor = (folderId) => {
    if (!folderId) return null;
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.color : null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    // Parse YYYY-MM-DD format as local date to avoid timezone issues
    const dateParts = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
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
    <div className="w-full max-w-3xl mx-auto space-y-5">
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

          {/* Folder filters + inline progress */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedFolder(null)}
                className={folderChipClass(selectedFolder === null)}
              >
                All tasks
              </button>
              {folders.map((folder) => (
                <span key={folder.id} className="group/chip relative inline-flex">
                  <button
                    type="button"
                    onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
                    className={folderChipClass(selectedFolder === folder.id)}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: folder.color }} />
                    {folder.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteFolder(folder.id)}
                    aria-label={`Delete folder ${folder.name}`}
                    className="absolute -top-1.5 -right-1.5 hidden group-hover/chip:flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-white"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
                <DialogTrigger asChild>
                  <button type="button" className={folderChipClass(false)}>
                    <FolderPlus className="h-3.5 w-3.5" />
                    New folder
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Folder name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addFolder()}
                      className="w-full h-11 text-base"
                    />
                    <div className="flex gap-2">
                      <Button onClick={addFolder} className="flex-1">Create Folder</Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowFolderDialog(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {totalCount > 0 && (
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
            )}
          </div>

          {/* Active Tasks */}
          {activeTasks.length > 0 && (
            <section>
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Active · {activeTasks.length}
              </h2>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                {activeTasks.map((task) => {
                  const folderName = getFolderName(task.folderId);
                  const folderColor = getFolderColor(task.folderId);
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
                      className="flex items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-background/80 backdrop-blur-sm border border-border rounded-lg transition-colors duration-200 hover:shadow-sm hover:border-primary/20 group"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto hover:bg-transparent flex-shrink-0 mt-0.5 sm:mt-0"
                        onClick={() => toggleTask(task.id)}
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
                          {folderName && (
                            <span 
                              className="text-xs px-2 py-0.5 rounded-full text-foreground bg-accent"
                              style={{ backgroundColor: folderColor || undefined, color: folderColor ? '#0b1324' : undefined }}
                            >
                              {folderName}
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
                          onClick={() => navigate(`/focus?taskId=${task.id}&title=${encodeURIComponent(task.title)}&start=1`)}
                        >
                          <TimerIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                          Focus
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 sm:p-2 h-auto text-muted-foreground hover:text-primary"
                          aria-label="Edit task"
                          onClick={() => setEditingTask(task)}
                        >
                          <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 sm:p-2 h-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          aria-label="Delete task"
                          onClick={() => deleteTask(task.id)}
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
                    className="flex items-center gap-3 p-4 bg-muted/30 border border-border rounded-lg"
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
          {filteredTasks.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-0">
                <EmptyState
                  icon={Target}
                  title="No tasks yet"
                  description={selectedFolder !== null
                    ? "No tasks in this folder. Add one above to get started."
                    : "Add your first task above — type a due date, priority, or #tag and it'll be picked up automatically."}
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
            <div className="space-y-5 py-2">
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
                <label className="text-sm font-medium block text-foreground">Folder</label>
                <Select
                  value={editingTask.folderId || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, folderId: e.target.value || null })}
                  className="w-full"
                >
                  <option value="">No Folder</option>
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
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
                <Button 
                  onClick={() => {
                    if (!editingTask.title?.trim()) {
                      return;
                    }
                    
                    const updates = {
                      title: editingTask.title.trim(),
                      description: editingTask.description?.trim() || '',
                      priority: editingTask.priority || 'medium',
                      folderId: editingTask.folderId || null,
                      dueDate: editingTask.dueDate 
                        ? (editingTask.dueDate.includes('T') 
                            ? editingTask.dueDate.split('T')[0] 
                            : editingTask.dueDate)
                        : null
                    };
                    
                    const updated = updateTask(editingTask.id, updates);
                    if (updated) {
                      setEditingTask(null);
                    }
                  }}
                  className="flex-1"
                >
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
