import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Timer, 
  CheckSquare, 
  Calendar,
  Clock,
  Target,
  Coffee,
  TrendingUp,
  BarChart3,
  Award,
  ArrowRight,
  Activity,
  FileText,
  BookOpen,
  Sparkles,
  Bell,
  Plus,
  Zap,
  Heart,
  Brain,
  Flame
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { localStorageService } from '../services/localStorage';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState({
    todayFocusTime: 0,
    todaySessions: 0,
    activeTasks: 0,
    completedTasks: 0,
    totalPomodoros: 0,
    totalNotes: 0,
    totalJournalEntries: 0,
    upcomingEvents: 0,
  });

  const [recentNotes, setRecentNotes] = useState([]);
  const [recentJournalEntries, setRecentJournalEntries] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);

  useEffect(() => {
    loadDashboardData();
    // Refresh data every minute
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = () => {
    // Load focus stats
    const sessions = localStorageService.getFocusSessions();
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(session => 
      new Date(session.date).toDateString() === today
    );
    
    // Load task stats
    const tasks = localStorageService.getTasks();
    const activeTasks = tasks.filter(task => !task.completed);
    const completedTasks = tasks.filter(task => task.completed);
    const recentTasksList = tasks
      .filter(task => !task.completed)
      .sort((a, b) => {
        const aDate = a.dueDate ? new Date(a.dueDate) : new Date(0);
        const bDate = b.dueDate ? new Date(b.dueDate) : new Date(0);
        return aDate - bDate;
      })
      .slice(0, 5);

    // Load timer state
    const timerState = localStorageService.getTimerState();
    const totalPomodoros = timerState ? timerState.pomodorosCompleted || 0 : 0;

    const todayFocusTime = todaySessions.reduce((total, session) => 
      total + (session.duration || 0), 0
    );

    // Load notes
    const notes = localStorageService.getNotes();
    const recentNotesList = notes
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 3);

    // Load journal entries
    const journalEntries = localStorageService.getJournalEntries();
    const recentJournalList = journalEntries
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);

    // Load upcoming events
    const events = localStorageService.getCalendarEvents();
    const now = new Date();
    const upcomingEventsList = events
      .filter(event => {
        if (!event.date) return false;
        const eventDate = new Date(event.date);
        if (event.time) {
          const [hours, minutes] = event.time.split(':').map(Number);
          eventDate.setHours(hours, minutes, 0, 0);
        }
        return eventDate >= now;
      })
      .sort((a, b) => {
        const aDate = new Date(a.date + (a.time ? `T${a.time}` : ''));
        const bDate = new Date(b.date + (b.time ? `T${b.time}` : ''));
        return aDate - bDate;
      })
      .slice(0, 5);

    setStats({
      todayFocusTime: Math.floor(todayFocusTime / 60), // in minutes
      todaySessions: todaySessions.length,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      totalPomodoros,
      totalNotes: notes.length,
      totalJournalEntries: journalEntries.length,
      upcomingEvents: upcomingEventsList.length,
    });

    setRecentNotes(recentNotesList);
    setRecentJournalEntries(recentJournalList);
    setUpcomingEvents(upcomingEventsList);
    setRecentTasks(recentTasksList);
  };

  // Generate chart data for last 7 days
  const chartData = useMemo(() => {
    const sessions = localStorageService.getFocusSessions();
    const tasks = localStorageService.getTasks();
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      
      const daySessions = sessions.filter(session => 
        new Date(session.date).toDateString() === dateStr
      );
      
      const dayTasks = tasks.filter(task => {
        const taskDate = task.completedAt ? new Date(task.completedAt) : null;
        return taskDate && taskDate.toDateString() === dateStr;
      });
      
      const focusTime = daySessions.reduce((total, session) => 
        total + (session.duration || 0), 0
      ) / 60; // Convert to minutes
      
      days.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        focusTime: Math.round(focusTime),
        pomodoros: daySessions.length,
        tasksCompleted: dayTasks.length
      });
    }
    
    return days;
  }, []);

  // Weekly summary data
  const weeklyStats = useMemo(() => {
    const sessions = localStorageService.getFocusSessions();
    const tasks = localStorageService.getTasks();
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    
    const weekSessions = sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= weekStart;
    });
    
    const weekTasks = tasks.filter(task => {
      if (!task.completed) return false;
      const completedDate = task.completedAt ? new Date(task.completedAt) : null;
      return completedDate && completedDate >= weekStart;
    });
    
    const totalFocusTime = weekSessions.reduce((total, session) => 
      total + (session.duration || 0), 0
    ) / 60;
    
    return {
      totalFocusTime: Math.round(totalFocusTime),
      totalSessions: weekSessions.length,
      totalTasks: weekTasks.length,
      avgDailyFocus: Math.round(totalFocusTime / 7)
    };
  }, []);

  // Task completion breakdown
  const taskBreakdown = useMemo(() => {
    const tasks = localStorageService.getTasks();
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    
    return [
      { name: 'Completed', value: completed, color: 'hsl(var(--primary))' },
      { name: 'Active', value: active, color: 'hsl(var(--muted-foreground))' }
    ];
  }, []);

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Focus Time' ? `${entry.value} min` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const completionRate = stats.activeTasks + stats.completedTasks > 0 
    ? Math.round((stats.completedTasks / (stats.activeTasks + stats.completedTasks)) * 100)
    : 0;

  const quickActions = [
    { name: 'Start Focus Session', icon: Timer, href: '/focus', color: 'bg-blue-500', description: 'Begin a focused work session' },
    { name: 'Manage Tasks', icon: CheckSquare, href: '/tasks', color: 'bg-green-500', description: 'Organize your to-do list' },
    { name: 'View Calendar', icon: Calendar, href: '/calendar', color: 'bg-orange-500', description: 'Plan your schedule' },
    { name: 'Write Note', icon: FileText, href: '/notes', color: 'bg-purple-500', description: 'Capture your thoughts' },
    { name: 'Journal Entry', icon: BookOpen, href: '/journal', color: 'bg-pink-500', description: 'Reflect on your day' },
    { name: 'View Analytics', icon: BarChart3, href: '/analytics', color: 'bg-indigo-500', description: 'Track your progress' },
  ];

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-5xl font-bold text-foreground mb-2">
                Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                Your productivity hub - Track, plan, and achieve more
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.name} to={action.href}>
                <Card className="glass-card border-none hover-lift group cursor-pointer transition-all h-full">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <div className={`h-14 w-14 rounded-xl ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground mb-1">{action.name}</h3>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <Card className="glass-card border-none hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Focus Today</CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">{formatTime(stats.todayFocusTime)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {stats.todaySessions} sessions
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-none hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Pomodoros</CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Coffee className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">{stats.totalPomodoros}</div>
              <p className="text-xs text-muted-foreground">Total completed</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-none hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Active Tasks</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckSquare className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">{stats.activeTasks}</div>
              <p className="text-xs text-muted-foreground">{completionRate}% done</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-none hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Completed</CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Award className="h-3 w-3" />
                Great work!
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-none hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Notes</CardTitle>
              <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">{stats.totalNotes}</div>
              <p className="text-xs text-muted-foreground">Total notes</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-none hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Journal</CardTitle>
              <div className="h-8 w-8 rounded-full bg-pink-500/10 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-pink-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">{stats.totalJournalEntries}</div>
              <p className="text-xs text-muted-foreground">Entries</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-none hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Events</CardTitle>
              <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">{stats.upcomingEvents}</div>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-none hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Weekly Focus</CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">{formatTime(weeklyStats.totalFocusTime)}</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Focus Time Chart */}
          <Card className="glass-card border-none lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Focus Time Trend (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorFocusTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="focusTime" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorFocusTime)"
                    name="Focus Time (min)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Task Breakdown */}
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Task Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={taskBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {taskBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2 text-center">
                <div className="text-3xl font-bold text-foreground">
                  {stats.completedTasks + stats.activeTasks}
                </div>
                <div className="text-sm text-muted-foreground">Total Tasks</div>
                <div className="flex justify-center gap-4 mt-3">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-primary">{stats.completedTasks}</div>
                    <div className="text-xs text-muted-foreground">Done</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-muted-foreground">{stats.activeTasks}</div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid - Recent Activity & Upcoming */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Tasks */}
          <Card className="glass-card border-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                Upcoming Tasks
              </CardTitle>
              <Link to="/tasks">
                <Button variant="ghost" size="sm" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentTasks.length > 0 ? (
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50 hover:bg-background/70 transition-colors">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground truncate">{task.title}</h4>
                        {task.dueDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {formatDate(task.dueDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No active tasks</p>
                  <Link to="/tasks">
                    <Button variant="outline" size="sm" className="mt-3 gap-2">
                      <Plus className="h-4 w-4" />
                      Add Task
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="glass-card border-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Events
              </CardTitle>
              <Link to="/calendar">
                <Button variant="ghost" size="sm" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50 hover:bg-background/70 transition-colors">
                      <div className="h-2 w-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground truncate">{event.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(event.date)}
                          {event.time && ` • ${event.time}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No upcoming events</p>
                  <Link to="/calendar">
                    <Button variant="outline" size="sm" className="mt-3 gap-2">
                      <Plus className="h-4 w-4" />
                      Add Event
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Notes & Journal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Notes */}
          <Card className="glass-card border-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Recent Notes
              </CardTitle>
              <Link to="/notes">
                <Button variant="ghost" size="sm" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentNotes.length > 0 ? (
                <div className="space-y-3">
                  {recentNotes.map((note) => (
                    <Link key={note.id} to="/notes">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50 hover:bg-background/70 transition-colors cursor-pointer">
                        {note.pinned && <Sparkles className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-foreground truncate">{note.title || 'Untitled Note'}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {note.content || 'No content'}
                          </p>
                          {note.tags && note.tags.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {note.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No notes yet</p>
                  <Link to="/notes">
                    <Button variant="outline" size="sm" className="mt-3 gap-2">
                      <Plus className="h-4 w-4" />
                      Create Note
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Journal Entries */}
          <Card className="glass-card border-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Recent Journal Entries
              </CardTitle>
              <Link to="/journal">
                <Button variant="ghost" size="sm" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentJournalEntries.length > 0 ? (
                <div className="space-y-3">
                  {recentJournalEntries.map((entry) => (
                    <Link key={entry.id} to="/journal">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50 hover:bg-background/70 transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm text-foreground">
                              {formatDate(entry.date)}
                            </h4>
                            {entry.mood && (
                              <span className="text-xs px-2 py-0.5 bg-pink-500/10 text-pink-500 rounded-full capitalize">
                                {entry.mood}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {entry.content || 'No content'}
                          </p>
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {entry.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="text-xs px-2 py-0.5 bg-pink-500/10 text-pink-500 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No journal entries yet</p>
                  <Link to="/journal">
                    <Button variant="outline" size="sm" className="mt-3 gap-2">
                      <Plus className="h-4 w-4" />
                      Write Entry
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Weekly Summary */}
        <Card className="glass-card border-none mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Weekly Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="text-2xl font-bold text-primary mb-1">
                  {formatTime(weeklyStats.totalFocusTime)}
                </div>
                <div className="text-sm text-muted-foreground">Total Focus Time</div>
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="text-2xl font-bold text-primary mb-1">
                  {weeklyStats.totalSessions}
                </div>
                <div className="text-sm text-muted-foreground">Total Sessions</div>
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="text-2xl font-bold text-primary mb-1">
                  {formatTime(weeklyStats.avgDailyFocus)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Daily Focus</div>
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="text-2xl font-bold text-primary mb-1">
                  {weeklyStats.totalTasks}
                </div>
                <div className="text-sm text-muted-foreground">Tasks Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
