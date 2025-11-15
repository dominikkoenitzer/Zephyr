import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, X, Plus, Search, Filter, Calendar as CalendarIcon,
  Clock, MapPin, Bell, Trash2, Grid3x3, List, LayoutGrid,
  Circle, Settings
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
  // selectedDate is set but not currently used - kept for future functionality
  // eslint-disable-next-line no-unused-vars
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
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

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = event.target.closest('.search-container');
      if (!searchContainer && showSearchResults) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSearchResults]);

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

  // Navigate to event's date based on current view mode
  const navigateToEvent = useCallback((event) => {
    if (!event.date) return;
    
    const eventDate = new Date(event.date);
    setShowSearchResults(false);
    
    // Navigate based on view mode
    if (viewMode === VIEW_MODES.MONTH) {
      // Set to the month of the event
      setCurrentDate(new Date(eventDate.getFullYear(), eventDate.getMonth(), 1));
    } else if (viewMode === VIEW_MODES.WEEK) {
      // Set to the week containing the event
      const weekStart = new Date(eventDate);
      const dayOfWeek = calendarSettings.firstDayOfWeek === 1 
        ? (eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1)
        : eventDate.getDay();
      weekStart.setDate(eventDate.getDate() - dayOfWeek);
      setCurrentDate(weekStart);
    } else if (viewMode === VIEW_MODES.DAY) {
      // Set to the exact day
      setCurrentDate(eventDate);
    }
  }, [viewMode, calendarSettings.firstDayOfWeek]);

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
        <div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px] md:min-h-[120px] border border-border/50 rounded-lg bg-muted/20" />
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
            min-h-[80px] sm:min-h-[100px] md:min-h-[120px] border rounded-lg p-1 sm:p-2 cursor-pointer transition-all
            hover:bg-accent/50 hover:border-primary/50 hover:shadow-sm
            ${isToday ? 'bg-primary/10 border-primary border-2' : 'bg-card border-border/50'}
          `}
        >
          <div className={`text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${isToday ? 'text-primary' : 'text-foreground'}`}>
            {day}
          </div>
          <div className="space-y-0.5 sm:space-y-1 max-h-[60px] sm:max-h-[70px] md:max-h-[80px] overflow-y-auto">
            {dayEvents.slice(0, 2).map(event => {
              const eventCategory = EVENT_CATEGORIES.find(c => c.id === event.category) || EVENT_CATEGORIES[0];
              return (
                <div
                  key={event.id}
                  onClick={(e) => handleEventClick(event, e)}
                  className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded truncate hover:opacity-80 transition-opacity flex items-center justify-between group"
                  style={{ 
                    backgroundColor: eventCategory.color + '20', 
                    color: eventCategory.color 
                  }}
                >
                  <span className="truncate flex-1 font-medium">{event.title}</span>
                  <button
                    onClick={(e) => handleDeleteEvent(event.id, e)}
                    className="opacity-0 group-hover:opacity-100 ml-1 hover:text-destructive transition-opacity flex-shrink-0"
                  >
                    <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </button>
                </div>
              );
            })}
            {calendarSettings.showTasks && dayTasks.slice(0, 1).map(task => (
              <div
                key={task.id}
                className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded truncate flex items-center gap-0.5 sm:gap-1"
                style={{ backgroundColor: category.color + '20', color: category.color }}
              >
                <Circle className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                <span className="truncate">{task.title}</span>
              </div>
            ))}
            {(dayEvents.length > 2 || (calendarSettings.showTasks && dayTasks.length > 1)) && (
              <div className="text-[10px] sm:text-xs text-muted-foreground px-1 sm:px-1.5">
                +{dayEvents.length - 2 + (calendarSettings.showTasks ? Math.max(0, dayTasks.length - 1) : 0)} more
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
        <div key={i} className="flex flex-col border-r border-border last:border-r-0 min-w-[100px] sm:min-w-0">
          <div
            className={`p-2 sm:p-3 border-b border-border text-center cursor-pointer ${isToday ? 'bg-primary/10' : 'bg-muted/30'}`}
            onClick={() => handleDateClick(date)}
          >
            <div className="text-[10px] sm:text-xs text-muted-foreground">{displayWeekDays[i]}</div>
            <div className={`text-base sm:text-lg font-semibold mt-0.5 sm:mt-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
              {date.getDate()}
            </div>
          </div>
          <div className="flex-1 p-1 sm:p-2 space-y-0.5 sm:space-y-1 overflow-y-auto min-h-[200px] sm:min-h-[300px] md:min-h-[400px]">
            {[...dayEvents, ...dayTasks.map(t => ({ ...t, isTask: true }))].map((item) => {
              const category = item.isTask 
                ? EVENT_CATEGORIES.find(c => c.id === 'task')
                : EVENT_CATEGORIES.find(c => c.id === item.category) || EVENT_CATEGORIES[0];
              
              return (
                <div
                  key={item.id}
                  onClick={(e) => !item.isTask && handleEventClick(item, e)}
                  className="text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ 
                    backgroundColor: category.color + '20', 
                    color: category.color 
                  }}
                >
                  {item.time && <div className="text-[9px] sm:text-[10px] font-medium">{item.time}</div>}
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
    // Note: isCurrentDateToday could be used for highlighting today in day view if needed
    // const isCurrentDateToday = getDateKey(currentDate) === getDateKey(today);
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
        <div className="text-center py-3 sm:py-4 border-b border-border">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
            {monthNames[currentDate.getMonth()]} {currentDate.getDate()}, {currentDate.getFullYear()}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">
            {weekDays[currentDate.getDay()]}
          </div>
        </div>
        <div className="grid grid-cols-12 gap-1 sm:gap-2">
          <div className="col-span-3 sm:col-span-2 space-y-1">
            {hours.map(hour => (
              <div key={hour} className="h-12 sm:h-16 text-[10px] sm:text-xs text-muted-foreground text-right pr-1 sm:pr-2 pt-0.5 sm:pt-1">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>
          <div className="col-span-9 sm:col-span-10 space-y-1 relative">
            {hours.map(hour => (
              <div key={hour} className="h-12 sm:h-16 border-b border-border/50" style={{ minHeight: '48px' }} />
            ))}
            {allItems.map((item) => {
              const category = item.isTask 
                ? EVENT_CATEGORIES.find(c => c.id === 'task')
                : EVENT_CATEGORIES.find(c => c.id === item.category) || EVENT_CATEGORIES[0];
              
              const startHour = item.time ? parseInt(item.time.split(':')[0]) : 9;
              // Calculate top position based on hour (48px per hour on mobile, scales up on larger screens)
              const topPercent = (startHour / 24) * 100;
              
              return (
                <div
                  key={item.id}
                  onClick={(e) => !item.isTask && handleEventClick(item, e)}
                  className="absolute left-0 right-0 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded cursor-pointer hover:opacity-80 transition-opacity border-l-2"
                  style={{
                    top: `${topPercent}%`,
                    backgroundColor: category.color + '20',
                    borderLeftColor: category.color,
                    color: category.color
                  }}
                >
                  <div className="text-[10px] sm:text-xs font-medium">{item.time || 'All Day'}</div>
                  <div className="text-xs sm:text-sm font-semibold truncate">{item.title}</div>
                  {item.location && (
                    <div className="text-[9px] sm:text-xs flex items-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                      <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="truncate">{item.location}</span>
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Calendar</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Plan your schedule and organize your time
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <Button onClick={handleToday} variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9">
            Today
          </Button>
          <Button onClick={() => setIsSettingsOpen(true)} variant="outline" size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9">
            <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
          <Button onClick={() => handleDateClick(new Date())} size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9">
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">New Event</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0 relative search-container">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => {
                  e.stopPropagation();
                  setSearchQuery(e.target.value);
                  setShowSearchResults(e.target.value.length > 0 && filteredEvents.length > 0);
                }}
                onFocus={() => {
                  if (searchQuery.length > 0 && filteredEvents.length > 0) {
                    setShowSearchResults(true);
                  }
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter' && filteredEvents.length > 0) {
                    navigateToEvent(filteredEvents[0]);
                  } else if (e.key === 'Escape') {
                    setShowSearchResults(false);
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="pl-9 sm:pl-10 h-9 sm:h-10 text-sm"
                autoComplete="off"
              />
              {showSearchResults && searchQuery.length > 0 && filteredEvents.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg max-h-[300px] overflow-y-auto z-[9999]">
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                    </div>
                    {filteredEvents.slice(0, 10).map((event) => {
                      const eventCategory = EVENT_CATEGORIES.find(c => c.id === event.category) || EVENT_CATEGORIES[0];
                      const eventDate = event.date ? new Date(event.date) : null;
                      return (
                        <button
                          key={event.id}
                          onClick={() => navigateToEvent(event)}
                          className="w-full flex items-start gap-3 px-3 py-2 rounded-md text-left transition-colors hover:bg-accent/50"
                        >
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                            style={{ backgroundColor: eventCategory.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {event.title}
                            </div>
                            {eventDate && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {eventDate.toLocaleDateString('en-US', { 
                                  weekday: 'short',
                                  month: 'short', 
                                  day: 'numeric',
                                  year: eventDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                                })}
                                {event.time && ` at ${event.time}`}
                              </div>
                            )}
                            {event.location && (
                              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    {filteredEvents.length > 10 && (
                      <div className="px-3 py-2 text-xs text-center text-muted-foreground border-t border-border mt-2">
                        Showing top 10 results. Refine your search for more specific results.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full sm:w-[150px] h-9 sm:h-10 text-sm"
              >
                <option value="all">All Categories</option>
                {EVENT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1 border border-border rounded-lg p-0.5 sm:p-1">
              <Button
                variant={viewMode === VIEW_MODES.MONTH ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode(VIEW_MODES.MONTH)}
                className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
              >
                <Grid3x3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Month</span>
              </Button>
              <Button
                variant={viewMode === VIEW_MODES.WEEK ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode(VIEW_MODES.WEEK)}
                className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
              >
                <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Week</span>
              </Button>
              <Button
                variant={viewMode === VIEW_MODES.DAY ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode(VIEW_MODES.DAY)}
                className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
              >
                <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Day</span>
              </Button>
              <Button
                variant={viewMode === VIEW_MODES.AGENDA ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode(VIEW_MODES.AGENDA)}
                className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
              >
                <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Agenda</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Mini Calendar Sidebar */}
        {calendarSettings.showMiniCalendar && viewMode === VIEW_MODES.MONTH && (
          <div className="lg:col-span-1 order-2 lg:order-1">
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
        <div className={`${calendarSettings.showMiniCalendar && viewMode === VIEW_MODES.MONTH ? 'lg:col-span-3' : 'col-span-full'} order-1 lg:order-2`}>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <CardTitle className="text-lg sm:text-xl md:text-2xl">
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
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextPeriod}
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              {viewMode === VIEW_MODES.MONTH && (
                <>
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2">
                    {displayWeekDays.map(day => (
                      <div
                        key={day}
                        className="text-center text-xs sm:text-sm font-semibold text-muted-foreground py-1 sm:py-2"
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {renderMonthView()}
                  </div>
                </>
              )}
              {viewMode === VIEW_MODES.WEEK && (
                <div className="grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden overflow-x-auto">
                  {renderWeekView()}
                </div>
              )}
              {viewMode === VIEW_MODES.DAY && (
                <div className="overflow-x-auto">
                  {renderDayView()}
                </div>
              )}
              {viewMode === VIEW_MODES.AGENDA && renderAgendaView()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Date *</label>
                <CalendarPicker
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-2 pt-0 sm:pt-8">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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

