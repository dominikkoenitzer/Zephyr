import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  applyBackup, backupCounts, backupFileName, collectBackupData, deleteAllData, isBackupKey, isValidBackup,
  lastBackupLabel, mergeBackup, mergeSessions, mergeSummary, mergeTaskRecords, readBackup, requestPersistentStorage,
  resetPersistRequest, shouldAskPersist, splitFileName, wipeAllData,
} from './backup';
import { localStorageService } from '../services/localStorage';

beforeEach(() => {
  localStorage.clear();
});

describe('isBackupKey', () => {
  it('claims Zephyr keys and the three unprefixed ones', () => {
    ['zephyr_tasks', 'zephyrSettings', 'focusTimerPresets', 'selectedFocusPreset', 'theme']
      .forEach((k) => expect(isBackupKey(k)).toBe(true));
  });

  it('leaves out the keys that describe this browser', () => {
    ['zephyr_last_backup', 'zephyr_storage_persist_asked'].forEach((k) => expect(isBackupKey(k)).toBe(false));
  });

  it('leaves other sites on the origin alone', () => {
    ['sentry-session', 'token', '', null, undefined].forEach((k) => expect(isBackupKey(k)).toBe(false));
  });
});

describe('collectBackupData', () => {
  it('copies our keys verbatim and skips the rest', () => {
    localStorage.setItem('zephyr_tasks', '{"tasks":[]}');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('someone-elses-key', 'nope');

    localStorage.setItem('zephyr_last_backup', '2026-09-28T10:00:00.000Z');

    const data = collectBackupData();
    expect(Object.keys(data).sort()).toEqual(['theme', 'zephyr_tasks']);
    expect(data.zephyr_tasks).toBe('{"tasks":[]}');
  });
});

describe('isValidBackup', () => {
  it('accepts our envelope and rejects anything else', () => {
    expect(isValidBackup({ app: 'zephyr', data: {} })).toBe(true);
    expect(isValidBackup({ app: 'other', data: {} })).toBe(false);
    expect(isValidBackup({ app: 'zephyr', data: null })).toBe(false);
    expect(isValidBackup({ app: 'zephyr' })).toBe(false);
    expect(isValidBackup(null)).toBe(false);
  });
});

describe('applyBackup', () => {
  it('restores our keys and ignores smuggled ones', () => {
    const restored = applyBackup({
      app: 'zephyr',
      data: { zephyr_tasks: '{"tasks":[1]}', theme: 'dark', evil: 'payload', nested: { a: 1 } },
    });

    expect(restored).toBe(2);
    expect(localStorage.getItem('zephyr_tasks')).toBe('{"tasks":[1]}');
    expect(localStorage.getItem('evil')).toBeNull();
    expect(localStorage.getItem('nested')).toBeNull();
  });

  it('keeps the last export date of this browser when an old file comes in', () => {
    localStorage.setItem('zephyr_last_backup', '2026-09-28T10:00:00.000Z');
    applyBackup({ app: 'zephyr', data: { zephyr_last_backup: '2026-01-01T10:00:00.000Z' } });
    expect(localStorage.getItem('zephyr_last_backup')).toBe('2026-09-28T10:00:00.000Z');
  });
});

describe('the running timer', () => {
  const running = JSON.stringify({ timeLeft: 600, isRunning: true, isBreak: false, lastSaved: 1 });

  it('stays out of an export', () => {
    localStorage.setItem('zephyr_timer_state', running);
    localStorage.setItem('zephyr_tasks', '{"tasks":[]}');
    expect(Object.keys(collectBackupData())).toEqual(['zephyr_tasks']);
  });

  it('is not imported, so an old file cannot finish a session that ran long ago', () => {
    const restored = applyBackup({ app: 'zephyr', data: { zephyr_timer_state: running } });
    expect(restored).toBe(0);
    expect(localStorage.getItem('zephyr_timer_state')).toBeNull();
  });

  it('still goes with "Delete my data"', () => {
    localStorage.setItem('zephyr_timer_state', running);
    wipeAllData();
    expect(localStorage.getItem('zephyr_timer_state')).toBeNull();
  });
});

describe('wipeAllData', () => {
  it('removes every key Zephyr owns and nothing else', () => {
    localStorage.setItem('zephyr_tasks', '1');
    localStorage.setItem('zephyr_notes', '1');
    localStorage.setItem('focusTimerPresets', '1');
    localStorage.setItem('gardenTheme', '1');
    localStorage.setItem('unrelated-app', 'keep me');

    localStorage.setItem('zephyr_last_backup', '1');

    expect(wipeAllData()).toBe(5);
    expect(localStorage.getItem('zephyr_last_backup')).toBeNull();
    expect(localStorage.getItem('zephyr_tasks')).toBeNull();
    expect(localStorage.getItem('gardenTheme')).toBeNull();
    expect(localStorage.getItem('unrelated-app')).toBe('keep me');
  });
});

describe('backupFileName', () => {
  it('is dated so two exports never collide in a downloads folder', () => {
    expect(backupFileName(new Date('2026-08-21T10:00:00Z'))).toBe('zephyr-backup-2026-08-21.json');
  });
});

describe('deleteAllData', () => {
  it('counts what was stored before it goes, not what is left after', () => {
    localStorage.setItem('zephyr_tasks', '1');
    localStorage.setItem('zephyr_focus_sessions', '1');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('unrelated-app', 'keep me');

    expect(deleteAllData()).toBe(3);
    expect(localStorage.getItem('zephyr_tasks')).toBeNull();
    expect(localStorage.getItem('unrelated-app')).toBe('keep me');
  });

  it('tells the open views that everything changed', () => {
    const seen = [];
    const listen = (e) => seen.push(e.detail.key);
    window.addEventListener('zephyr:change', listen);
    deleteAllData();
    window.removeEventListener('zephyr:change', listen);
    expect(seen).toEqual([null]);
  });
});

describe('lastBackupLabel', () => {
  const now = new Date(2026, 8, 29, 14, 0);

  it('says Never without a date', () => {
    expect(lastBackupLabel(null, now)).toBe('Never');
    expect(lastBackupLabel('not a date', now)).toBe('Never');
  });

  it('counts calendar days, not 24-hour stretches', () => {
    expect(lastBackupLabel(new Date(2026, 8, 29, 9, 0).toISOString(), now)).toBe('Today');
    expect(lastBackupLabel(new Date(2026, 8, 28, 23, 50).toISOString(), now)).toBe('Yesterday');
    expect(lastBackupLabel(new Date(2026, 8, 26, 20, 0).toISOString(), now)).toBe('3 days ago');
  });

  it('keeps a day a day across the October clock change', () => {
    const after = new Date(2026, 9, 26, 0, 30);
    expect(lastBackupLabel(new Date(2026, 9, 25, 0, 30).toISOString(), after)).toBe('Yesterday');
  });

  it('moves to weeks and then months', () => {
    expect(lastBackupLabel(new Date(2026, 8, 16).toISOString(), now)).toBe('13 days ago');
    expect(lastBackupLabel(new Date(2026, 8, 15).toISOString(), now)).toBe('2 weeks ago');
    expect(lastBackupLabel(new Date(2026, 5, 1).toISOString(), now)).toBe('4 months ago');
  });

  it('treats a date ahead of the clock as today', () => {
    expect(lastBackupLabel(new Date(2026, 9, 2).toISOString(), now)).toBe('Today');
  });
});

describe('shouldAskPersist', () => {
  const now = new Date('2026-09-29T12:00:00Z');

  it('asks when it has never asked', () => {
    expect(shouldAskPersist({ persisted: false, permission: 'prompt', askedAt: null, now })).toBe(true);
    expect(shouldAskPersist({ persisted: false, askedAt: 'garbage', now })).toBe(true);
  });

  it('does not ask when the storage is already kept or the answer was no', () => {
    expect(shouldAskPersist({ persisted: true, askedAt: null, now })).toBe(false);
    expect(shouldAskPersist({ persisted: false, permission: 'denied', askedAt: null, now })).toBe(false);
  });

  it('asks again only after a month', () => {
    expect(shouldAskPersist({ persisted: false, askedAt: '2026-09-10T12:00:00Z', now })).toBe(false);
    expect(shouldAskPersist({ persisted: false, askedAt: '2026-08-30T12:00:00Z', now })).toBe(true);
  });
});

describe('requestPersistentStorage', () => {
  const fakeStorage = ({ persisted = false, grant = true } = {}) => {
    const calls = { persist: 0 };
    return {
      calls,
      persisted: async () => persisted,
      persist: async () => {
        calls.persist += 1;
        return grant;
      },
    };
  };

  beforeEach(() => resetPersistRequest());

  it('asks once, remembers it, and does not ask again this month', async () => {
    const storage = fakeStorage();
    expect(await requestPersistentStorage({ storage, now: new Date('2026-09-29T12:00:00Z') })).toBe(true);
    expect(localStorage.getItem('zephyr_storage_persist_asked')).toBe('2026-09-29T12:00:00.000Z');

    resetPersistRequest();
    expect(await requestPersistentStorage({ storage, now: new Date('2026-10-05T12:00:00Z') })).toBe(false);
    expect(storage.calls.persist).toBe(1);
  });

  it('asks only once however often the page calls it', async () => {
    const storage = fakeStorage();
    await Promise.all([requestPersistentStorage({ storage }), requestPersistentStorage({ storage })]);
    expect(storage.calls.persist).toBe(1);
  });

  it('does not ask when the storage is already kept or the answer was no', async () => {
    const kept = fakeStorage({ persisted: true });
    expect(await requestPersistentStorage({ storage: kept })).toBe(true);
    expect(kept.calls.persist).toBe(0);

    resetPersistRequest();
    const storage = fakeStorage();
    const permissions = { query: async () => ({ state: 'denied' }) };
    expect(await requestPersistentStorage({ storage, permissions })).toBe(false);
    expect(storage.calls.persist).toBe(0);
  });

  it('does nothing where the browser has no storage manager', async () => {
    expect(await requestPersistentStorage({ storage: undefined })).toBe(false);
  });
});

const T = (id, extra = {}) => ({ id, title: id, completed: false, createdAt: '2026-10-01T08:00:00.000Z', ...extra });
const record = (tasks, cleared) => JSON.stringify(cleared ? { tasks, cleared, lastUpdated: 1 } : { tasks, lastUpdated: 1 });
const file = (data) => ({ app: 'zephyr', version: 1, data });
const stored = () => JSON.parse(localStorage.getItem('zephyr_tasks'));
const snapshot = () => {
  const all = {};
  for (let i = 0; i < localStorage.length; i += 1) all[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
  return all;
};

describe('readBackup', () => {
  it('accepts an export of this app', () => {
    const text = JSON.stringify(file({ zephyr_tasks: record([T('a')]), zephyr_focus_sessions: '[]' }));
    expect(readBackup(text)).toEqual({ ok: true, backup: JSON.parse(text) });
  });

  it('refuses text that is not JSON, a foreign file, and a file whose tasks cannot be read', () => {
    expect(readBackup('{oops')).toEqual({ ok: false, reason: 'unreadable' });
    expect(readBackup(JSON.stringify({ app: 'other', data: {} }))).toEqual({ ok: false, reason: 'foreign' });
    [
      { zephyr_tasks: '{broken' },
      { zephyr_tasks: JSON.stringify({ tasks: 'nope' }) },
      { zephyr_tasks: JSON.stringify({ tasks: [{ title: 'no id' }] }) },
      { zephyr_tasks: { tasks: [] } },
      { zephyr_focus_sessions: '{"not":"a list"}' },
      { zephyr_focus_sessions: '[1, 2]' },
    ].forEach((data) => expect(readBackup(JSON.stringify(file(data)))).toEqual({ ok: false, reason: 'unreadable' }));
  });

  it('refuses a file whose settings are not an object', () => {
    ['null', '[]', '5', '{broken', { autoStartBreaks: true }].forEach((settings) =>
      expect(readBackup(JSON.stringify(file({ zephyr_settings: settings })))).toEqual({ ok: false, reason: 'unreadable' })
    );
    expect(readBackup(JSON.stringify(file({ zephyr_settings: JSON.stringify({ autoStartBreaks: true }) }))).ok).toBe(true);
  });

  it('refuses a file whose view preferences are not an object', () => {
    ['null', '[]', '5', '{broken', { taskView: 'today' }].forEach((prefs) =>
      expect(readBackup(JSON.stringify(file({ zephyr_view_prefs: prefs })))).toEqual({ ok: false, reason: 'unreadable' })
    );
    expect(readBackup(JSON.stringify(file({ zephyr_view_prefs: JSON.stringify({ taskView: 'today' }) }))).ok).toBe(true);
  });
});

describe('splitFileName', () => {
  it('keeps the end of the name whole, from the nearest separator, and hands the rest to the part that may be cut', () => {
    expect(splitFileName('zephyr-backup-2026-10-20-from-the-old-laptop (2).json')).toEqual({
      head: 'zephyr-backup-2026-10-20-from-the-old-',
      tail: 'laptop (2).json',
    });
    expect(splitFileName('zephyr-backup-2026-10-20.json')).toEqual({ head: 'zephyr-backup-', tail: '2026-10-20.json' });
    expect(splitFileName(`a-${'b'.repeat(30)}.json`)).toEqual({ head: `a-${'b'.repeat(23)}`, tail: 'bbbbbbb.json' });
    expect(splitFileName('short.json')).toEqual({ head: '', tail: 'short.json' });
    expect(splitFileName('exactly-12ch', 12)).toEqual({ head: '', tail: 'exactly-12ch' });
  });
});

describe('mergeSummary', () => {
  it('names only what the file brought, in the singular or plural', () => {
    expect(mergeSummary({ added: 1, updated: 1, sessions: 0 })).toBe('1 new task, 1 updated.');
    expect(mergeSummary({ added: 2, updated: 0, sessions: 3 })).toBe('2 new tasks, 3 new sessions.');
    expect(mergeSummary({ added: 0, updated: 1, sessions: 0 })).toBe('1 task updated.');
    expect(mergeSummary({ added: 0, updated: 4, sessions: 1 })).toBe('4 tasks updated, 1 new session.');
    expect(mergeSummary({ added: 0, updated: 0, sessions: 0 })).toBe('Nothing new in the file.');
  });
});

describe('backupCounts', () => {
  it('counts tasks and sessions, and reads missing or damaged values as none', () => {
    expect(backupCounts({ zephyr_tasks: record([T('a'), T('b')]), zephyr_focus_sessions: '[{},{},{}]' }))
      .toEqual({ tasks: 2, sessions: 3 });
    expect(backupCounts({})).toEqual({ tasks: 0, sessions: 0 });
    expect(backupCounts({ zephyr_focus_sessions: '{bad' })).toEqual({ tasks: 0, sessions: 0 });
  });
});

describe('mergeTaskRecords', () => {
  const none = { tasks: [], cleared: [] };

  it('adds the tasks this device does not have, after its own', () => {
    const merged = mergeTaskRecords({ tasks: [T('a')], cleared: [] }, { tasks: [T('b'), T('c')], cleared: [] });
    expect(merged.tasks.map((t) => t.id)).toEqual(['a', 'b', 'c']);
    expect([merged.added, merged.updated]).toEqual([2, 0]);
  });

  it("keeps the newer copy when both sides have an id, in this device's place", () => {
    const mine = { tasks: [T('a', { title: 'old', updatedAt: '2026-10-02T08:00:00.000Z' }), T('b')], cleared: [] };
    const theirs = { tasks: [T('a', { title: 'new', updatedAt: '2026-10-03T08:00:00.000Z' })], cleared: [] };
    const merged = mergeTaskRecords(mine, theirs);
    expect(merged.tasks.map((t) => [t.id, t.title])).toEqual([['a', 'new'], ['b', 'b']]);
    expect([merged.added, merged.updated]).toEqual([0, 1]);

    const back = mergeTaskRecords(theirs, mine);
    expect(back.tasks.map((t) => t.title)).toEqual(['new', 'b']);
    expect([back.added, back.updated]).toEqual([1, 0]);
  });

  it('uses the time a task was finished when it was never edited', () => {
    const mine = { tasks: [T('a')], cleared: [] };
    const theirs = { tasks: [T('a', { completed: true, completedAt: '2026-10-05T08:00:00.000Z' })], cleared: [] };
    expect(mergeTaskRecords(mine, theirs).tasks[0].completed).toBe(true);
  });

  it("keeps this device's copy on a tie", () => {
    const merged = mergeTaskRecords({ tasks: [T('a', { title: 'mine' })], cleared: [] }, { tasks: [T('a', { title: 'theirs' })], cleared: [] });
    expect(merged.tasks[0].title).toBe('mine');
    expect(merged.updated).toBe(0);
  });

  it('takes one copy of an id the file holds twice, the newer one', () => {
    const theirs = {
      tasks: [T('a', { title: 'older' }), T('a', { title: 'newer', updatedAt: '2026-10-09T08:00:00.000Z' })],
      cleared: [],
    };
    const merged = mergeTaskRecords(none, theirs);
    expect(merged.tasks.map((t) => t.title)).toEqual(['newer']);
    expect(merged.added).toBe(1);
  });

  it('leaves two local tasks that share an id both in place', () => {
    const merged = mergeTaskRecords({ tasks: [T('a', { title: 'one' }), T('a', { title: 'two' })], cleared: [] }, none);
    expect(merged.tasks.map((t) => t.title)).toEqual(['one', 'two']);
  });

  it('keeps both, unchanged, when the second of two local tasks with one id is newer', () => {
    const mine = {
      tasks: [T('a', { title: 'one' }), T('a', { title: 'two', updatedAt: '2026-10-09T08:00:00.000Z' }), T('b')],
      cleared: [],
    };
    const theirs = { tasks: [T('a', { title: 'theirs', updatedAt: '2026-10-10T08:00:00.000Z' })], cleared: [] };
    const merged = mergeTaskRecords(mine, theirs);
    expect(merged.tasks.map((t) => t.title)).toEqual(['one', 'two', 'b']);
    expect([merged.added, merged.updated]).toEqual([0, 0]);
  });

  it('weighs a cleared task by when it was cleared', () => {
    const cleared = { id: 'a', completedAt: '2026-10-04T08:00:00.000Z', clearedAt: '2026-10-05T08:00:00.000Z' };
    const olderCopy = T('a', { completed: true, completedAt: '2026-10-04T08:00:00.000Z' });
    const stays = mergeTaskRecords({ tasks: [], cleared: [cleared] }, { tasks: [olderCopy], cleared: [] });
    expect(stays.tasks).toEqual([]);
    expect(stays.cleared).toEqual([cleared]);

    const reopened = T('a', { updatedAt: '2026-10-06T08:00:00.000Z' });
    const back = mergeTaskRecords({ tasks: [], cleared: [cleared] }, { tasks: [reopened], cleared: [] });
    expect(back.tasks).toEqual([reopened]);
    expect(back.cleared).toEqual([]);
  });

  it('brings over the cleared tasks of the other device once', () => {
    const entry = { id: 'z', completedAt: '2026-10-04T08:00:00.000Z', clearedAt: '2026-10-05T08:00:00.000Z' };
    const other = { id: 'y', completedAt: null, clearedAt: '2026-10-06T08:00:00.000Z' };
    const merged = mergeTaskRecords({ tasks: [], cleared: [entry] }, { tasks: [], cleared: [entry, other] });
    expect(merged.cleared.map((c) => c.id)).toEqual(['z', 'y']);
  });
});

describe('mergeSessions', () => {
  it('adds the sessions this device lacks, by id or by start time, oldest first', () => {
    const mine = [{ id: 's1', date: '2026-10-02T08:00:00.000Z' }, { date: '2026-10-03T08:00:00.000Z' }];
    const theirs = [
      { id: 's1', date: '2026-10-02T08:00:00.000Z' },
      { date: '2026-10-03T08:00:00.000Z' },
      { id: 's0', date: '2026-10-01T08:00:00.000Z' },
    ];
    const merged = mergeSessions(mine, theirs);
    expect(merged.added).toBe(1);
    expect(merged.sessions.map((s) => s.id ?? s.date)).toEqual(['s0', 's1', '2026-10-03T08:00:00.000Z']);
  });

  it('matches a session with neither id nor start time by its content', () => {
    const merged = mergeSessions([{ duration: 1500 }, null], [{ duration: 1500 }, { duration: 300 }]);
    expect(merged.added).toBe(1);
    expect(mergeSessions(merged.sessions, [{ duration: 300 }]).added).toBe(0);
  });
});

describe('Replace and Merge', () => {
  const mine = () => {
    localStorage.setItem('zephyr_tasks', record([T('a', { title: 'mine' }), T('b')]));
    localStorage.setItem('zephyr_focus_sessions', JSON.stringify([{ id: 's1', date: '2026-10-02T08:00:00.000Z' }]));
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('zephyr_settings', '{"workDuration":50}');
  };
  const theirs = file({
    zephyr_tasks: record([T('a', { title: 'theirs', updatedAt: '2026-10-08T08:00:00.000Z' }), T('c')]),
    zephyr_focus_sessions: JSON.stringify([{ id: 's2', date: '2026-10-03T08:00:00.000Z' }]),
    theme: 'light',
    zephyr_settings: '{"workDuration":25}',
    focusTimerPresets: '[{"id":"custom-1"}]',
  });

  it('Replace puts the file in place of the list, settings included', () => {
    mine();
    applyBackup(theirs);
    expect(stored().tasks.map((t) => t.id)).toEqual(['a', 'c']);
    expect(localStorage.getItem('theme')).toBe('light');
    expect(localStorage.getItem('zephyr_settings')).toBe('{"workDuration":25}');
  });

  it("Merge adds and updates tasks and sessions but keeps this device's settings", () => {
    mine();
    expect(mergeBackup(theirs)).toEqual({ added: 1, updated: 1, sessions: 1 });
    expect(stored().tasks.map((t) => [t.id, t.title])).toEqual([['a', 'theirs'], ['b', 'b'], ['c', 'c']]);
    expect(localStorageService.getFocusSessions().map((s) => s.id)).toEqual(['s1', 's2']);
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(localStorage.getItem('zephyr_settings')).toBe('{"workDuration":50}');
    // A key this device never wrote is taken from the file.
    expect(localStorage.getItem('focusTimerPresets')).toBe('[{"id":"custom-1"}]');
  });

  it('Merge twice changes nothing the second time', () => {
    mine();
    mergeBackup(theirs);
    const sessions = localStorage.getItem('zephyr_focus_sessions');
    const tasks = stored().tasks;
    expect(mergeBackup(theirs)).toEqual({ added: 0, updated: 0, sessions: 0 });
    expect(stored().tasks).toEqual(tasks);
    expect(localStorage.getItem('zephyr_focus_sessions')).toBe(sessions);
  });

  it('Merge keeps the later streak and the later last session', () => {
    localStorage.setItem('zephyr_focus_streak', '{"count":3,"lastDate":"2026-10-05"}');
    localStorage.setItem('zephyr_last_focus_session', '{"completedAt":"2026-10-09T08:00:00.000Z"}');
    mergeBackup(file({
      zephyr_focus_streak: '{"count":9,"lastDate":"2026-10-07"}',
      zephyr_last_focus_session: '{"completedAt":"2026-10-01T08:00:00.000Z"}',
    }));
    expect(localStorage.getItem('zephyr_focus_streak')).toBe('{"count":9,"lastDate":"2026-10-07"}');
    expect(localStorage.getItem('zephyr_last_focus_session')).toBe('{"completedAt":"2026-10-09T08:00:00.000Z"}');
  });

  it('Merge breaks a streak tie on the same day by the longer count', () => {
    localStorage.setItem('zephyr_focus_streak', '{"count":3,"lastDate":"2026-10-07"}');
    mergeBackup(file({ zephyr_focus_streak: '{"count":5,"lastDate":"2026-10-07"}' }));
    expect(localStorage.getItem('zephyr_focus_streak')).toBe('{"count":5,"lastDate":"2026-10-07"}');
    mergeBackup(file({ zephyr_focus_streak: '{"count":2,"lastDate":"2026-10-07"}' }));
    expect(localStorage.getItem('zephyr_focus_streak')).toBe('{"count":5,"lastDate":"2026-10-07"}');
  });

  it('Merge writes nothing when the browser refuses one of its writes', () => {
    mine();
    const before = snapshot();
    const setItem = Storage.prototype.setItem;
    let calls = 0;
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function failing(key, value) {
      calls += 1;
      if (calls === 2) throw new Error('QuotaExceededError');
      return setItem.call(this, key, value);
    });
    try {
      expect(() => mergeBackup(theirs)).toThrow('QuotaExceededError');
    } finally {
      spy.mockRestore();
    }
    expect(snapshot()).toEqual(before);
  });

  it('Replace writes nothing when the browser refuses one of its writes', () => {
    mine();
    const before = snapshot();
    // A key this device does not have goes first, so it has to be taken out again.
    const replacing = file({
      focusTimerPresets: '[{"id":"custom-1"}]',
      zephyr_tasks: record([T('c')]),
      theme: 'light',
      zephyr_settings: '{"workDuration":25}',
    });
    const setItem = Storage.prototype.setItem;
    let calls = 0;
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function failing(key, value) {
      calls += 1;
      if (calls === 4) throw new Error('QuotaExceededError');
      return setItem.call(this, key, value);
    });
    try {
      expect(() => applyBackup(replacing)).toThrow('QuotaExceededError');
    } finally {
      spy.mockRestore();
    }
    expect(snapshot()).toEqual(before);
  });

  it('Replace puts back a value it shrank when a later write takes the room it freed', () => {
    localStorage.setItem('zephyr_settings', JSON.stringify({ workDuration: 50, note: 'x'.repeat(400) }));
    const before = snapshot();
    const size = (all) => Object.entries(all).reduce((n, [key, value]) => n + key.length + value.length, 0);
    const quota = size(before) + 100;
    const setItem = Storage.prototype.setItem;
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function full(key, value) {
      if (size({ ...snapshot(), [key]: String(value) }) > quota) throw new Error('QuotaExceededError');
      return setItem.call(this, key, value);
    });
    // The settings shrink, the theme fills the room they freed, and the presets do not fit.
    const replacing = file({
      zephyr_settings: '{"workDuration":25}',
      theme: 'y'.repeat(380),
      focusTimerPresets: 'z'.repeat(500),
    });
    try {
      expect(() => applyBackup(replacing)).toThrow('QuotaExceededError');
    } finally {
      spy.mockRestore();
    }
    expect(snapshot()).toEqual(before);
  });

  it('Merge leaves out the keys that describe a browser, like Replace', () => {
    mergeBackup(file({ zephyr_timer_state: '{"isRunning":true}', zephyr_last_backup: '2026-01-01T00:00:00.000Z' }));
    expect(localStorage.getItem('zephyr_timer_state')).toBeNull();
    expect(localStorage.getItem('zephyr_last_backup')).toBeNull();
  });

  it('Merge keeps the tasks cleared on this device in the Done count', () => {
    localStorage.setItem('zephyr_tasks', record([], [{ id: 'x', completedAt: '2026-10-04T08:00:00.000Z', clearedAt: '2026-10-04T09:00:00.000Z' }]));
    mergeBackup(file({ zephyr_tasks: record([T('y', { completed: true, completedAt: '2026-10-05T08:00:00.000Z' })]) }));
    expect(localStorageService.getClearedTasks().map((c) => c.id)).toEqual(['x']);
    expect(localStorageService.getTasks().map((t) => t.id)).toEqual(['y']);
  });

  it('a damaged file is refused and nothing on this device changes', () => {
    mine();
    const before = snapshot();
    const result = readBackup(JSON.stringify(file({ zephyr_tasks: '{"tasks":[{"title":"no id"}]}', theme: 'light' })));
    expect(result.ok).toBe(false);
    expect(snapshot()).toEqual(before);
  });
});
