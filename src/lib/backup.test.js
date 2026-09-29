import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyBackup, backupFileName, collectBackupData, deleteAllData, isBackupKey, isValidBackup, lastBackupLabel,
  requestPersistentStorage, resetPersistRequest, shouldAskPersist, wipeAllData,
} from './backup';

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
