import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Timer, 
  CheckSquare, 
  Calendar,
  Play,
  Plus,
  Clock,
  Target,
  Coffee,
  Sparkles,
  TrendingUp,
  BarChart3
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
  Legend
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

// Dynamic greeting based on time of day
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return { text: "Good morning", subtext: "Ready to start your day" };
  } else if (hour >= 12 && hour < 17) {
    return { text: "Good afternoon", subtext: "Keep that momentum going" };
  } else if (hour >= 17 && hour < 22) {
    return { text: "Good evening", subtext: "Time to wind down and reflect" };
  } else {
    return { text: "Late night session", subtext: "Remember to rest" };
  }
};

function Dashboard() {
  const [stats, setStats] = useState({
    todayFocusTime: 0,
    todaySessions: 0,
    activeTasks: 0,
    completedTasks: 0,
    totalPomodoros: 0
  });

  const [greeting, setGreeting] = useState(getTimeBasedGreeting());
  const [dailyQuote] = useState(getDailyQuote());

  useEffect(() => {
    loadDashboardData();
    // Update greeting every minute
    const interval = setInterval(() => {
      setGreeting(getTimeBasedGreeting());
    }, 60000);
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

    const todayFocusTime = todaySessions.reduce((total, session) => 
      total + (session.duration || 0), 0
    );

    setStats({
      todayFocusTime: Math.floor(todayFocusTime / 60), // in minutes
      todaySessions: todaySessions.length,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      totalPomodoros
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

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getMotivationalMessage = () => {
    if (stats.totalPomodoros === 0) {
      return "Start your first focus session";
    } else if (stats.totalPomodoros < 5) {
      return "Building momentum";
    } else if (stats.totalPomodoros < 20) {
      return "Great progress";
    } else {
      return "Excellent consistency";
    }
  };

  const getTasksMessage = () => {
    if (stats.activeTasks === 0) {
      return "All tasks completed";
    } else if (stats.activeTasks < 5) {
      return `${stats.activeTasks} to tackle`;
    } else {
      return `${stats.activeTasks} on your plate`;
    }
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

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Hero Greeting Section */}
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-5xl font-bold mb-3 text-foreground">
            {greeting.text}
          </h1>
          <p className="text-muted-foreground text-xl mb-6">
            {greeting.subtext}
          </p>
          
          {/* Daily Quote Card */}
          <Card className="glass-card hover-lift border-none max-w-2xl">
            <CardContent className="py-6">
              <div className="flex items-start gap-3">
                <Sparkles className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-lg font-medium text-foreground mb-2 italic">
                    &ldquo;{dailyQuote.text}&rdquo;
                  </p>
                  <p className="text-sm text-muted-foreground">
                    — {dailyQuote.author}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Card className="glass-card hover-lift border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Focus Time Today</CardTitle>
              <Clock className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{formatTime(stats.todayFocusTime)}</div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {stats.todaySessions} sessions completed
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Pomodoros</CardTitle>
              <Coffee className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalPomodoros}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {getMotivationalMessage()}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Tasks</CardTitle>
              <CheckSquare className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.activeTasks}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {getTasksMessage()}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed Tasks</CardTitle>
              <Target className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.completedTasks > 0 ? "Great work" : "Let's get started"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {/* Focus Time Trend */}
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Focus Time Trend (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorFocusTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="focusTime" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1}
                    fill="url(#colorFocusTime)"
                    name="Focus Time"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pomodoros & Tasks */}
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Daily Activity (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="pomodoros" 
                    fill="hsl(var(--primary))" 
                    name="Pomodoros"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar 
                    dataKey="tasksCompleted" 
                    fill="hsl(var(--accent-foreground))" 
                    name="Tasks Completed"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Summary */}
        <Card className="glass-card border-none mb-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Weekly Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {formatTime(weeklyStats.totalFocusTime)}
                </div>
                <div className="text-sm text-muted-foreground">Total Focus Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {weeklyStats.totalSessions}
                </div>
                <div className="text-sm text-muted-foreground">Total Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {formatTime(weeklyStats.avgDailyFocus)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Daily Focus</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {weeklyStats.totalTasks}
                </div>
                <div className="text-sm text-muted-foreground">Tasks Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <h2 className="text-2xl font-semibold mb-6 text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Card className="glass-card hover-lift border-none group cursor-pointer transition-all duration-300">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <div className="rounded-lg bg-primary p-4 mb-4 group-hover:scale-105 transition-transform">
                <Timer className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Start Focus Session</h3>
              <p className="text-muted-foreground text-center mb-6 text-sm">
                Begin a focused 25-minute session
              </p>
              <Button asChild className="px-6">
                <Link to="/focus">
                  <Play className="h-4 w-4 mr-2" />
                  Start Session
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift border-none group cursor-pointer transition-all duration-300">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <div className="rounded-lg bg-primary p-4 mb-4 group-hover:scale-105 transition-transform">
                <CheckSquare className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Manage Tasks</h3>
              <p className="text-muted-foreground text-center mb-6 text-sm">
                Organize and manage your tasks
              </p>
              <Button asChild variant="outline" className="px-6">
                <Link to="/tasks">
                  <Plus className="h-4 w-4 mr-2" />
                  Manage Tasks
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift border-none group cursor-pointer transition-all duration-300">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <div className="rounded-lg bg-primary p-4 mb-4 group-hover:scale-105 transition-transform">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">View Calendar</h3>
              <p className="text-muted-foreground text-center mb-6 text-sm">
                Schedule and plan your activities
              </p>
              <Button asChild variant="outline" className="px-6">
                <Link to="/calendar">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Calendar
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
