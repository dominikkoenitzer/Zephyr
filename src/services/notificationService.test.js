import { describe, it, expect, beforeEach, vi } from 'vitest';
import { localStorageService } from './localStorage';
import { notificationService } from './notificationService';

const pad = (n) => String(n).padStart(2, '0');
const dayKey = (offset) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

beforeEach(() => {
  localStorage.clear();
  // jsdom has no Web Audio; the chime is not what these tests are about.
  vi.spyOn(notificationService, 'playNotificationSound').mockImplementation(() => {});
});

describe('notificationService: task reminders', () => {
  it('announces every due task, not just the first one', () => {
    localStorageService.addTask({ title: 'Send the invoice', dueDate: dayKey(0) });
    localStorageService.addTask({ title: 'Book the dentist', dueDate: dayKey(0) });

    notificationService.checkTaskDueDates();

    const messages = notificationService.getNotifications().map((n) => n.message);
    expect(messages).toHaveLength(2);
    expect(messages.some((m) => m.includes('Send the invoice'))).toBe(true);
    expect(messages.some((m) => m.includes('Book the dentist'))).toBe(true);
  });

  it('announces a task once a day however often it polls', () => {
    localStorageService.addTask({ title: 'Send the invoice', dueDate: dayKey(0) });

    // The service polls every 60s; the old guard expired at exactly 60s, so
    // every poll produced a fresh notification and another chime.
    notificationService.checkTaskDueDates();
    notificationService.checkTaskDueDates();
    notificationService.checkTaskDueDates();

    expect(notificationService.getNotifications()).toHaveLength(1);
  });

  it('passes over a task whose due date is not text', () => {
    localStorage.setItem('zephyr_tasks', JSON.stringify({
      tasks: [
        { id: 'a', title: 'Odd date', completed: false, dueDate: 20261024 },
        { id: 'b', title: 'Send the invoice', completed: false, dueDate: dayKey(0) },
      ],
    }));

    notificationService.checkTaskDueDates();

    const messages = notificationService.getNotifications().map((n) => n.message);
    expect(messages).toEqual(['Send the invoice is due today']);
  });

  it('keeps the overdue, due-today and due-soon reminders apart', () => {
    localStorageService.addTask({ title: 'Late one', dueDate: dayKey(-3) });
    localStorageService.addTask({ title: 'Today one', dueDate: dayKey(0) });
    localStorageService.addTask({ title: 'Soon one', dueDate: dayKey(1) });

    notificationService.checkTaskDueDates();

    const titles = notificationService.getNotifications().map((n) => n.title).sort();
    expect(titles).toEqual(['Task due soon', 'Task due today', 'Task overdue']);
  });

  it('still announces a task again the next day', () => {
    const task = localStorageService.addTask({ title: 'Send the invoice', dueDate: dayKey(0) });
    notificationService.checkTaskDueDates();
    expect(notificationService.getNotifications()).toHaveLength(1);

    // Simulate yesterday's reminder having been the one on record.
    const stored = notificationService.getNotifications();
    stored[0].dedupeKey = `task:${task.id}:due-today:${dayKey(-1)}`;
    notificationService.saveNotifications(stored);

    notificationService.checkTaskDueDates();
    expect(notificationService.getNotifications()).toHaveLength(2);
  });

  it('says nothing about completed tasks', () => {
    const task = localStorageService.addTask({ title: 'Done already', dueDate: dayKey(-1) });
    localStorageService.updateTask(task.id, { completed: true });

    notificationService.checkTaskDueDates();
    expect(notificationService.getNotifications()).toHaveLength(0);
  });

  it('honours the master switch and the per-type switch', () => {
    localStorageService.addTask({ title: 'Send the invoice', dueDate: dayKey(0) });

    notificationService.saveSettings({ ...notificationService.getSettings(), enabled: false });
    notificationService.checkTaskDueDates();
    expect(notificationService.getNotifications()).toHaveLength(0);

    const settings = notificationService.getSettings();
    notificationService.saveSettings({
      ...settings,
      enabled: true,
      tasks: { ...settings.tasks, enabled: false },
    });
    notificationService.checkTaskDueDates();
    expect(notificationService.getNotifications()).toHaveLength(0);
  });
});

describe('notificationService: deleting', () => {
  it('keeps a deleted reminder deleted for the rest of the day', () => {
    localStorageService.addTask({ title: 'Send the invoice', dueDate: dayKey(0) });
    notificationService.checkTaskDueDates();
    const [reminder] = notificationService.getNotifications();

    notificationService.deleteNotification(reminder.id);
    notificationService.checkTaskDueDates();

    expect(notificationService.getNotifications()).toHaveLength(0);
    expect(notificationService.getUnreadCount()).toBe(0);
    expect(notificationService.playNotificationSound).toHaveBeenCalledTimes(1);
  });

  it('lets the 30-day retention prune what was deleted', () => {
    notificationService.createNotification('task', 'Old', 'old', null, {}, 'task:1:overdue:old');
    const [old] = notificationService.getNotifications();
    notificationService.deleteNotification(old.id);

    const stored = JSON.parse(localStorage.getItem('zephyr_notifications'));
    expect(stored).toHaveLength(1);
    stored[0].createdAt = new Date(Date.now() - 31 * 86_400_000).toISOString();
    localStorage.setItem('zephyr_notifications', JSON.stringify(stored));

    notificationService.createNotification('task', 'New', 'new', null, {}, 'task:2:overdue:new');
    const keys = JSON.parse(localStorage.getItem('zephyr_notifications')).map((n) => n.dedupeKey);
    expect(keys).toEqual(['task:2:overdue:new']);
  });
});

describe('notificationService: timer alerts outside the list', () => {
  const shown = [];
  beforeEach(() => {
    shown.length = 0;
    vi.stubGlobal('Notification', class {
      static permission = 'granted';
      constructor(title) { shown.push(title); }
    });
    return () => vi.unstubAllGlobals();
  });

  const turnOff = (patch) => {
    const settings = notificationService.getSettings();
    notificationService.saveSettings({ ...settings, ...patch(settings) });
  };

  it('chimes and notifies the system when timer alerts are on', () => {
    notificationService.playChime('timer');
    notificationService.showOsNotification('timer', 'Break over', 'Back to it.');
    expect(notificationService.playNotificationSound).toHaveBeenCalledTimes(1);
    expect(shown).toEqual(['Break over']);
  });

  it('stays silent when timer notifications are off', () => {
    turnOff((s) => ({ timer: { ...s.timer, enabled: false } }));
    notificationService.playChime('timer');
    expect(notificationService.playNotificationSound).not.toHaveBeenCalled();
    notificationService.showOsNotification('timer', 'Break over', 'Back to it.');
    expect(shown).toEqual([]);
  });

  it('stays silent when notifications are off altogether', () => {
    turnOff(() => ({ enabled: false }));
    notificationService.playChime('timer');
    expect(notificationService.playNotificationSound).not.toHaveBeenCalled();
    notificationService.showOsNotification('timer', 'Session complete', 'Take a break.');
    expect(shown).toEqual([]);
  });

  it('notifies without the chime when only the sound is off', () => {
    turnOff(() => ({ soundEnabled: false }));
    notificationService.playChime('timer');
    notificationService.showOsNotification('timer', 'Break over', 'Back to it.');
    expect(notificationService.playNotificationSound).not.toHaveBeenCalled();
    expect(shown).toEqual(['Break over']);
  });
});

describe('notificationService: unkeyed notifications', () => {
  it('still collapses a repeated timer alert inside a minute', () => {
    notificationService.createNotification('timer', 'Session Complete', 'one');
    notificationService.createNotification('timer', 'Session Complete', 'two');
    expect(notificationService.getNotifications()).toHaveLength(1);
  });
});

describe('notificationService: stored list', () => {
  // The list travels in backups, so an import can bring in any shape.
  const bad = [{}, 'text', 5, [null], [1, 2]];
  const store = (value) => localStorage.setItem('zephyr_notifications', JSON.stringify(value));
  const record = (id) => ({ id, type: 'timer', title: id, read: false, createdAt: new Date().toISOString() });

  const one = record('n1');
  const two = record('n2');

  it.each([
    ['[null, record]', [null, one], [one]],
    ['[record, 5, record]', [one, 5, two], [one, two]],
    ['[]', [], []],
    ['a non-list', { id: 'n1' }, []],
  ])('reads %s entry by entry', (_, stored, read) => {
    store(stored);
    expect(notificationService.getNotifications()).toEqual(read);
    expect(notificationService.getUnreadCount()).toBe(read.length);
  });

  it('keeps the records of a stored list with a bad entry when it saves', () => {
    store([null, one]);
    notificationService.markAllAsRead();
    expect(JSON.parse(localStorage.getItem('zephyr_notifications'))).toEqual([{ ...one, read: true }]);
  });

  it('reads a stored value that is not a list of records as no notifications', () => {
    for (const value of bad) {
      store(value);
      expect(notificationService.getNotifications()).toEqual([]);
      expect(notificationService.getUnreadCount()).toBe(0);
    }
  });

  it('adds a new notification over a stored value that is not a list', () => {
    for (const value of bad) {
      store(value);
      expect(notificationService.markAllAsRead()).toBe(true);
      notificationService.createNotification('timer', 'Session Complete', 'done');
      expect(notificationService.getNotifications().map((n) => n.message)).toEqual(['done']);
    }
  });
});

describe('notificationService: polling', () => {
  it('does not stack intervals when started twice', () => {
    const spy = vi.spyOn(globalThis, 'clearInterval');
    notificationService.startChecking();
    const first = notificationService.checkInterval;
    notificationService.startChecking();

    expect(spy).toHaveBeenCalledWith(first);
    expect(notificationService.checkInterval).not.toBe(first);
    notificationService.stopChecking();
    expect(notificationService.checkInterval).toBeNull();
    spy.mockRestore();
  });
});

describe('notificationService: stored settings', () => {
  // The settings travel in backups, so an import can bring in any shape.
  const store = (settings) => localStorage.setItem('zephyr_notification_settings', JSON.stringify(settings));

  it('still reminds when the stored tasks section is not an object', () => {
    localStorageService.addTask({ title: 'Send the invoice', dueDate: dayKey(0) });
    store({ enabled: true, tasks: null });

    expect(() => notificationService.checkTaskDueDates()).not.toThrow();
    expect(notificationService.getNotifications().map((n) => n.message)).toEqual(['Send the invoice is due today']);
  });

  it('reads a section that is not an object as its default', () => {
    const defaults = notificationService.getSettings();
    for (const bad of [null, 5, 'on', [true]]) {
      store({ enabled: false, tasks: bad, timer: bad });
      const settings = notificationService.getSettings();
      expect(settings.enabled).toBe(false);
      expect(settings.tasks).toEqual(defaults.tasks);
      expect(settings.timer).toEqual(defaults.timer);
    }
  });

  it('keeps a stored section that is an object', () => {
    store({ tasks: { enabled: false, dueDateReminder: 3, overdue: false } });
    expect(notificationService.getSettings().tasks).toEqual({ enabled: false, dueDateReminder: 3, overdue: false });
  });
});
