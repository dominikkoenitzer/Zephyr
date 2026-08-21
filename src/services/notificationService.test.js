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

describe('notificationService — task reminders', () => {
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

  it('keeps the overdue, due-today and due-soon reminders apart', () => {
    localStorageService.addTask({ title: 'Late one', dueDate: dayKey(-3) });
    localStorageService.addTask({ title: 'Today one', dueDate: dayKey(0) });
    localStorageService.addTask({ title: 'Soon one', dueDate: dayKey(1) });

    notificationService.checkTaskDueDates();

    const titles = notificationService.getNotifications().map((n) => n.title).sort();
    expect(titles).toEqual(['Task Due Soon', 'Task Due Today', 'Task Overdue']);
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

describe('notificationService — unkeyed notifications', () => {
  it('still collapses a repeated timer alert inside a minute', () => {
    notificationService.createNotification('timer', 'Session Complete', 'one');
    notificationService.createNotification('timer', 'Session Complete', 'two');
    expect(notificationService.getNotifications()).toHaveLength(1);
  });
});

describe('notificationService — polling', () => {
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
