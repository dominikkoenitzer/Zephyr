import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Timer, 
  CheckSquare, 
  Calendar,
  Play,
  Clock,
  Target,
  Coffee,
  Sparkles,
  TrendingUp,
  BarChart3,
  Flame,
  Award,
  ArrowRight,
  Activity
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { localStorageService } from '../services/localStorage';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Motivational quotes that change daily
const motivationalQuotes = [
  { text: "Every accomplishment starts with the decision to try.", author: "John F. Kennedy" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Small steps every day lead to big results.", author: "Anonymous" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Your limitation—it's only your imagination.", author: "Anonymous" },
  { text: "Great things never come from comfort zones.", author: "Anonymous" },
];

// Get daily quote based on the day of year
const getDailyQuote = () => {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  return motivationalQuotes[dayOfYear % motivationalQuotes.length];
};

function Dashboard() {
  const [stats, setStats] = useState({
    todayFocusTime: 0,
    todaySessions: 0,
    activeTasks: 0,
    completedTasks: 0,
    totalPomodoros: 0,
    currentStreak: 0
  });

  const [dailyQuote] = useState(getDailyQuote());

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

    // Load timer state
    const timerState = localStorageService.getTimerState();
    const totalPomodoros = timerState ? timerState.pomodorosCompleted || 0 : 0;
    const currentStreak = timerState ? timerState.sessionStreak || 0 : 0;

    const todayFocusTime = todaySessions.reduce((total, session) => 
      total + (session.duration || 0), 0
    );

    setStats({
      todayFocusTime: Math.floor(todayFocusTime / 60), // in minutes
      todaySessions: todaySessions.length,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      totalPomodoros,
      currentStreak
    });
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

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                Track your productivity and stay focused
              </p>
            </div>
            <Button asChild size="lg" className="gap-2">
              <Link to="/focus">
                <Play className="h-4 w-4" />
                Start Session
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card border-none hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Focus Time Today</CardTitle>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-1">{formatTime(stats.todayFocusTime)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {stats.todaySessions} sessions
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-none hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Pomodoros</CardTitle>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Coffee className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-1">{stats.totalPomodoros}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Flame className="h-3 w-3 text-orange-500" />
                {stats.currentStreak} day streak
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-none hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Tasks</CardTitle>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-1">{stats.activeTasks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeTasks > 0 ? `${completionRate}% completed` : 'All done'}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-none hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed Tasks</CardTitle>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-1">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Award className="h-3 w-3" />
                Great progress
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Focus Time Trend */}
          <Card className="glass-card border-none lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Focus Time Trend
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
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={taskBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
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
                <div className="text-2xl font-bold text-foreground">
                  {stats.completedTasks + stats.activeTasks}
                </div>
                <div className="text-sm text-muted-foreground">Total Tasks</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity & Weekly Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Activity */}
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Daily Activity (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
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
                  <Legend />
                  <Bar 
                    dataKey="pomodoros" 
                    fill="hsl(var(--primary))" 
                    name="Pomodoros"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar 
                    dataKey="tasksCompleted" 
                    fill="hsl(var(--accent-foreground))" 
                    name="Tasks"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly Summary */}
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Weekly Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {formatTime(weeklyStats.totalFocusTime)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Focus Time</div>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {weeklyStats.totalSessions}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Sessions</div>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {formatTime(weeklyStats.avgDailyFocus)}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Daily Focus</div>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {weeklyStats.totalTasks}
                    </div>
                    <div className="text-sm text-muted-foreground">Tasks Completed</div>
                  </div>
                </div>
                
                {/* Daily Quote */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1 italic">
                        &ldquo;{dailyQuote.text}&rdquo;
                      </p>
                      <p className="text-xs text-muted-foreground">
                        — {dailyQuote.author}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card border-none hover-lift group cursor-pointer transition-all">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Timer className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Start Focus Session</h3>
                <p className="text-sm text-muted-foreground">Begin a focused work session</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
            <Link to="/focus" className="absolute inset-0" />
          </Card>

          <Card className="glass-card border-none hover-lift group cursor-pointer transition-all">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckSquare className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Manage Tasks</h3>
                <p className="text-sm text-muted-foreground">Organize your to-do list</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
            <Link to="/tasks" className="absolute inset-0" />
          </Card>

          <Card className="glass-card border-none hover-lift group cursor-pointer transition-all">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">View Calendar</h3>
                <p className="text-sm text-muted-foreground">Plan your schedule</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
            <Link to="/calendar" className="absolute inset-0" />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
