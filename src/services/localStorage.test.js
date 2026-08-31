import { describe, it, expect, beforeEach } from 'vitest';
import { localStorageService, CHANGE_EVENT, DEFAULT_SETTINGS } from './localStorage';

beforeEach(() => {
  localStorage.clear();
});

describe('localStorageService: tasks', () => {
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

describe('localStorageService: ids', () => {
  it('gives two tasks made in the same millisecond different ids', () => {
    const a = localStorageService.addTask({ title: 'A' });
    const b = localStorageService.addTask({ title: 'B' });
    expect(a.id).not.toBe(b.id);

    // The bug that made this matter: delete matches on id, so a shared id
    // meant deleting one task deleted the other with it.
    localStorageService.deleteTask(a.id);
    expect(localStorageService.getTasks().map((t) => t.title)).toEqual(['B']);
  });

  it('gives two focus sessions different ids too', () => {
    localStorageService.saveFocusSession({ duration: 1 });
    localStorageService.saveFocusSession({ duration: 2 });
    const [one, two] = localStorageService.getFocusSessions();
    expect(one.id).not.toBe(two.id);
  });
});

describe('localStorageService: change events', () => {
  it('broadcasts a zephyr:change event on every write', () => {
    let fired = 0;
    const handler = () => { fired += 1; };
    window.addEventListener(CHANGE_EVENT, handler);
    localStorageService.addTask({ title: 'A' });
    localStorageService.saveViewPrefs({ taskView: 'today' });
    window.removeEventListener(CHANGE_EVENT, handler);
    expect(fired).toBe(2);
  });
});

describe('localStorageService: settings', () => {
  it('returns a fresh copy of the defaults that callers cannot mutate', () => {
    const a = localStorageService.getSettings();
    a.workDuration = a.workDuration + 99;
    const b = localStorageService.getSettings();
    expect(b.workDuration).toBe(DEFAULT_SETTINGS.workDuration);
  });
});

describe('localStorageService: view preferences', () => {
  it('merges each write into the stored preferences', () => {
    localStorageService.saveViewPrefs({ taskView: 'today' });
    localStorageService.saveViewPrefs({ taskTag: 'work' });
    expect(localStorageService.getViewPrefs()).toEqual({ taskView: 'today', taskTag: 'work' });
  });

  it('returns an empty object when nothing is stored', () => {
    expect(localStorageService.getViewPrefs()).toEqual({});
  });
});
