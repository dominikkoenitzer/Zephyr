import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, CheckCircle, Circle, ListTodo, Target, TrendingUp, 
  Folder, FolderPlus, Edit2, Calendar, Tag, ArrowUpDown, 
  X, Filter, Flag
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { DatePicker } from '../ui/date-picker';
import { Select } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { localStorageService } from '../../services/localStorage';

const PRIORITY_COLORS = {
  high: 'text-red-500',
  medium: 'text-yellow-500',
  low: 'text-blue-500'
};

const PRIORITY_LABELS = {
  high: 'High',
  medium: 'Medium',
  low: 'Low'
};

const SORT_OPTIONS = [
  { value: 'date', label: 'Date Created' },
  { value: 'priority', label: 'Priority' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'title', label: 'Title' },
  { value: 'status', label: 'Status' }
];

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showCompleted, setShowCompleted] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');

  // Load tasks and folders on mount
  useEffect(() => {
    const savedTasks = localStorageService.getTasks();
    const savedFolders = localStorageService.getFolders();
    setTasks(savedTasks);
    setFolders(savedFolders);
  }, []);

  // Save tasks whenever they change
  useEffect(() => {
    if (tasks.length > 0 || localStorageService.getTasks().length > 0) {
      localStorageService.saveTasks(tasks);
    }
  }, [tasks]);

  // Save folders whenever they change
  useEffect(() => {
    if (folders.length > 0 || localStorageService.getFolders().length > 0) {
      localStorageService.saveFolders(folders);
    }
  }, [folders]);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    const task = localStorageService.addTask({
      title: newTask,
      description: '',
      priority: 'medium',
      folderId: selectedFolder
    });
    
    setTasks(prev => [...prev, task]);
    setNewTask('');
    setEditingTask(task);
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
        setTasks(prev => prev.map(t => 
          t.id === taskId ? updatedTask : t
        ));
      }
    }
  };

  const deleteTask = (taskId) => {
    localStorageService.deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const updateTask = (taskId, updates) => {
    const updatedTask = localStorageService.updateTask(taskId, updates);
    if (updatedTask) {
      setTasks(prev => prev.map(t => 
        t.id === taskId ? updatedTask : t
      ));
    }
  };

  const deleteFolder = (folderId) => {
    localStorageService.deleteFolder(folderId);
    setFolders(prev => prev.filter(f => f.id !== folderId));
    if (selectedFolder === folderId) {
      setSelectedFolder(null);
    }
    // Reload tasks to update folder references
    setTasks(localStorageService.getTasks());
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      // Filter by folder
      if (selectedFolder !== null) {
        if (selectedFolder === 'none') {
          if (task.folderId !== null) return false;
        } else {
          if (task.folderId !== selectedFolder) return false;
        }
      }
      
      // Filter by completion status
      if (!showCompleted && task.completed) return false;
      
      // Filter by priority
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      
      return true;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'priority': {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          break;
        }
        case 'dueDate': {
          const dateA = a.dueDate ? new Date(a.dueDate) : new Date(0);
          const dateB = b.dueDate ? new Date(b.dueDate) : new Date(0);
          comparison = dateA - dateB;
          break;
        }
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = (a.completed ? 1 : 0) - (b.completed ? 1 : 0);
          break;
        case 'date':
        default: {
          const createdA = new Date(a.createdAt || 0);
          const createdB = new Date(b.createdAt || 0);
          comparison = createdA - createdB;
          break;
        }
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [tasks, selectedFolder, showCompleted, sortBy, sortOrder, filterPriority]);

  const activeTasks = filteredAndSortedTasks.filter(task => !task.completed);
  const completedTasks = filteredAndSortedTasks.filter(task => task.completed);
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Card */}
      <Card className="glass-card border-none animate-fade-in-up">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold mb-2 text-foreground">
                Task Manager
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                {totalCount > 0 
                  ? `${completedCount} of ${totalCount} tasks completed (${completionRate}%)`
                  : "Your journey to productivity starts here"}
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{completionRate}%</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Folders & Filters */}
        <div className="space-y-4">
          {/* Folders */}
          <Card className="glass-card border-none">
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
          <Card className="glass-card border-none">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Filter className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">Filters & Sort</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sort */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  Sort By
                </label>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-full h-12 rounded-xl border-2 font-semibold hover:border-primary hover:bg-primary/5 hover:text-primary transition-all"
              >
                <ArrowUpDown className="h-5 w-5 mr-2" />
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </Button>

              {/* Priority Filter */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Flag className="h-4 w-4 text-muted-foreground" />
                  Priority
                </label>
                <Select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Select>
              </div>

              {/* Show Completed */}
              <div className="pt-4 border-t-2 border-border">
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Add Task Card */}
          <Card className="glass-card border-none hover-lift">
            <CardContent className="pt-6">
              <form onSubmit={addTask} className="flex gap-3">
                <div className="flex-1 relative">
                  <ListTodo className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="What would you like to accomplish?"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    className="pl-11 h-12 text-base"
                  />
                </div>
                <Button type="submit" size="lg" className="px-6">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Task
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Active Tasks */}
          {activeTasks.length > 0 && (
            <Card className="glass-card border-none">
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
                      className="flex items-center gap-3 p-4 bg-background/80 backdrop-blur-sm border border-border rounded-lg transition-all duration-200 hover:shadow-sm hover:border-primary/20 group"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto hover:bg-transparent"
                        onClick={() => toggleTask(task.id)}
                      >
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                      </Button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-medium text-foreground">
                            {task.title}
                          </span>
                          {task.priority && (
                            <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                              <Flag className="h-3 w-3 inline mr-1" />
                              {PRIORITY_LABELS[task.priority]}
                            </span>
                          )}
                          {folderName && (
                            <span 
                              className="text-xs px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: folderColor || '#3b82f6' }}
                            >
                              {folderName}
                            </span>
                          )}
                          {dueDate && (
                            <span className={`text-xs flex items-center gap-1 ${overdue ? 'text-red-500' : 'text-muted-foreground'}`}>
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
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 h-auto text-muted-foreground hover:text-primary"
                          onClick={() => setEditingTask(task)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 h-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
            <Card className="glass-card border-none">
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
          {filteredAndSortedTasks.length === 0 && (
            <Card className="glass-card border-none text-center py-16">
              <CardContent>
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Target className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">No Tasks Found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {selectedFolder !== null 
                    ? "No tasks in this folder. Add a new task to get started."
                    : "Add your first task above and begin your journey to peak productivity"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Task Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="sm:max-w-md">
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
                <DatePicker
                  value={editingTask.dueDate ? editingTask.dueDate.split('T')[0] : ''}
                  onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value || null })}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    const updates = {
                      title: editingTask.title,
                      description: editingTask.description || '',
                      priority: editingTask.priority || 'medium',
                      folderId: editingTask.folderId || null,
                      dueDate: editingTask.dueDate ? (editingTask.dueDate.includes('T') ? editingTask.dueDate : new Date(editingTask.dueDate + 'T00:00:00').toISOString()) : null
                    };
                    updateTask(editingTask.id, updates);
                    setEditingTask(null);
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
