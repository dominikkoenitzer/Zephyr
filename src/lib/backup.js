// Backup file handling, shared by the Settings page and the ⌘K palette.
// A backup is every Zephyr-owned localStorage key, verbatim, wrapped in a
// small envelope so a foreign JSON file can be rejected before it overwrites
// anything.

import { PRESETS_KEY } from '../services/focusTimer';
import {
  DEVICE_KEYS, EXTRA_BACKUP_KEYS, STORAGE_KEYS, isBackupKey, isSession, localStorageService, readTaskRecord,
} from '../services/localStorage';
import { NOTIFICATIONS_KEY, isNotificationList, notificationService } from '../services/notificationService';

// Which keys a backup carries is decided next to STORAGE_KEYS, because the
// storage size in Settings counts the same keys and localStorage.js cannot
// import this file back.
export { EXTRA_BACKUP_KEYS, DEVICE_KEYS, isBackupKey };

export const BACKUP_VERSION = 1;

// How the app reads each value the import checks whole.
const appReaders = {
  [STORAGE_KEYS.TASKS]: () => readTaskRecord(localStorage.getItem(STORAGE_KEYS.TASKS)),
  [NOTIFICATIONS_KEY]: () => notificationService.readStored(),
  [STORAGE_KEYS.FOCUS_SESSIONS]: () => localStorageService.getFocusSessions(),
  [STORAGE_KEYS.SETTINGS]: () => localStorageService.getSettings(),
  [STORAGE_KEYS.VIEW_PREFS]: () => localStorageService.getViewPrefs(),
};

/** Every backup-worthy key and its raw stored string. */
export function collectBackupData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (isBackupKey(key)) data[key] = localStorage.getItem(key);
  }
  // A stored value an import would refuse goes out as the app reads it, when the import takes that reading.
  Object.entries(appReaders).forEach(([key, read]) => {
    if (data[key] === undefined || hasReadableData({ [key]: data[key] })) return;
    const value = JSON.stringify(read());
    if (hasReadableData({ [key]: value })) data[key] = value;
  });
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

const parseJson = (value) => {
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch {
    return { ok: false };
  }
};

const isObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
const isText = (value) => typeof value === 'string';

// The task readers call list and text methods on the tags, the title and the description.
const isReadableTask = (task) =>
  isObject(task) &&
  isText(task.id) &&
  (task.tags == null || (Array.isArray(task.tags) && task.tags.every(isText))) &&
  (task.title == null || isText(task.title)) &&
  (task.description == null || isText(task.description));

// The task a session was for is shown by its title; older sessions may hold none, or plain text.
const hasTextTitle = (task) => !isObject(task) || task.title == null || isText(task.title);

/**
 * The tasks, notifications, sessions, settings and view preferences inside
 * a backup are checked before anything is written, so a damaged file is
 * refused whole instead of replacing a working list with one the app cannot
 * read.
 */
function hasReadableData(data) {
  const tasks = data[STORAGE_KEYS.TASKS];
  if (tasks !== undefined) {
    const parsed = typeof tasks === 'string' ? parseJson(tasks) : { ok: false };
    if (!parsed.ok || !isObject(parsed.value) || !Array.isArray(parsed.value.tasks)) return false;
    if (!parsed.value.tasks.every(isReadableTask)) return false;
  }
  const notifications = data[NOTIFICATIONS_KEY];
  if (notifications !== undefined) {
    const parsed = typeof notifications === 'string' ? parseJson(notifications) : { ok: false };
    if (!parsed.ok || !isNotificationList(parsed.value)) return false;
  }
  const sessions = data[STORAGE_KEYS.FOCUS_SESSIONS];
  if (sessions !== undefined) {
    const parsed = typeof sessions === 'string' ? parseJson(sessions) : { ok: false };
    if (!parsed.ok || !Array.isArray(parsed.value)) return false;
    if (!parsed.value.every((session) => isObject(session) && hasTextTitle(session.task))) return false;
  }
  // Resume hands the last session's task to the timer, whose title the sidebar and Home show.
  const last = parseJson(data[STORAGE_KEYS.LAST_SESSION]);
  if (last.ok && isObject(last.value) && !hasTextTitle(last.value.task)) return false;
  const settings = data[STORAGE_KEYS.SETTINGS];
  if (settings !== undefined) {
    const parsed = typeof settings === 'string' ? parseJson(settings) : { ok: false };
    if (!parsed.ok || !isObject(parsed.value)) return false;
  }
  const prefs = data[STORAGE_KEYS.VIEW_PREFS];
  if (prefs !== undefined) {
    const parsed = typeof prefs === 'string' ? parseJson(prefs) : { ok: false };
    if (!parsed.ok || !isObject(parsed.value)) return false;
  }
  // The Focus page shows each preset's name.
  const presets = parseJson(data[PRESETS_KEY]);
  if (presets.ok && Array.isArray(presets.value)) {
    if (presets.value.some((p) => isObject(p) && p.name != null && typeof p.name !== 'string')) return false;
  }
  return true;
}

/**
 * Read a picked file's text as a backup.
 * @returns {{ ok: true, backup: object } | { ok: false, reason: 'unreadable' | 'foreign' }}
 */
export function readBackup(text) {
  const parsed = parseJson(text);
  if (!parsed.ok) return { ok: false, reason: 'unreadable' };
  if (!isValidBackup(parsed.value)) return { ok: false, reason: 'foreign' };
  if (!hasReadableData(parsed.value.data)) return { ok: false, reason: 'unreadable' };
  return { ok: true, backup: parsed.value };
}

/** How many tasks and sessions a set of stored values holds, for the import dialog. */
export function backupCounts(data) {
  const tasks = readTaskRecord(data[STORAGE_KEYS.TASKS]).tasks.length;
  const parsed = parseJson(data[STORAGE_KEYS.FOCUS_SESSIONS] ?? '[]');
  const sessions = parsed.ok && Array.isArray(parsed.value) ? parsed.value.filter(isSession).length : 0;
  return { tasks, sessions };
}

/**
 * A file name in two parts for a line that may be cut short: the end keeps
 * the extension and whatever sets one backup apart from the next, so the
 * cut lands in the middle of the name instead of at its end. The tail
 * starts after a separator where one is near, so the cut never splits a
 * word and a default name keeps its date whole.
 */
export function splitFileName(name, keep = 12, most = 20) {
  if (name.length <= keep) return { head: '', tail: name };
  let at = name.length - keep;
  const separator = Math.max(...['-', '_', ' ', '.'].map((c) => name.lastIndexOf(c, at)));
  if (separator > 0 && name.length - separator - 1 <= most) at = separator + 1;
  return { head: name.slice(0, at), tail: name.slice(at) };
}

const count = (n, noun) => `${n} ${noun}${n === 1 ? '' : 's'}`;

/** One line for the toast after a merge: what the file added, zeros left out. */
export function mergeSummary({ added, updated, sessions }) {
  const parts = [];
  if (added) parts.push(`${count(added, 'new task')}`);
  if (updated) parts.push(added ? `${updated} updated` : `${count(updated, 'task')} updated`);
  if (sessions) parts.push(count(sessions, 'new session'));
  return parts.length ? `${parts.join(', ')}.` : 'Nothing new in the file.';
}

/** One line for the toast after a Replace: the tasks and sessions now here, zeros left out. */
export function restoreSummary({ tasks, sessions }) {
  const parts = [];
  if (tasks) parts.push(count(tasks, 'task'));
  if (sessions) parts.push(count(sessions, 'session'));
  return parts.length ? `${parts.join(', ')}.` : 'No tasks or sessions in the file.';
}

const time = (value) => {
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
};

/** When a task last changed: edited, finished or made, whichever is latest. */
export const taskStamp = (task) =>
  Math.max(time(task?.updatedAt), time(task?.completedAt), time(task?.createdAt));

/**
 * Two task records as one. Tasks are matched by id; where both sides have
 * one, the later change wins and a tie keeps this device's. A cleared entry
 * takes part too: a task cleared after its last change elsewhere stays
 * cleared, and one changed after it was cleared comes back. This device's
 * order is kept, the file's new tasks follow in the file's order.
 *
 * @returns {{ tasks: object[], cleared: object[], added: number, updated: number }}
 */
export function mergeTaskRecords(local, incoming) {
  const best = new Map();
  const offer = (id, candidate) => {
    const current = best.get(id);
    if (!current || candidate.stamp > current.stamp) best.set(id, candidate);
  };
  local.tasks.forEach((task) => offer(task.id, { kind: 'task', item: task, stamp: taskStamp(task) }));
  local.cleared.forEach((entry) => offer(entry.id, { kind: 'cleared', item: entry, stamp: time(entry.clearedAt) }));
  incoming.tasks.forEach((task) => offer(task.id, { kind: 'task', item: task, stamp: taskStamp(task) }));
  incoming.cleared.forEach((entry) => offer(entry.id, { kind: 'cleared', item: entry, stamp: time(entry.clearedAt) }));

  // Local tasks that share an id (ids were once a bare timestamp) all stay as
  // they are, and the file cannot replace them: there is no telling which one
  // its copy means.
  const seen = new Set();
  const shared = new Set();
  local.tasks.forEach((task) => {
    if (seen.has(task.id)) shared.add(task.id);
    seen.add(task.id);
  });

  const tasks = [];
  const placed = new Set();
  let added = 0;
  let updated = 0;
  local.tasks.forEach((task) => {
    if (typeof task.id !== 'string' || shared.has(task.id)) {
      tasks.push(task);
      placed.add(task.id);
      return;
    }
    placed.add(task.id);
    const winner = best.get(task.id);
    if (winner.kind === 'task') tasks.push(winner.item);
    if (winner.item !== task) updated += 1;
  });
  incoming.tasks.forEach((task) => {
    if (placed.has(task.id)) return;
    const winner = best.get(task.id);
    if (winner.item !== task) return;
    placed.add(task.id);
    tasks.push(task);
    added += 1;
  });

  const listed = new Set(tasks.map((task) => task.id));
  const cleared = [...best.entries()]
    .filter(([id, winner]) => winner.kind === 'cleared' && !listed.has(id))
    .map(([, winner]) => winner.item);
  return { tasks, cleared, added, updated };
}

/** Sessions from both sides, matched by id (or start time), oldest first. */
export function mergeSessions(local, incoming) {
  // A session with neither is matched by its whole content.
  const keyOf = (s) => s?.id ?? s?.date ?? JSON.stringify(s);
  const seen = new Set(local.map(keyOf));
  const fresh = incoming.filter((s) => {
    const key = keyOf(s);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const sessions = [...local, ...fresh].sort((a, b) => time(a?.date) - time(b?.date));
  return { sessions, added: fresh.length };
}

const readJson = (raw, fallback) => {
  const parsed = raw == null ? { ok: false } : parseJson(raw);
  return parsed.ok ? parsed.value : fallback;
};

/**
 * Add a validated backup to what this device already has. Tasks and sessions
 * are merged (mergeTaskRecords, mergeSessions); the streak and the last
 * session keep whichever is later. Settings, presets, the theme and every
 * other key are written only where this device has none, so a merge never
 * changes a choice made here.
 *
 * @returns {{ added: number, updated: number, sessions: number }} tasks added and
 *   updated, sessions added.
 */
export function mergeBackup(backup) {
  const data = Object.fromEntries(
    Object.entries(backup.data).filter(([key, value]) => isBackupKey(key) && typeof value === 'string')
  );
  const writes = {};
  let added = 0;
  let updated = 0;
  let sessions = 0;

  if (data[STORAGE_KEYS.TASKS] !== undefined) {
    const merged = mergeTaskRecords(
      readTaskRecord(localStorage.getItem(STORAGE_KEYS.TASKS)),
      readTaskRecord(data[STORAGE_KEYS.TASKS])
    );
    writes[STORAGE_KEYS.TASKS] = JSON.stringify({ tasks: merged.tasks, cleared: merged.cleared, lastUpdated: Date.now() });
    added += merged.added;
    updated += merged.updated;
  }

  if (data[STORAGE_KEYS.FOCUS_SESSIONS] !== undefined) {
    const local = readJson(localStorage.getItem(STORAGE_KEYS.FOCUS_SESSIONS), []);
    const merged = mergeSessions(Array.isArray(local) ? local : [], readJson(data[STORAGE_KEYS.FOCUS_SESSIONS], []));
    writes[STORAGE_KEYS.FOCUS_SESSIONS] = JSON.stringify(merged.sessions);
    sessions = merged.added;
  }

  const later = (key, stampOf, tieBreak = () => false) => {
    if (data[key] === undefined) return;
    const mine = readJson(localStorage.getItem(key), null);
    const theirs = readJson(data[key], null);
    if (!theirs) return;
    const diff = mine ? time(stampOf(theirs)) - time(stampOf(mine)) : 1;
    if (diff > 0 || (diff === 0 && tieBreak(theirs, mine))) writes[key] = data[key];
  };
  later(STORAGE_KEYS.FOCUS_STREAK, (s) => s?.lastDate, (a, b) => (Number(a?.count) || 0) > (Number(b?.count) || 0));
  later(STORAGE_KEYS.LAST_SESSION, (s) => s?.completedAt);

  const merged = new Set([STORAGE_KEYS.TASKS, STORAGE_KEYS.FOCUS_SESSIONS, STORAGE_KEYS.FOCUS_STREAK, STORAGE_KEYS.LAST_SESSION]);
  Object.entries(data).forEach(([key, value]) => {
    if (!merged.has(key) && localStorage.getItem(key) === null) writes[key] = value;
  });

  writeAll(writes);
  return { added, updated, sessions };
}

/**
 * All or nothing: if the browser refuses a write (storage full), the keys
 * already written go back to what they were and the error is thrown on.
 * The keys in `removals` go first, so their room is free for the writes.
 */
function writeAll(writes, removals = []) {
  const before = [...removals, ...Object.keys(writes)].map((key) => [key, localStorage.getItem(key)]);
  try {
    removals.forEach((key) => localStorage.removeItem(key));
    Object.entries(writes).forEach(([key, value]) => localStorage.setItem(key, value));
  } catch (error) {
    // Every new value goes before any old one comes back, so the old ones fit as they did before.
    before.forEach(([key]) => localStorage.removeItem(key));
    before.forEach(([key, value]) => {
      try {
        if (value !== null) localStorage.setItem(key, value);
      } catch {
        // The old values all fit before the writes, so this should not fail.
      }
    });
    throw error;
  }
}

/**
 * Write a validated backup back into localStorage, all of it or none.
 * @returns {number} how many keys were restored.
 */
export function applyBackup(backup) {
  const writes = Object.fromEntries(
    Object.entries(backup.data).filter(([key, value]) => isBackupKey(key) && typeof value === 'string')
  );
  // What the file lacks goes too, or Replace would keep this device's sessions, settings and presets.
  const removals = Object.keys(collectBackupData()).filter((key) => !(key in writes));
  writeAll(writes, removals);
  return Object.keys(writes).length;
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
