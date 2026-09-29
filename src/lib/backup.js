// Backup file handling, shared by the Settings page and the ⌘K palette.
// A backup is every Zephyr-owned localStorage key, verbatim, wrapped in a
// small envelope so a foreign JSON file can be rejected before it overwrites
// anything.

import { STORAGE_KEYS, localStorageService } from '../services/localStorage';

// Keys that belong to the app but aren't `zephyr`-prefixed.
export const EXTRA_BACKUP_KEYS = ['focusTimerPresets', 'selectedFocusPreset', 'theme'];

/**
 * Zephyr's keys that describe this browser, not the user's data: when this
 * browser last exported, and when it last asked to keep its storage. They
 * stay out of a backup, so importing an old file cannot make the last export
 * look older or newer than it was. "Delete my data" still removes them.
 */
export const DEVICE_KEYS = [STORAGE_KEYS.LAST_BACKUP, STORAGE_KEYS.PERSIST_ASKED];

export const isBackupKey = (key) =>
  typeof key === 'string'
  && !DEVICE_KEYS.includes(key)
  && (key.startsWith('zephyr') || EXTRA_BACKUP_KEYS.includes(key));

export const BACKUP_VERSION = 1;

/** Every backup-worthy key and its raw stored string. */
export function collectBackupData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (isBackupKey(key)) data[key] = localStorage.getItem(key);
  }
  return data;
}

export const backupFileName = (date = new Date()) =>
  `zephyr-backup-${date.toISOString().slice(0, 10)}.json`;

/**
 * Hand the browser a backup file to save.
 * @returns {{ fileName: string, keys: number }}
 */
export function downloadBackup() {
  const data = collectBackupData();
  const backup = {
    app: 'zephyr',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  );
  const fileName = backupFileName();
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  localStorageService.saveLastBackup();
  return { fileName, keys: Object.keys(data).length };
}

/** True when a parsed object actually looks like one of our backups. */
export const isValidBackup = (backup) =>
  !!backup && backup.app === 'zephyr' && typeof backup.data === 'object' && backup.data !== null;

/**
 * Write a validated backup back into localStorage.
 * @returns {number} how many keys were restored.
 */
export function applyBackup(backup) {
  let restored = 0;
  Object.entries(backup.data).forEach(([key, value]) => {
    if (isBackupKey(key) && typeof value === 'string') {
      localStorage.setItem(key, value);
      restored += 1;
    }
  });
  return restored;
}

/** Keys from long-dead versions that no longer appear in STORAGE_KEYS. */
export const LEGACY_KEYS = ['gardenTheme'];

/**
 * Remove every key Zephyr owns, and nothing else.
 *
 * The Settings page used to finish its wipe with `localStorage.clear()`, which
 * empties the whole origin. It happens to be harmless on zephyr.punds.ch today,
 * but "delete my data" should never mean "delete everything anyone stored here".
 *
 * @returns {number} how many keys were removed.
 */
export function wipeAllData() {
  const doomed = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (isBackupKey(key) || DEVICE_KEYS.includes(key) || LEGACY_KEYS.includes(key)) doomed.push(key);
  }
  doomed.forEach((key) => localStorage.removeItem(key));
  return doomed.length;
}

/**
 * "Delete all data" in Settings: every Zephyr key goes, and the count is of
 * what was really there. Settings used to clear the keys first and count
 * afterwards, so it always reported "Cleared 0 stored items".
 *
 * @returns {number} how many keys were removed.
 */
export function deleteAllData() {
  const removed = wipeAllData();
  try {
    window.dispatchEvent(new CustomEvent('zephyr:change', { detail: { key: null } }));
  } catch {
    // Outside a browser there is nothing listening.
  }
  return removed;
}

const startOfDay = (date) => new Date(date).setHours(0, 0, 0, 0);

/**
 * "Last backup" in Settings: how long ago the last export was, in calendar
 * days (rounded, so a clock change does not add one), or "Never".
 */
export function lastBackupLabel(at, now = new Date()) {
  const then = at ? new Date(at) : null;
  if (!then || Number.isNaN(then.getTime())) return 'Never';
  const days = Math.round((startOfDay(now) - startOfDay(then)) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export const PERSIST_ASK_EVERY_DAYS = 30;

/**
 * Whether to ask the browser to keep Zephyr's storage through a clean-up.
 * Not when it already does, not when the answer was no, and not more than
 * once a month otherwise: Chromium decides quietly and may say yes later,
 * but Firefox asks the person, and a prompt on every visit is spam.
 */
export function shouldAskPersist({ persisted, permission, askedAt, now = new Date() }) {
  if (persisted || permission === 'denied') return false;
  const asked = askedAt ? new Date(askedAt).getTime() : NaN;
  if (Number.isNaN(asked)) return true;
  return new Date(now).getTime() - asked >= PERSIST_ASK_EVERY_DAYS * 86_400_000;
}

let persistRequest = null;

/**
 * Ask the browser once per visit, and within shouldAskPersist's limits, not
 * to clear Zephyr's storage when space runs low. Everything lives in this
 * browser, so an eviction would be the whole list gone.
 *
 * @returns {Promise<boolean>} whether the storage is kept.
 */
export function requestPersistentStorage({
  storage = globalThis.navigator?.storage,
  permissions = globalThis.navigator?.permissions,
  now = new Date(),
} = {}) {
  if (!persistRequest) {
    persistRequest = (async () => {
      if (typeof storage?.persist !== 'function' || typeof storage?.persisted !== 'function') return false;
      try {
        if (await storage.persisted()) return true;
        let permission;
        try {
          permission = (await permissions?.query?.({ name: 'persistent-storage' }))?.state;
        } catch {
          // Not every browser knows this permission's name.
        }
        const askedAt = localStorageService.getPersistAsked();
        if (!shouldAskPersist({ persisted: false, permission, askedAt, now })) return false;
        localStorageService.savePersistAsked(now);
        return Boolean(await storage.persist());
      } catch {
        return false;
      }
    })();
  }
  return persistRequest;
}

/** For tests: forget this visit's request. */
export const resetPersistRequest = () => {
  persistRequest = null;
};
