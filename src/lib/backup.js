// Backup file handling, shared by the Settings page and the ⌘K palette.
// A backup is every Zephyr-owned localStorage key, verbatim, wrapped in a
// small envelope so a foreign JSON file can be rejected before it overwrites
// anything.

// Keys that belong to the app but aren't `zephyr`-prefixed.
export const EXTRA_BACKUP_KEYS = ['focusTimerPresets', 'selectedFocusPreset', 'theme'];

export const isBackupKey = (key) =>
  typeof key === 'string' && (key.startsWith('zephyr') || EXTRA_BACKUP_KEYS.includes(key));

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
 * Remove every key Zephyr owns — and nothing else.
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
    if (isBackupKey(key) || LEGACY_KEYS.includes(key)) doomed.push(key);
  }
  doomed.forEach((key) => localStorage.removeItem(key));
  return doomed.length;
}
