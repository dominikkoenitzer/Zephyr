import { describe, it, expect, beforeEach } from 'vitest';
import { localStorageService, CHANGE_EVENT, DEFAULT_CALENDAR_SETTINGS } from './localStorage';

beforeEach(() => {
  localStorage.clear();
});

describe('localStorageService — tasks', () => {
  it('adds a task with sensible defaults', () => {
    const t = localStorageService.addTask({ title: 'A' });
    expect(t.id).toBeTruthy();
    expect(t.completed).toBe(false);
    expect(t.priority).toBe('medium');
    expect(localStorageService.getTasks()).toHaveLength(1);
  });

  it('marks complete with a completedAt timestamp, then clears it', () => {
    const t = localStorageService.addTask({ title: 'A' });
    const done = localStorageService.updateTask(t.id, { completed: true });
    expect(done.completed).toBe(true);
    expect(done.completedAt).toBeTruthy();

    const undone = localStorageService.updateTask(t.id, { completed: false });
    expect(undone.completedAt).toBeNull();
  });

  it('deletes a task', () => {
    const t = localStorageService.addTask({ title: 'A' });
    localStorageService.deleteTask(t.id);
    expect(localStorageService.getTasks()).toHaveLength(0);
  });
});

describe('localStorageService — change events', () => {
  it('broadcasts a zephyr:change event on every write', () => {
    let fired = 0;
    const handler = () => { fired += 1; };
    window.addEventListener(CHANGE_EVENT, handler);
    localStorageService.addTask({ title: 'A' });
    localStorageService.saveNotes([]);
    window.removeEventListener(CHANGE_EVENT, handler);
    expect(fired).toBe(2);
  });
});

describe('localStorageService — settings', () => {
  it('returns a fresh copy of the defaults that callers cannot mutate', () => {
    const a = localStorageService.getSettings();
    a.calendar.showWeekends = !a.calendar.showWeekends;
    const b = localStorageService.getSettings();
    expect(b.calendar.showWeekends).toBe(DEFAULT_CALENDAR_SETTINGS.showWeekends);
  });
});

describe('localStorageService — notes', () => {
  it('adds, updates and deletes a note', () => {
    const n = localStorageService.addNote({ title: 'N', content: 'c' });
    expect(localStorageService.getNotes()).toHaveLength(1);

    const updated = localStorageService.updateNote(n.id, { title: 'N2' });
    expect(updated.title).toBe('N2');

    localStorageService.deleteNote(n.id);
    expect(localStorageService.getNotes()).toHaveLength(0);
  });
});
