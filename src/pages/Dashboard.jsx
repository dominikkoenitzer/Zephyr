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
  FileText,
  BookOpen,
  ArrowRight,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { localStorageService } from '../services/localStorage';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState({
    todayFocusTime: 0,
    todaySessions: 0,
    activeTasks: 0,
    completedTasks: 0,
    totalPomodoros: 0,
  });

  const [recentTasks, setRecentTasks] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = () => {
    const sessions = localStorageService.getFocusSessions();
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(session => 
      new Date(session.date).toDateString() === today
    );
    
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

    const timerState = localStorageService.getTimerState();
    const totalPomodoros = timerState ? timerState.pomodorosCompleted || 0 : 0;

    const todayFocusTime = todaySessions.reduce((total, session) => 
      total + (session.duration || 0), 0
    );

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
      todayFocusTime: Math.floor(todayFocusTime / 60),
      todaySessions: todaySessions.length,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      totalPomodoros,
    });

    setRecentTasks(recentTasksList);
    setUpcomingEvents(upcomingEventsList);
  };

  const chartData = useMemo(() => {
    const sessions = localStorageService.getFocusSessions();
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      
      const daySessions = sessions.filter(session => 
        new Date(session.date).toDateString() === dateStr
      );
      
      const focusTime = daySessions.reduce((total, session) => 
        total + (session.duration || 0), 0
      ) / 60;
      
      days.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        focusTime: Math.round(focusTime),
      });
    }
    
    return days;
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

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded p-2 shadow-sm">
          <p className="text-sm text-foreground">{payload[0].value} min</p>
        </div>
      );
    }
    return null;
  };

  const quickActions = [
    { name: 'Focus Timer', icon: Timer, href: '/focus' },
    { name: 'Tasks', icon: CheckSquare, href: '/tasks' },
    { name: 'Calendar', icon: Calendar, href: '/calendar' },
    { name: 'Notes', icon: FileText, href: '/notes' },
    { name: 'Journal', icon: BookOpen, href: '/journal' },
    { name: 'Analytics', icon: BarChart3, href: '/analytics' },
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-1">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.name} to={action.href}>
                <Card className="border hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="flex flex-col items-center justify-center p-4">
                    <Icon className="h-5 w-5 text-muted-foreground mb-2" />
                    <span className="text-xs text-foreground text-center">{action.name}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Focus Today</span>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-semibold text-foreground">{formatTime(stats.todayFocusTime)}</div>
              <div className="text-xs text-muted-foreground mt-1">{stats.todaySessions} sessions</div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Pomodoros</span>
                <Coffee className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-semibold text-foreground">{stats.totalPomodoros}</div>
              <div className="text-xs text-muted-foreground mt-1">Total</div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Active Tasks</span>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-semibold text-foreground">{stats.activeTasks}</div>
              <div className="text-xs text-muted-foreground mt-1">{stats.completedTasks} completed</div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Completion</span>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-semibold text-foreground">
                {stats.activeTasks + stats.completedTasks > 0 
                  ? Math.round((stats.completedTasks / (stats.activeTasks + stats.completedTasks)) * 100)
                  : 0}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">Task rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Focus Chart */}
          <Card className="border lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Focus Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="focusTime" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={1.5}
                    fill="url(#colorFocus)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card className="border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-medium">Upcoming Tasks</CardTitle>
              <Link to="/tasks">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  View all
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentTasks.length > 0 ? (
                <div className="space-y-2">
                  {recentTasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="flex items-start gap-2 py-2 border-b border-border last:border-0">
                      <CheckSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{task.title}</p>
                        {task.dueDate && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(task.dueDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">No active tasks</p>
                  <Link to="/tasks">
                    <Button variant="outline" size="sm" className="text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      Add task
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <Card className="border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-medium">Upcoming Events</CardTitle>
              <Link to="/calendar">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  View all
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-2">
                  {upcomingEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-start gap-2 py-2 border-b border-border last:border-0">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(event.date)}
                          {event.time && ` • ${event.time}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">No upcoming events</p>
                  <Link to="/calendar">
                    <Button variant="outline" size="sm" className="text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      Add event
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Summary */}
          <Card className="border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
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

                  return (
                    <>
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Focus Time</span>
                        <span className="text-sm font-medium text-foreground">{formatTime(Math.round(totalFocusTime))}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Sessions</span>
                        <span className="text-sm font-medium text-foreground">{weekSessions.length}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-muted-foreground">Tasks Completed</span>
                        <span className="text-sm font-medium text-foreground">{weekTasks.length}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
