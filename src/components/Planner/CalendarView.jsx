import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, X, Plus, Search, Filter, Calendar as CalendarIcon,
  Clock, MapPin, Tag, Repeat, Bell, Edit2, Trash2, Grid3x3, List, LayoutGrid,
  CheckCircle, Circle, Settings
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { TimePicker } from '../ui/time-picker';
import { CalendarPicker } from '../ui/calendar-picker';
import { localStorageService } from '../../services/localStorage';

const VIEW_MODES = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day',
  AGENDA: 'agenda'
};

const EVENT_CATEGORIES = [
  { id: 'work', name: 'Work', color: '#3b82f6' },
  { id: 'personal', name: 'Personal', color: '#10b981' },
  { id: 'meeting', name: 'Meeting', color: '#f59e0b' },
  { id: 'reminder', name: 'Reminder', color: '#ef4444' },
  { id: 'task', name: 'Task', color: '#8b5cf6' },
  { id: 'other', name: 'Other', color: '#6b7280' }
];

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'No Repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarSettings, setCalendarSettings] = useState({
    firstDayOfWeek: 0,
    defaultView: 'month',
    showWeekends: true,
    showWeekNumbers: false,
    timeFormat: '12h',
    showMiniCalendar: true,
    showTasks: true,
    eventDensity: 'normal',
    startHour: 0,
    endHour: 23
  });
  const [viewMode, setViewMode] = useState(VIEW_MODES.MONTH);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    allDay: false,
    category: 'personal',
    location: '',
    recurrence: 'none',
    reminder: false
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Load calendar settings, events and tasks from localStorage
  useEffect(() => {
    const settings = localStorageService.getCalendarSettings();
    setCalendarSettings(settings);
    setViewMode(settings.defaultView || VIEW_MODES.MONTH);
    
    const savedEvents = localStorageService.getCalendarEvents();
    const savedTasks = localStorageService.getTasks();
    setEvents(savedEvents);
    setTasks(savedTasks);
    setIsInitialized(true);

    // Check for date parameter in URL or location state
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    if (dateParam) {
      try {
        const targetDate = new Date(dateParam);
        if (!isNaN(targetDate.getTime())) {
          setCurrentDate(targetDate);
        }
      } catch (e) {
        console.error('Invalid date parameter:', e);
      }
    }
  }, []);

  // Save events to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      localStorageService.saveCalendarEvents(events);
    }
  }, [events, isInitialized]);

  // Watch for URL parameter changes
  useEffect(() => {
    const handleLocationChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const dateParam = urlParams.get('date');
      if (dateParam) {
        try {
          const targetDate = new Date(dateParam);
          if (!isNaN(targetDate.getTime())) {
            setCurrentDate(targetDate);
          }
        } catch (e) {
          console.error('Invalid date parameter:', e);
        }
      }
    };

    // Check on mount and when URL changes
    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get week days based on first day of week setting
  const getWeekDays = () => {
    const days = [...weekDays];
    if (calendarSettings.firstDayOfWeek === 1) {
      // Monday first
      return [...days.slice(1), days[0]];
    }
    return days; // Sunday first
  };
  
  const displayWeekDays = getWeekDays();

  const getDateKey = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Filter events based on search and category
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = !searchQuery || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [events, searchQuery, filterCategory]);

  const getEventsForDate = useCallback((date) => {
    const dateKey = getDateKey(date);
    return filteredEvents.filter(event => {
      const eventDate = event.date ? getDateKey(new Date(event.date)) : '';
      return eventDate === dateKey;
    });
  }, [filteredEvents]);

  const getTasksForDate = useCallback((date) => {
    const dateKey = getDateKey(date);
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = getDateKey(new Date(task.dueDate));
      return taskDate === dateKey && !task.completed;
    });
  }, [tasks]);

  const handlePrevPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === VIEW_MODES.MONTH) {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === VIEW_MODES.WEEK) {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === VIEW_MODES.MONTH) {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === VIEW_MODES.WEEK) {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    const dateStr = getDateKey(date);
    setEventForm({
      title: '',
      description: '',
      date: dateStr,
      time: '',
      endTime: '',
      allDay: false,
      category: 'personal',
      location: '',
      recurrence: 'none',
      reminder: false
    });
    setIsDialogOpen(true);
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setEditingEvent(event);
    const eventDate = event.date ? new Date(event.date) : new Date();
    setSelectedDate(eventDate);
    setEventForm({
      title: event.title || '',
      description: event.description || '',
      date: getDateKey(eventDate),
      time: event.time || '',
      endTime: event.endTime || '',
      allDay: event.allDay || false,
      category: event.category || 'personal',
      location: event.location || '',
      recurrence: event.recurrence || 'none',
      reminder: event.reminder || false
    });
    setIsDialogOpen(true);
  };

  const handleSaveEvent = () => {
    if (!eventForm.title.trim() || !eventForm.date) return;

    const eventData = {
      title: eventForm.title.trim(),
      description: eventForm.description || '',
      date: eventForm.date,
      time: eventForm.allDay ? null : eventForm.time,
      endTime: eventForm.allDay ? null : eventForm.endTime,
      allDay: eventForm.allDay,
      category: eventForm.category,
      location: eventForm.location || '',
      recurrence: eventForm.recurrence,
      reminder: eventForm.reminder,
      createdAt: editingEvent ? editingEvent.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingEvent) {
      setEvents(events.map(event =>
        event.id === editingEvent.id
          ? { ...editingEvent, ...eventData }
          : event
      ));
    } else {
      const newEvent = {
        id: Date.now().toString(),
        ...eventData
      };
      setEvents([...events, newEvent]);
    }

    setEventForm({
      title: '',
      description: '',
      date: '',
      time: '',
      endTime: '',
      allDay: false,
      category: 'personal',
      location: '',
      recurrence: 'none',
      reminder: false
    });
    setEditingEvent(null);
    setIsDialogOpen(false);
  };

  const handleSaveSettings = () => {
    localStorageService.saveCalendarSettings(calendarSettings);
    setIsSettingsOpen(false);
  };

  const handleDeleteEvent = (eventId, e) => {
    e.stopPropagation();
    setEvents(events.filter(event => event.id !== eventId));
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    // Adjust based on first day of week setting
    if (calendarSettings.firstDayOfWeek === 1) {
      // Monday = 0, Sunday = 6
      return firstDay === 0 ? 6 : firstDay - 1;
    }
    return firstDay; // Sunday = 0
  };

  const renderMonthView = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[120px] border border-border/50 rounded-lg bg-muted/20" />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = getDateKey(date);
      const isToday = getDateKey(today) === dateKey;
      const dayEvents = getEventsForDate(date);
      const dayTasks = getTasksForDate(date);
      const category = EVENT_CATEGORIES.find(c => c.id === 'task');

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(date)}
          className={`
            min-h-[120px] border rounded-lg p-2 cursor-pointer transition-all
            hover:bg-accent/50 hover:border-primary/50 hover:shadow-sm
            ${isToday ? 'bg-primary/10 border-primary border-2' : 'bg-card border-border/50'}
          `}
        >
          <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-primary' : 'text-foreground'}`}>
            {day}
          </div>
          <div className="space-y-1 max-h-[80px] overflow-y-auto">
            {dayEvents.slice(0, 3).map(event => {
              const eventCategory = EVENT_CATEGORIES.find(c => c.id === event.category) || EVENT_CATEGORIES[0];
              return (
                <div
                  key={event.id}
                  onClick={(e) => handleEventClick(event, e)}
                  className="text-xs px-1.5 py-0.5 rounded truncate hover:opacity-80 transition-opacity flex items-center justify-between group"
                  style={{ backgroundColor: eventCategory.color + '20', color: eventCategory.color }}
                >
                  <span className="truncate flex-1 font-medium">{event.title}</span>
                  <button
                    onClick={(e) => handleDeleteEvent(event.id, e)}
                    className="opacity-0 group-hover:opacity-100 ml-1 hover:text-destructive transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
            {calendarSettings.showTasks && dayTasks.slice(0, 2).map(task => (
              <div
                key={task.id}
                className="text-xs px-1.5 py-0.5 rounded truncate flex items-center gap-1"
                style={{ backgroundColor: category.color + '20', color: category.color }}
              >
                <Circle className="h-2.5 w-2.5" />
                <span className="truncate">{task.title}</span>
              </div>
            ))}
            {(dayEvents.length > 3 || (calendarSettings.showTasks && dayTasks.length > 2)) && (
              <div className="text-xs text-muted-foreground px-1.5">
                +{dayEvents.length - 3 + (calendarSettings.showTasks ? Math.max(0, dayTasks.length - 2) : 0)} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateKey = getDateKey(date);
      const isToday = getDateKey(today) === dateKey;
      const dayEvents = getEventsForDate(date);
      const dayTasks = getTasksForDate(date);

      weekDays.push(
        <div key={i} className="flex flex-col border-r border-border last:border-r-0">
          <div
            className={`p-3 border-b border-border text-center ${isToday ? 'bg-primary/10' : 'bg-muted/30'}`}
            onClick={() => handleDateClick(date)}
          >
            <div className="text-xs text-muted-foreground">{weekDays[i]}</div>
            <div className={`text-lg font-semibold mt-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
              {date.getDate()}
            </div>
          </div>
          <div className="flex-1 p-2 space-y-1 overflow-y-auto min-h-[400px]">
            {[...dayEvents, ...dayTasks.map(t => ({ ...t, isTask: true }))].map((item) => {
              const category = item.isTask 
                ? EVENT_CATEGORIES.find(c => c.id === 'task')
                : EVENT_CATEGORIES.find(c => c.id === item.category) || EVENT_CATEGORIES[0];
              
              return (
                <div
                  key={item.id}
                  onClick={(e) => !item.isTask && handleEventClick(item, e)}
                  className="text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: category.color + '20', color: category.color }}
                >
                  {item.time && <div className="text-[10px] font-medium">{item.time}</div>}
                  <div className="font-medium truncate">{item.title}</div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return weekDays;
  };

  const renderDayView = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = getDateKey(currentDate) === getDateKey(today);
    const dayEvents = getEventsForDate(currentDate);
    const dayTasks = getTasksForDate(currentDate);
    const allItems = [...dayEvents, ...dayTasks.map(t => ({ ...t, isTask: true }))].sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="space-y-2">
        <div className="text-center py-4 border-b border-border">
          <div className="text-2xl font-bold text-foreground">
            {monthNames[currentDate.getMonth()]} {currentDate.getDate()}, {currentDate.getFullYear()}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {weekDays[currentDate.getDay()]}
          </div>
        </div>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-2 space-y-1">
            {hours.map(hour => (
              <div key={hour} className="h-16 text-xs text-muted-foreground text-right pr-2 pt-1">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>
          <div className="col-span-10 space-y-1 relative">
            {hours.map(hour => (
              <div key={hour} className="h-16 border-b border-border/50" />
            ))}
            {allItems.map((item) => {
              const category = item.isTask 
                ? EVENT_CATEGORIES.find(c => c.id === 'task')
                : EVENT_CATEGORIES.find(c => c.id === item.category) || EVENT_CATEGORIES[0];
              
              const startHour = item.time ? parseInt(item.time.split(':')[0]) : 9;
              const top = startHour * 64;
              
              return (
                <div
                  key={item.id}
                  onClick={(e) => !item.isTask && handleEventClick(item, e)}
                  className="absolute left-0 right-0 px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity border-l-2"
                  style={{
                    top: `${top}px`,
                    backgroundColor: category.color + '20',
                    borderLeftColor: category.color,
                    color: category.color
                  }}
                >
                  <div className="text-xs font-medium">{item.time || 'All Day'}</div>
                  <div className="text-sm font-semibold">{item.title}</div>
                  {item.location && (
                    <div className="text-xs flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const sortedEvents = [...filteredEvents].sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateA - dateB;
    });

    const groupedEvents = sortedEvents.reduce((acc, event) => {
      const dateKey = event.date || 'no-date';
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(event);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([dateKey, dateEvents]) => {
          const date = dateKey !== 'no-date' ? new Date(dateKey) : null;
          return (
            <Card key={dateKey}>
              <CardHeader>
                <CardTitle>
                  {date ? date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'No Date'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dateEvents.map(event => {
                  const category = EVENT_CATEGORIES.find(c => c.id === event.category) || EVENT_CATEGORIES[0];
                  return (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event, { stopPropagation: () => {} })}
                      className="p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="font-semibold text-foreground">{event.title}</span>
                            {event.time && (
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {event.time}
                              </span>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mb-1">{event.description}</p>
                          )}
                          {event.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(event.id, e);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
        {sortedEvents.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No events found</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderMiniCalendar = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = getDateKey(date);
      const isToday = getDateKey(today) === dateKey;
      const hasEvents = getEventsForDate(date).length > 0;

      days.push(
        <button
          key={day}
          onClick={() => {
            setCurrentDate(date);
            if (viewMode !== VIEW_MODES.MONTH) {
              setViewMode(VIEW_MODES.MONTH);
            }
          }}
          className={`
            aspect-square rounded-md text-sm transition-colors
            ${isToday ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-accent'}
            ${hasEvents ? 'relative' : ''}
          `}
        >
          {day}
          {hasEvents && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
          )}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Plan your schedule and organize your time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleToday} variant="outline">
            Today
          </Button>
          <Button onClick={() => setIsSettingsOpen(true)} variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button onClick={() => handleDateClick(new Date())} className="gap-2">
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-[150px]"
              >
                <option value="all">All Categories</option>
                {EVENT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-1 border border-border rounded-lg p-1">
              <Button
                variant={viewMode === VIEW_MODES.MONTH ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode(VIEW_MODES.MONTH)}
                className="gap-2"
              >
                <Grid3x3 className="h-4 w-4" />
                Month
              </Button>
              <Button
                variant={viewMode === VIEW_MODES.WEEK ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode(VIEW_MODES.WEEK)}
                className="gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                Week
              </Button>
              <Button
                variant={viewMode === VIEW_MODES.DAY ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode(VIEW_MODES.DAY)}
                className="gap-2"
              >
                <CalendarIcon className="h-4 w-4" />
                Day
              </Button>
              <Button
                variant={viewMode === VIEW_MODES.AGENDA ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode(VIEW_MODES.AGENDA)}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                Agenda
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Mini Calendar Sidebar */}
        {calendarSettings.showMiniCalendar && viewMode === VIEW_MODES.MONTH && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mini Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        const newDate = new Date(currentDate);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setCurrentDate(newDate);
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold text-sm">
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        const newDate = new Date(currentDate);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setCurrentDate(newDate);
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {displayWeekDays.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground">
                {day[0]}
              </div>
            ))}
          </div>
                  <div className="grid grid-cols-7 gap-1">
                    {renderMiniCalendar()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Legend */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {EVENT_CATEGORIES.map(category => (
                  <div key={category.id} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm text-foreground">{category.name}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Calendar View */}
        <div className={calendarSettings.showMiniCalendar && viewMode === VIEW_MODES.MONTH ? 'lg:col-span-3' : 'col-span-full'}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">
                  {viewMode === VIEW_MODES.MONTH && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                  {viewMode === VIEW_MODES.WEEK && `Week of ${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}`}
                  {viewMode === VIEW_MODES.DAY && `${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`}
                  {viewMode === VIEW_MODES.AGENDA && 'Agenda'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevPeriod}
                    className="h-9 w-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextPeriod}
                    className="h-9 w-9"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === VIEW_MODES.MONTH && (
                <>
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {displayWeekDays.map(day => (
                      <div
                        key={day}
                        className="text-center text-sm font-semibold text-muted-foreground py-2"
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {renderMonthView()}
                  </div>
                </>
              )}
              {viewMode === VIEW_MODES.WEEK && (
                <div className="grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden">
                  {renderWeekView()}
                </div>
              )}
              {viewMode === VIEW_MODES.DAY && renderDayView()}
              {viewMode === VIEW_MODES.AGENDA && renderAgendaView()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">Event Title *</label>
              <Input
                placeholder="Enter event title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Date *</label>
                <CalendarPicker
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={eventForm.allDay}
                  onChange={(e) => setEventForm({ ...eventForm, allDay: e.target.checked })}
                  className="w-4 h-4 rounded border-input"
                />
                <label htmlFor="allDay" className="text-sm font-medium text-foreground cursor-pointer">
                  All Day Event
                </label>
              </div>
            </div>

            {!eventForm.allDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-foreground">Start Time</label>
                  <TimePicker
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-foreground">End Time</label>
                  <TimePicker
                    value={eventForm.endTime}
                    onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-3 block text-foreground">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {EVENT_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setEventForm({ ...eventForm, category: cat.id })}
                    className={`
                      flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all
                      ${eventForm.category === cat.id 
                        ? 'border-primary bg-primary/10 shadow-sm' 
                        : 'border-border hover:border-primary/50 hover:bg-accent/50'
                      }
                    `}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm font-medium text-foreground">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">Repeat</label>
              <Select
                value={eventForm.recurrence}
                onChange={(e) => setEventForm({ ...eventForm, recurrence: e.target.value })}
                className="w-full"
              >
                {RECURRENCE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">Location</label>
              <Input
                placeholder="Enter location (optional)"
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">Description</label>
              <textarea
                placeholder="Enter event description (optional)"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                className="w-full min-h-[100px] px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <Checkbox
                id="reminder"
                checked={eventForm.reminder}
                onCheckedChange={(checked) => setEventForm({ ...eventForm, reminder: checked })}
              />
              <label htmlFor="reminder" className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2 flex-1">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Set Reminder
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEventForm({
                    title: '',
                    description: '',
                    date: '',
                    time: '',
                    endTime: '',
                    allDay: false,
                    category: 'personal',
                    location: '',
                    recurrence: 'none',
                    reminder: false
                  });
                  setEditingEvent(null);
                }}
              >
                Cancel
              </Button>
              {editingEvent && (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleDeleteEvent(editingEvent.id, { stopPropagation: () => {} });
                    setIsDialogOpen(false);
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button
                onClick={handleSaveEvent}
                disabled={!eventForm.title.trim() || !eventForm.date}
              >
                {editingEvent ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Calendar Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Calendar Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* First Day of Week */}
            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">First Day of Week</label>
              <Select
                value={calendarSettings.firstDayOfWeek}
                onChange={(e) => setCalendarSettings({ ...calendarSettings, firstDayOfWeek: parseInt(e.target.value) })}
                className="w-full"
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
              </Select>
            </div>

            {/* Default View */}
            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">Default View</label>
              <Select
                value={calendarSettings.defaultView}
                onChange={(e) => setCalendarSettings({ ...calendarSettings, defaultView: e.target.value })}
                className="w-full"
              >
                <option value="month">Month</option>
                <option value="week">Week</option>
                <option value="day">Day</option>
                <option value="agenda">Agenda</option>
              </Select>
            </div>

            {/* Time Format */}
            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">Time Format</label>
              <Select
                value={calendarSettings.timeFormat}
                onChange={(e) => setCalendarSettings({ ...calendarSettings, timeFormat: e.target.value })}
                className="w-full"
              >
                <option value="12h">12 Hour (AM/PM)</option>
                <option value="24h">24 Hour</option>
              </Select>
            </div>

            {/* Event Density */}
            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">Event Display Density</label>
              <Select
                value={calendarSettings.eventDensity}
                onChange={(e) => setCalendarSettings({ ...calendarSettings, eventDensity: e.target.value })}
                className="w-full"
              >
                <option value="compact">Compact</option>
                <option value="normal">Normal</option>
                <option value="comfortable">Comfortable</option>
              </Select>
            </div>

            {/* Day View Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Day View Start Hour</label>
                <Select
                  value={calendarSettings.startHour}
                  onChange={(e) => setCalendarSettings({ ...calendarSettings, startHour: parseInt(e.target.value) })}
                  className="w-full"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Day View End Hour</label>
                <Select
                  value={calendarSettings.endHour}
                  onChange={(e) => setCalendarSettings({ ...calendarSettings, endHour: parseInt(e.target.value) })}
                  className="w-full"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Toggle Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground cursor-pointer">Show Weekends</label>
                  <p className="text-xs text-muted-foreground mt-0.5">Display Saturday and Sunday in calendar views</p>
                </div>
                <Checkbox
                  checked={calendarSettings.showWeekends}
                  onCheckedChange={(checked) => setCalendarSettings({ ...calendarSettings, showWeekends: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground cursor-pointer">Show Week Numbers</label>
                  <p className="text-xs text-muted-foreground mt-0.5">Display week numbers in month view</p>
                </div>
                <Checkbox
                  checked={calendarSettings.showWeekNumbers}
                  onCheckedChange={(checked) => setCalendarSettings({ ...calendarSettings, showWeekNumbers: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground cursor-pointer">Show Mini Calendar</label>
                  <p className="text-xs text-muted-foreground mt-0.5">Display mini calendar sidebar in month view</p>
                </div>
                <Checkbox
                  checked={calendarSettings.showMiniCalendar}
                  onCheckedChange={(checked) => setCalendarSettings({ ...calendarSettings, showMiniCalendar: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground cursor-pointer">Show Tasks on Calendar</label>
                  <p className="text-xs text-muted-foreground mt-0.5">Display tasks with due dates on the calendar</p>
                </div>
                <Checkbox
                  checked={calendarSettings.showTasks}
                  onCheckedChange={(checked) => setCalendarSettings({ ...calendarSettings, showTasks: checked })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setIsSettingsOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveSettings}>
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarView;

