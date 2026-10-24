import { describe, it, expect, beforeEach } from 'vitest';
import { localStorageService, CHANGE_EVENT, DEFAULT_SETTINGS, nextCleared, readTaskRecord } from './localStorage';

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

  it('reads a due date that is not text as no due date', () => {
    const tasks = [
      { id: 'a', title: 'A', dueDate: 20261024 },
      { id: 'b', title: 'B', dueDate: { day: 24 } },
      { id: 'c', title: 'C', dueDate: '2026-10-24' },
      { id: 'd', title: 'D' },
    ];
    localStorage.setItem('zephyr_tasks', JSON.stringify({ tasks }));
    expect(localStorageService.getTasks().map((t) => t.dueDate)).toEqual([null, null, '2026-10-24', undefined]);
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

  it('reads stored settings that are not an object as none', () => {
    ['null', '[]', '5'].forEach((value) => {
      localStorage.setItem('zephyr_settings', value);
      expect(localStorageService.getSettings()).toEqual(DEFAULT_SETTINGS);
    });
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

describe('localStorageService: backup and storage dates', () => {
  it('stores the last export as an ISO date and tells the open views', () => {
    const seen = [];
    const listen = (e) => seen.push(e.detail.key);
    window.addEventListener(CHANGE_EVENT, listen);
    const at = localStorageService.saveLastBackup(new Date('2026-09-29T10:00:00Z'));
    window.removeEventListener(CHANGE_EVENT, listen);

    expect(at).toBe('2026-09-29T10:00:00.000Z');
    expect(localStorageService.getLastBackup()).toBe(at);
    expect(seen).toEqual(['zephyr_last_backup']);
  });

  it('has no last export before the first one', () => {
    expect(localStorageService.getLastBackup()).toBeNull();
  });

  it('remembers when it asked to keep the storage', () => {
    expect(localStorageService.getPersistAsked()).toBeNull();
    localStorageService.savePersistAsked(new Date('2026-09-29T10:00:00Z'));
    expect(localStorageService.getPersistAsked()).toBe('2026-09-29T10:00:00.000Z');
  });
});

describe('localStorageService: storage info', () => {
  it('counts everything a backup would carry, notifications and presets included', () => {
    const stored = {
      zephyr_tasks: '{"tasks":[]}',
      zephyr_notifications: '[{"id":"n1","title":"Task due today"}]',
      zephyr_notification_settings: '{"enabled":true}',
      focusTimerPresets: '[{"id":"deep","work":50}]',
      theme: 'dark',
    };
    Object.entries(stored).forEach(([key, value]) => localStorage.setItem(key, value));
    localStorage.setItem('someone-elses-key', 'x'.repeat(500));

    const expected = Object.values(stored).reduce((sum, value) => sum + new Blob([value]).size, 0);
    expect(localStorageService.getStorageInfo().totalSize).toBe(expected);
  });
});

describe('localStorageService: cleared tasks', () => {
  const finished = (id) => ({ id, title: id, completed: true, completedAt: '2026-10-20T08:00:00.000Z' });

  it('reads a record from before the cleared list as having none, and keeps its tasks', () => {
    localStorage.setItem('zephyr_tasks', JSON.stringify({ tasks: [finished('a')], lastUpdated: 1 }));
    expect(localStorageService.getClearedTasks()).toEqual([]);
    expect(localStorageService.getTasks().map((t) => t.id)).toEqual(['a']);

    localStorageService.saveTasks([]);
    expect(localStorageService.getClearedTasks()).toEqual([
      expect.objectContaining({ id: 'a', completedAt: '2026-10-20T08:00:00.000Z' }),
    ]);
  });

  it('reads a damaged record as empty instead of throwing', () => {
    expect(readTaskRecord('{not json')).toEqual({ tasks: [], cleared: [] });
    expect(readTaskRecord(JSON.stringify({ tasks: 'x', cleared: [null, 1, { id: 2 }, { id: 'ok' }] })))
      .toEqual({ tasks: [], cleared: [{ id: 'ok' }] });
  });

  it('remembers only finished tasks, once each, and forgets one that comes back', () => {
    const previous = { tasks: [finished('a'), { id: 'b', completed: false }], cleared: [{ id: 'c', completedAt: null, clearedAt: 'x' }] };
    const now = new Date('2026-10-21T09:00:00.000Z');
    expect(nextCleared(previous, [], now)).toEqual([
      { id: 'c', completedAt: null, clearedAt: 'x' },
      { id: 'a', completedAt: '2026-10-20T08:00:00.000Z', clearedAt: '2026-10-21T09:00:00.000Z' },
    ]);
    expect(nextCleared(previous, [{ id: 'c' }, finished('a')], now)).toEqual([]);
  });
});
