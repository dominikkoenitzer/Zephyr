import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Timer, 
  CheckSquare, 
  Calendar,
  Clock,
  Target,
  Coffee,
  FileText,
  BookOpen,
  Plus,
  TrendingUp
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
  const navigate = useNavigate();
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
    try {
      const sessions = localStorageService.getFocusSessions() || [];
      const today = new Date().toDateString();
      const todaySessions = sessions.filter(session => {
        try {
          return session && session.date && new Date(session.date).toDateString() === today;
        } catch {
          return false;
        }
      });
      
      const tasks = localStorageService.getTasks() || [];
      const activeTasks = tasks.filter(task => !task.completed);
      const completedTasks = tasks.filter(task => task.completed);
      const recentTasksList = tasks
        .filter(task => !task.completed)
        .sort((a, b) => {
          try {
            const aDate = a.dueDate ? new Date(a.dueDate) : new Date(0);
            const bDate = b.dueDate ? new Date(b.dueDate) : new Date(0);
            return aDate - bDate;
          } catch {
            return 0;
          }
        })
        .slice(0, 5);

      const timerState = localStorageService.getTimerState();
      const totalPomodoros = timerState ? timerState.pomodorosCompleted || 0 : 0;

      const todayFocusTime = todaySessions.reduce((total, session) => 
        total + (session?.duration || 0), 0
      );

      const events = localStorageService.getCalendarEvents() || [];
      const now = new Date();
      const upcomingEventsList = events
        .filter(event => {
          try {
            if (!event || !event.date) return false;
            const eventDate = new Date(event.date);
            if (event.time) {
              const [hours, minutes] = event.time.split(':').map(Number);
              eventDate.setHours(hours, minutes, 0, 0);
            }
            return eventDate >= now;
          } catch {
            return false;
          }
        })
        .sort((a, b) => {
          try {
            const aDate = new Date(a.date + (a.time ? `T${a.time}` : ''));
            const bDate = new Date(b.date + (b.time ? `T${b.time}` : ''));
            return aDate - bDate;
          } catch {
            return 0;
          }
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
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setStats({
        todayFocusTime: 0,
        todaySessions: 0,
        activeTasks: 0,
        completedTasks: 0,
        totalPomodoros: 0,
      });
      setRecentTasks([]);
      setUpcomingEvents([]);
    }
  };

  const chartData = useMemo(() => {
    try {
      const sessions = localStorageService.getFocusSessions() || [];
      const days = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        
        const daySessions = sessions.filter(session => {
          try {
            return session && session.date && new Date(session.date).toDateString() === dateStr;
          } catch {
            return false;
          }
        });
        
        const focusTime = daySessions.reduce((total, session) => 
          total + (session?.duration || 0), 0
        ) / 60;
        
        days.push({
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          focusTime: Math.round(focusTime) || 0,
        });
      }
      
      return days;
    } catch (error) {
      console.error('Error generating chart data:', error);
      return Array.from({ length: 7 }, (_, i) => ({
        name: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        focusTime: 0,
      }));
    }
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
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{payload[0].value} min</p>
        </div>
      );
    }
    return null;
  };

  const quickActions = [
    { name: 'Focus Timer', icon: Timer, href: '/focus', color: 'text-blue-500' },
    { name: 'Tasks', icon: CheckSquare, href: '/tasks', color: 'text-green-500' },
    { name: 'Calendar', icon: Calendar, href: '/calendar', color: 'text-purple-500' },
    { name: 'Notes', icon: FileText, href: '/notes', color: 'text-orange-500' },
    { name: 'Journal', icon: BookOpen, href: '/journal', color: 'text-pink-500' },
  ];

  const completionRate = stats.activeTasks + stats.completedTasks > 0 
    ? Math.round((stats.completedTasks / (stats.activeTasks + stats.completedTasks)) * 100)
    : 0;

  return (
    <div className="w-full h-full lg:max-h-full lg:h-full space-y-2 sm:space-y-3 md:space-y-4 border-2 border-border rounded-xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 bg-card lg:overflow-hidden overflow-y-auto lg:overflow-y-hidden flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex-shrink-0">
        <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.name} to={action.href} className="block">
                <Card className="border hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer group h-full">
                  <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 h-full">
                    <div className={`mb-2 sm:mb-3 p-2 sm:p-3 rounded-lg bg-accent/50 group-hover:bg-accent transition-colors ${action.color}`}>
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-foreground text-center">{action.name}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="flex-shrink-0">
        <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">Today&apos;s Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Focus Time</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{formatTime(stats.todayFocusTime)}</p>
                <p className="text-xs text-muted-foreground">{stats.todaySessions} session{stats.todaySessions !== 1 ? 's' : ''}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 rounded-lg bg-orange-500/10">
                  <Coffee className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Pomodoros</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{stats.totalPomodoros}</p>
                <p className="text-xs text-muted-foreground">Total completed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10">
                  <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Active Tasks</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{stats.activeTasks}</p>
                <p className="text-xs text-muted-foreground">{stats.completedTasks} completed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/10">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{completionRate}%</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Task completion
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 min-h-0">
        {/* Focus Chart */}
        <Card className="border lg:col-span-2">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold">Weekly Focus Time</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Your focus sessions over the past 7 days</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="focusTime" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#colorFocus)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between pb-3 sm:pb-4">
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold">Upcoming Tasks</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Your next priorities</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
              onClick={() => navigate('/tasks')}
            >
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {recentTasks.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {recentTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-foreground truncate">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                          {formatDate(task.dueDate)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <CheckSquare className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mx-auto mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">No active tasks</p>
                <Link to="/tasks">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Add task
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="flex-shrink-0 grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
        {/* Upcoming Events */}
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between pb-3 sm:pb-4">
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold">Upcoming Events</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">What&apos;s coming up</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
              onClick={() => navigate('/calendar')}
            >
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {upcomingEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-foreground truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                        {formatDate(event.date)}
                        {event.time && ` • ${event.time}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mx-auto mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">No upcoming events</p>
                <Link to="/calendar">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Add event
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <Card className="border">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold">This Week</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Your weekly progress summary</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {(() => {
                const sessions = localStorageService.getFocusSessions() || [];
                const tasks = localStorageService.getTasks() || [];
                const today = new Date();
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - 6);
                
                const weekSessions = sessions.filter(session => {
                  try {
                    const sessionDate = new Date(session.date);
                    return sessionDate >= weekStart;
                  } catch {
                    return false;
                  }
                });
                
                const weekTasks = tasks.filter(task => {
                  if (!task.completed) return false;
                  try {
                    const completedDate = task.completedAt ? new Date(task.completedAt) : null;
                    return completedDate && completedDate >= weekStart;
                  } catch {
                    return false;
                  }
                });
                
                const totalFocusTime = weekSessions.reduce((total, session) => 
                  total + (session.duration || 0), 0
                ) / 60;

                return (
                  <>
                    <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-accent/30">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                        <span className="text-xs sm:text-sm font-medium text-foreground">Focus Time</span>
                      </div>
                      <span className="text-base sm:text-lg font-semibold text-foreground">{formatTime(Math.round(totalFocusTime))}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-accent/30">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                        <span className="text-xs sm:text-sm font-medium text-foreground">Sessions</span>
                      </div>
                      <span className="text-base sm:text-lg font-semibold text-foreground">{weekSessions.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-accent/30">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                        <span className="text-xs sm:text-sm font-medium text-foreground">Tasks Completed</span>
                      </div>
                      <span className="text-base sm:text-lg font-semibold text-foreground">{weekTasks.length}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
