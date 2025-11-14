import { useState, useEffect } from 'react';
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
  TrendingUp
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { localStorageService } from '../services/localStorage';

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

        {/* Quick Actions */}
        <h2 className="text-2xl font-semibold mb-6 text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
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
