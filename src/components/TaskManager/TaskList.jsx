import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Circle, Sparkles, Trophy } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { localStorageService } from '../../services/localStorage';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [justCompleted, setJustCompleted] = useState(null);

  // Load tasks on mount
  useEffect(() => {
    const savedTasks = localStorageService.getTasks();
    setTasks(savedTasks);
  }, []);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    const task = localStorageService.addTask({
      title: newTask,
      description: '',
      priority: 'medium'
    });
    
    setTasks(prev => [...prev, task]);
    setNewTask('');
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

        // Show celebration for completion
        if (updatedTask.completed) {
          setJustCompleted(taskId);
          setTimeout(() => setJustCompleted(null), 1000);
        }
      }
    }
  };

  const deleteTask = (taskId) => {
    localStorageService.deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  const completedCount = completedTasks.length;
  const totalCount = tasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getMotivationalMessage = () => {
    if (totalCount === 0) return "Your journey to productivity starts here! ✨";
    if (completionRate === 100) return "All done! You're absolutely crushing it! 🏆";
    if (completionRate >= 75) return "Almost there! Keep up the amazing work! 💪";
    if (completionRate >= 50) return "Great progress! You're on fire! 🔥";
    if (completionRate >= 25) return "Nice start! Keep the momentum going! 🚀";
    return "Let's tackle these tasks together! 💙";
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header Card */}
      <Card className="glass-card border-none animate-fade-in-up">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Your Priorities
              </CardTitle>
              <p className="text-muted-foreground">{getMotivationalMessage()}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{completionRate}%</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-sm text-muted-foreground">
            <span>{completedCount} completed</span>
            <span>{activeTasks.length} remaining</span>
          </div>
        </CardContent>
      </Card>

      {/* Add Task Card */}
      <Card className="glass-card border-none hover-lift animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <CardContent className="pt-6">
          <form onSubmit={addTask} className="flex gap-3">
            <div className="flex-1 relative">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="What would you like to accomplish?"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="pl-11 h-12 text-base"
              />
            </div>
            <Button type="submit" size="lg" className="px-6 rounded-full">
              <Plus className="h-5 w-5 mr-2" />
              Add Task
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <Card className="glass-card border-none animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Circle className="h-5 w-5 text-primary" />
              Active Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeTasks.map((task, index) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-4 bg-background/80 backdrop-blur-sm border border-border rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto hover:scale-110 transition-transform"
                  onClick={() => toggleTask(task.id)}
                >
                  <Circle className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
                </Button>
                
                <span className="flex-1 text-base font-medium">
                  {task.title}
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 h-auto text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-full transition-all"
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <Card className="glass-card border-none animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2 text-green-600">
              <Trophy className="h-5 w-5" />
              Completed ({completedTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl transition-all duration-300 ${
                  justCompleted === task.id ? 'animate-scale-in' : ''
                }`}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto"
                  onClick={() => toggleTask(task.id)}
                >
                  <CheckCircle className="h-6 w-6 text-green-600 animate-pulse" />
                </Button>
                
                <span className="flex-1 text-base text-muted-foreground line-through">
                  {task.title}
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 h-auto text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-full transition-all"
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
      {tasks.length === 0 && (
        <Card className="glass-card border-none text-center py-16 animate-fade-in-up">
          <CardContent>
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold mb-2 text-foreground">Ready to Get Started?</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Add your first task above and begin your journey to peak productivity!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskList;
