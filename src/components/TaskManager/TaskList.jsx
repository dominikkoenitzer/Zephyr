import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Trash2, CheckCircle, Circle, ListTodo, Target, TrendingUp,
  Folder, FolderPlus, Edit2, Calendar, Tag, Flag,
  X, Timer as TimerIcon, CalendarClock, Sparkles
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { CalendarPicker } from '../ui/calendar-picker';
import { Select } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
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
  const [todayFolderId, setTodayFolderId] = useState(null);
  const [hasCreatedToday, setHasCreatedToday] = useState(false);
  const newTaskInputRef = useRef(null);

// Load tasks and folders on mount
  useEffect(() => {
    const savedTasks = localStorageService.getTasks();
    const savedFolders = localStorageService.getFolders();
    setTasks(savedTasks);
    setFolders(savedFolders);
    
    // Ensure a default "Today" folder exists to guide new users
    if (savedFolders.length === 0 && !hasCreatedToday) {
      const today = localStorageService.addFolder({ name: 'Today', color: '#38bdf8' });
      setFolders([today]);
      setTodayFolderId(today.id);
      setSelectedFolder(today.id);
      setHasCreatedToday(true);
    } else {
      const existingToday = savedFolders.find(f => f.name?.toLowerCase() === 'today');
      if (existingToday) {
        setTodayFolderId(existingToday.id);
      }
    }
  }, [hasCreatedToday]);


  // Save folders whenever they change
  useEffect(() => {
    if (folders.length > 0 || localStorageService.getFolders().length > 0) {
      localStorageService.saveFolders(folders);
    }
  }, [folders]);

  // Pick requested folder from query params (e.g., ?folder=today)
  useEffect(() => {
    const folderParam = searchParams.get('folder') || searchParams.get('t');
    if (folderParam) {
      if (folderParam === 'today' && todayFolderId) {
        setSelectedFolder(todayFolderId);
      } else {
        const match = folders.find(f => f.id === folderParam);
        if (match) {
          setSelectedFolder(match.id);
        }
      }
    }
  }, [searchParams, folders, todayFolderId]);

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

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (selectedFolder !== null) {
        if (selectedFolder === 'none') {
          if (task.folderId !== null) return false;
        } else if (task.folderId !== selectedFolder) {
          return false;
        }
      }
      if (!showCompleted && task.completed) return false;
      return true;
    });
  }, [tasks, selectedFolder, showCompleted]);

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
    <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6">
      {/* Progress summary */}
      <Card className="border border-border/60 bg-card/90 rounded-2xl shadow-sm animate-fade-in-up">
        <CardContent className="pt-5 sm:pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-6">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{totalCount - completedCount}</div>
                <div className="text-xs text-muted-foreground mt-1">Active</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{completedCount}</div>
                <div className="text-xs text-muted-foreground mt-1">Completed</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl sm:text-4xl font-bold text-primary leading-none">{completionRate}%</div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wide mt-1">Complete</div>
            </div>
          </div>
          <div
            className="mt-4 w-full h-2 bg-muted rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={completionRate}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Tasks completed"
          >
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Sidebar - Folders & Filters */}
        <div className="space-y-3 sm:space-y-4 order-2 lg:order-1">
          {/* Folders */}
          <Card className="border border-border/60 bg-card/90 rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  Folders
                </CardTitle>
                <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <FolderPlus className="h-4 w-4" />
                    </Button>
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
            </CardHeader>
            <CardContent className="space-y-1">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedFolder === null 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'hover:bg-accent/50 text-muted-foreground'
                }`}
              >
                All Tasks
              </button>
              <button
                onClick={() => setSelectedFolder('none')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedFolder === 'none' 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'hover:bg-accent/50 text-muted-foreground'
                }`}
              >
                No Folder
              </button>
              {folders.map((folder) => (
                <div key={folder.id} className="flex items-center group">
                  <button
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedFolder === folder.id 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'hover:bg-accent/50 text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: folder.color }}
                      />
                      <span>{folder.name}</span>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteFolder(folder.id)}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Filters & Sort */}
          <Card className="border border-border/60 bg-card/90 rounded-2xl shadow-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">Display</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-semibold text-foreground">Show Completed</label>
                </div>
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 ${
                    showCompleted ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-muted-foreground/20'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                      showCompleted ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6 order-1 lg:order-2">
          {/* Add Task Card */}
          <Card className="border border-border/60 bg-card/90 rounded-2xl shadow-sm hover-lift">
            <CardContent className="pt-4 sm:pt-6">
              <form onSubmit={addTask} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex-1 relative">
                  <ListTodo className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  <Input
                    ref={newTaskInputRef}
                    placeholder="Add a task…"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    className="pl-10 sm:pl-11 h-10 sm:h-12 text-sm sm:text-base"
                    aria-label="Add a task"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full sm:w-auto px-4 sm:px-6 h-10 sm:h-12">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                  <span className="text-sm sm:text-base">Add Task</span>
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
            </CardContent>
          </Card>

          {/* Active Tasks */}
          {activeTasks.length > 0 && (
            <Card className="border border-border/60 bg-card/90 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Active Tasks ({activeTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeTasks.map((task) => {
                  const folderName = getFolderName(task.folderId);
                  const folderColor = getFolderColor(task.folderId);
                  const dueDate = formatDate(task.dueDate);
                  const overdue = isOverdue(task.dueDate);
                  
                  return (
                    <div
                      key={task.id}
                      className="flex items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-background/80 backdrop-blur-sm border border-border rounded-lg transition-all duration-200 hover:shadow-sm hover:border-primary/20 group"
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
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && showCompleted && (
            <Card className="border border-border/60 bg-card/90 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2 text-green-600 dark:text-green-500">
                  <CheckCircle className="h-5 w-5" />
                  Completed ({completedTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
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
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {filteredTasks.length === 0 && (
            <Card className="border border-border/60 bg-card/90 rounded-2xl shadow-sm">
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
        </div>
      </div>

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
