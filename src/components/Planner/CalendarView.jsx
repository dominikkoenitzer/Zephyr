import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarPlus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { EmptyState } from '../ui/empty-state';
import { cn } from '../../lib/utils';
import { localStorageService } from '../../services/localStorage';
import { useCalendarEvents } from '../../hooks/useStore';
import { toast } from 'sonner';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayKey = (value) => (value || '').split('T')[0];
const parseISO = (value) => {
  const [y, m, d] = dayKey(value).split('-').map(Number);
  return new Date(y, m - 1, d);
};
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatTime = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${pad(m)} ${period}`;
};

const formatDateLabel = (value) =>
  parseISO(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const emptyForm = (date = '') => ({ id: null, title: '', date, time: '', description: '' });

function CalendarView() {
  const [events] = useCalendarEvents();
  const [current, setCurrent] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());

  // Open on a specific month when linked with ?date=YYYY-MM-DD (e.g. from search).
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('date');
    if (param) {
      const d = new Date(param);
      if (!Number.isNaN(d.getTime())) setCurrent(d);
    }
  }, []);

  const today = new Date();
  const monthLabel = `${MONTHS[current.getMonth()]} ${current.getFullYear()}`;

  // 6 weeks starting on the Sunday on or before the 1st of the month.
  const grid = useMemo(() => {
    const first = new Date(current.getFullYear(), current.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [current]);

  const eventsByDate = useMemo(() => {
    const map = new Map();
    [...events]
      .filter((e) => e?.date)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
      .forEach((e) => {
        const key = dayKey(e.date);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(e);
      });
    return map;
  }, [events]);

  const upcoming = useMemo(() => {
    const todayKey = toISO(new Date());
    return [...events]
      .filter((e) => e?.date && dayKey(e.date) >= todayKey)
      .sort((a, b) => (dayKey(a.date) + (a.time || '')).localeCompare(dayKey(b.date) + (b.time || '')))
      .slice(0, 5);
  }, [events]);

  const openNew = (date) => {
    setForm(emptyForm(toISO(date)));
    setDialogOpen(true);
  };

  const openEdit = (event) => {
    setForm({
      id: event.id,
      title: event.title || '',
      date: dayKey(event.date),
      time: event.time || '',
      description: event.description || '',
    });
    setDialogOpen(true);
  };

  const save = () => {
    const title = form.title.trim();
    if (!title || !form.date) return;

    const all = localStorageService.getCalendarEvents();
    const payload = {
      title,
      date: form.date,
      time: form.time || null,
      description: form.description.trim(),
    };

    if (form.id) {
      const index = all.findIndex((e) => e.id === form.id);
      if (index !== -1) all[index] = { ...all[index], ...payload };
    } else {
      all.push({ id: `event-${Date.now()}`, createdAt: new Date().toISOString(), ...payload });
    }

    localStorageService.saveCalendarEvents(all);
    setDialogOpen(false);
  };

  const remove = () => {
    if (!form.id) return;
    const removed = events.find((e) => e.id === form.id);
    localStorageService.saveCalendarEvents(
      localStorageService.getCalendarEvents().filter((e) => e.id !== form.id)
    );
    setDialogOpen(false);
    if (removed) {
      toast('Event deleted', {
        action: {
          label: 'Undo',
          onClick: () => localStorageService.saveCalendarEvents([...localStorageService.getCalendarEvents(), removed]),
        },
      });
    }
  };

  const goPrev = () => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  const goNext = () => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  const goToday = () => setCurrent(new Date());

  return (
    <div className="w-full flex-1 flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goPrev} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goNext} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={goToday} className="text-sm">Today</Button>
          <h2 className="ml-1 text-lg sm:text-xl font-semibold text-foreground">{monthLabel}</h2>
        </div>
        <Button onClick={() => openNew(today)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add event
        </Button>
      </div>

      {/* Month grid */}
      <div className="rounded-2xl border border-border/60 bg-card/80 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border/60">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((d, i) => {
            const key = toISO(d);
            const dayEvents = eventsByDate.get(key) || [];
            const inMonth = d.getMonth() === current.getMonth();
            const isToday = sameDay(d, today);

            return (
              <div
                key={`${key}-${i}`}
                className={cn(
                  'min-h-[84px] sm:min-h-[104px] border-b border-r border-border/40 p-1.5',
                  !inMonth && 'bg-muted/30'
                )}
              >
                <button
                  type="button"
                  onClick={() => openNew(d)}
                  aria-label={`Add event on ${formatDateLabel(key)}`}
                  className={cn(
                    'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isToday
                      ? 'bg-primary text-primary-foreground font-semibold hover:bg-primary'
                      : inMonth
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                  )}
                >
                  {d.getDate()}
                </button>

                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => openEdit(ev)}
                      title={ev.title}
                      className="block w-full truncate rounded-md bg-primary/10 px-1.5 py-0.5 text-left text-[11px] font-medium text-primary hover:bg-primary/20"
                    >
                      {ev.time ? `${formatTime(ev.time)} ` : ''}{ev.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="px-1.5 text-[11px] text-muted-foreground">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming */}
      <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Upcoming</h3>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarPlus}
            title="No upcoming events"
            description="Tap a day above to add your first event."
          />
        ) : (
          <ul className="space-y-1.5">
            {upcoming.map((ev) => (
              <li key={ev.id}>
                <button
                  type="button"
                  onClick={() => openEdit(ev)}
                  className="w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-accent/40"
                >
                  <span className="flex h-9 w-9 flex-col items-center justify-center rounded-md bg-primary/10 text-primary flex-shrink-0">
                    <span className="text-[10px] uppercase leading-none">{MONTHS[parseISO(ev.date).getMonth()].slice(0, 3)}</span>
                    <span className="text-sm font-semibold leading-none">{parseISO(ev.date).getDate()}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{ev.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDateLabel(ev.date)}{ev.time ? ` · ${formatTime(ev.time)}` : ''}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit event' : 'New event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <label htmlFor="ev-title" className="text-sm font-medium text-foreground">Title</label>
              <Input
                id="ev-title"
                autoFocus
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="What's happening?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="ev-date" className="text-sm font-medium text-foreground">Date</label>
                <Input id="ev-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="ev-time" className="text-sm font-medium text-foreground">
                  Time <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <Input id="ev-time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ev-notes" className="text-sm font-medium text-foreground">
                Notes <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="ev-notes"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Add a note"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button onClick={save} disabled={!form.title.trim() || !form.date} className="flex-1">
                {form.id ? 'Save' : 'Add event'}
              </Button>
              {form.id && (
                <Button
                  variant="outline"
                  onClick={remove}
                  className="text-destructive hover:bg-destructive/10"
                  aria-label="Delete event"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CalendarView;
