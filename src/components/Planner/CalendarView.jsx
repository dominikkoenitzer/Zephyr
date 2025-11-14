import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { localStorageService } from '../../services/localStorage';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({ title: '', description: '', time: '' });

  const [isInitialized, setIsInitialized] = useState(false);

  // Load events from localStorage
  useEffect(() => {
    const savedEvents = localStorageService.getCalendarEvents();
    setEvents(savedEvents);
    setIsInitialized(true);
  }, []);

  // Save events to localStorage whenever they change (but not on initial load)
  useEffect(() => {
    if (isInitialized) {
      localStorageService.saveCalendarEvents(events);
    }
  }, [events, isInitialized]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getDateKey = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  };

  const getEventsForDate = useCallback((date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return getDateKey(eventDate) === getDateKey(date);
    });
  }, [events]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setEventForm({ title: '', description: '', time: '' });
    setIsDialogOpen(true);
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setEditingEvent(event);
    setSelectedDate(new Date(event.date));
    setEventForm({
      title: event.title,
      description: event.description || '',
      time: event.time || ''
    });
    setIsDialogOpen(true);
  };

  const handleSaveEvent = () => {
    if (!eventForm.title.trim() || !selectedDate) return;

    if (editingEvent) {
      // Update existing event
      setEvents(events.map(event =>
        event.id === editingEvent.id
          ? { ...event, ...eventForm, date: selectedDate }
          : event
      ));
    } else {
      // Create new event
      const newEvent = {
        id: Date.now(),
        title: eventForm.title,
        description: eventForm.description,
        time: eventForm.time,
        date: selectedDate,
        createdAt: new Date().toISOString()
      };
      setEvents([...events, newEvent]);
    }

    setEventForm({ title: '', description: '', time: '' });
    setEditingEvent(null);
    setIsDialogOpen(false);
  };

  const handleDeleteEvent = (eventId, e) => {
    e.stopPropagation();
    setEvents(events.filter(event => event.id !== eventId));
  };

  const renderCalendarDays = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[100px] border border-border/50 rounded-lg" />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = getDateKey(date);
      const isToday = getDateKey(today) === dateKey;
      const dayEvents = getEventsForDate(date);

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(date)}
          className={`
            min-h-[100px] border border-border/50 rounded-lg p-2 cursor-pointer
            transition-colors hover:bg-accent/50
            ${isToday ? 'bg-primary/10 border-primary' : 'bg-card'}
          `}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map(event => (
              <div
                key={event.id}
                onClick={(e) => handleEventClick(event, e)}
                className="text-xs bg-primary/20 text-primary-foreground px-1.5 py-0.5 rounded truncate hover:bg-primary/30 transition-colors flex items-center justify-between group"
              >
                <span className="truncate flex-1">{event.title}</span>
                <button
                  onClick={(e) => handleDeleteEvent(event.id, e)}
                  className="opacity-0 group-hover:opacity-100 ml-1 hover:text-destructive transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-muted-foreground px-1.5">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Plan your schedule and organize your time
          </p>
        </div>
        <Button onClick={handleToday} variant="outline">
          Today
        </Button>
      </div>

      {/* Calendar Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevMonth}
                className="h-9 w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                className="h-9 w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map(day => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {renderCalendarDays()}
          </div>
        </CardContent>
      </Card>

      {/* Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Edit Event' : 'Add Event'}
              {selectedDate && (
                <span className="text-muted-foreground font-normal ml-2">
                  - {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Event Title</label>
              <Input
                placeholder="Enter event title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Time (optional)</label>
              <Input
                type="time"
                placeholder="HH:MM"
                value={eventForm.time}
                onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description (optional)</label>
              <textarea
                placeholder="Enter event description"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                className="w-full min-h-[100px] px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEventForm({ title: '', description: '', time: '' });
                  setEditingEvent(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEvent}
                disabled={!eventForm.title.trim()}
              >
                {editingEvent ? 'Update Event' : 'Add Event'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarView;

