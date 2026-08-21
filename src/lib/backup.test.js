import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyBackup, backupFileName, collectBackupData, isBackupKey, isValidBackup, wipeAllData,
} from './backup';

beforeEach(() => {
  localStorage.clear();
});

describe('isBackupKey', () => {
  it('claims Zephyr keys and the three unprefixed ones', () => {
    ['zephyr_tasks', 'zephyrSettings', 'focusTimerPresets', 'selectedFocusPreset', 'theme']
      .forEach((k) => expect(isBackupKey(k)).toBe(true));
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
});

describe('wipeAllData', () => {
  it('removes every key Zephyr owns and nothing else', () => {
    localStorage.setItem('zephyr_tasks', '1');
    localStorage.setItem('zephyr_notes', '1');
    localStorage.setItem('focusTimerPresets', '1');
    localStorage.setItem('gardenTheme', '1');
    localStorage.setItem('unrelated-app', 'keep me');

    expect(wipeAllData()).toBe(4);
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
