// localStorage service for data persistence
export const STORAGE_KEYS = {
  TIMER_STATE: 'zephyr_timer_state',
  TASKS: 'zephyr_tasks',
  FOCUS_SESSIONS: 'zephyr_focus_sessions',
  FOCUS_STREAK: 'zephyr_focus_streak',
  SETTINGS: 'zephyr_settings',
  WELLNESS: 'zephyr_wellness',
  // Notes, the calendar, the journal and task folders were all removed from
  // the app. Their keys stay listed so clearAllData still wipes old data and
  // a backup still carries it. No code left in the app reads them.
  CALENDAR_EVENTS: 'zephyr_calendar_events',
  TASK_FOLDERS: 'zephyr_task_folders',
  NOTES: 'zephyr_notes',
  JOURNAL_ENTRIES: 'zephyr_journal_entries',
  ONBOARDING: 'zephyr_onboarding',
  LAST_SESSION: 'zephyr_last_focus_session',
  VIEW_PREFS: 'zephyr_view_prefs',
};

// Custom event broadcast on every write so views in the same tab can react
// instantly (the native `storage` event only fires in other tabs).
export const CHANGE_EVENT = 'zephyr:change';

export function emitChange(key) {
  try {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }));
  } catch {
    // Non-browser or SSR, so nothing to broadcast.
  }
}

export const DEFAULT_SETTINGS = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  soundEnabled: true,
  notificationsEnabled: true,
  theme: 'system',
};

/**
 * A collision-proof id.
 *
 * Tasks and focus sessions used to be identified by `Date.now().toString()`
 * alone, so two created inside the same millisecond shared an id, and since
 * every lookup, update and delete matches on id, deleting one of them deleted
 * both. Quick-adding two tasks in a row is enough to hit it.
 */
const makeId = (prefix) =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// Always hand callers a fresh copy so they can't mutate the shared defaults.
const clone = (value) => JSON.parse(JSON.stringify(value));

class LocalStorageService {
  // Timer state management
  saveTimerState(state) {
    try {
      localStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify({
        ...state,
        lastSaved: Date.now()
      }));
      emitChange(STORAGE_KEYS.TIMER_STATE);
      return true;
    } catch (error) {
      console.error('Failed to save timer state:', error);
      return false;
    }
  }

  getTimerState() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TIMER_STATE);
      if (!data) return null;

      const state = JSON.parse(data);
      // Calculate time elapsed since last save if timer was running
      if (state.isRunning && state.lastSaved) {
        const timeElapsed = Math.floor((Date.now() - state.lastSaved) / 1000);
        state.timeLeft = Math.max(0, state.timeLeft - timeElapsed);
      }
      return state;
    } catch (error) {
      console.error('Failed to get timer state:', error);
      return null;
    }
  }

  clearTimerState() {
    try {
      localStorage.removeItem(STORAGE_KEYS.TIMER_STATE);
      emitChange(STORAGE_KEYS.TIMER_STATE);
      return true;
    } catch (error) {
      console.error('Failed to clear timer state:', error);
      return false;
    }
  }

  // Tasks management
  saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify({
        tasks,
        lastUpdated: Date.now()
      }));
      emitChange(STORAGE_KEYS.TASKS);
      return true;
    } catch (error) {
      console.error('Failed to save tasks:', error);
      return false;
    }
  }

  getTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!data) return [];

      const parsed = JSON.parse(data);
      return parsed.tasks || [];
    } catch (error) {
      console.error('Failed to get tasks:', error);
      return [];
    }
  }

  addTask(task) {
    const tasks = this.getTasks();
    const newTask = {
      id: makeId('task'),
      createdAt: new Date().toISOString(),
      completed: false,
      priority: 'medium',
      tags: [],
      dueDate: null,
      subtasks: [],
      ...task
    };
    tasks.push(newTask);
    this.saveTasks(tasks);
    return newTask;
  }

  updateTask(taskId, updates) {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      const updatedTask = { ...tasks[taskIndex], ...updates, updatedAt: new Date().toISOString() };
      // Add completedAt timestamp when task is marked as completed
      if (updates.completed && !tasks[taskIndex].completed) {
        updatedTask.completedAt = new Date().toISOString();
      } else if (updates.completed === false && tasks[taskIndex].completed) {
        updatedTask.completedAt = null;
      }
      tasks[taskIndex] = updatedTask;
      this.saveTasks(tasks);
      return tasks[taskIndex];
    }
    return null;
  }

  deleteTask(taskId) {
    const tasks = this.getTasks();
    const filteredTasks = tasks.filter(task => task.id !== taskId);
    this.saveTasks(filteredTasks);
  }

  // Focus sessions tracking
  saveFocusSession(session) {
    try {
      const existingSessions = this.getFocusSessions();
      const updatedSessions = [...existingSessions, {
        ...session,
        id: makeId('session'),
        date: new Date().toISOString()
      }];

      localStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(updatedSessions));
      emitChange(STORAGE_KEYS.FOCUS_SESSIONS);
      return true;
    } catch (error) {
      console.error('Failed to save focus session:', error);
      return false;
    }
  }

  getFocusSessions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FOCUS_SESSIONS);
      if (!data) return [];

      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to get focus sessions:', error);
      return [];
    }
  }

  saveFocusSessions(sessions) {
    try {
      localStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(sessions));
      emitChange(STORAGE_KEYS.FOCUS_SESSIONS);
      return true;
    } catch (error) {
      console.error('Failed to save focus sessions:', error);
      return false;
    }
  }

  // Focus streak tracking
  saveFocusStreak(streak) {
    try {
      const normalized = {
        count: Math.max(0, streak?.count || 0),
        lastDate: streak?.lastDate || null
      };
      localStorage.setItem(STORAGE_KEYS.FOCUS_STREAK, JSON.stringify(normalized));
      emitChange(STORAGE_KEYS.FOCUS_STREAK);
      return normalized;
    } catch (error) {
      console.error('Failed to save focus streak:', error);
      return { count: 0, lastDate: null };
    }
  }

  getFocusStreak() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FOCUS_STREAK);
      if (!data) return { count: 0, lastDate: null };

      const parsed = JSON.parse(data);
      return {
        count: Math.max(0, parsed.count || 0),
        lastDate: parsed.lastDate || null
      };
    } catch (error) {
      console.error('Failed to get focus streak:', error);
      return { count: 0, lastDate: null };
    }
  }

  // Onboarding progress
  saveOnboarding(progress) {
    try {
      const existing = this.getOnboarding();
      const updated = { ...existing, ...progress, lastUpdated: Date.now() };
      localStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(updated));
      emitChange(STORAGE_KEYS.ONBOARDING);
      return updated;
    } catch (error) {
      console.error('Failed to save onboarding:', error);
      return null;
    }
  }

  getOnboarding() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ONBOARDING);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to get onboarding:', error);
      return {};
    }
  }

  // Last focus session details
  saveLastSession(session) {
    try {
      const payload = {
        presetId: session?.presetId || 'pomodoro',
        duration: session?.duration || 0,
        task: session?.task || null,
        completedAt: session?.completedAt || new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.LAST_SESSION, JSON.stringify(payload));
      emitChange(STORAGE_KEYS.LAST_SESSION);
      return payload;
    } catch (error) {
      console.error('Failed to save last session:', error);
      return null;
    }
  }

  getLastSession() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LAST_SESSION);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get last session:', error);
      return null;
    }
  }

  // View preferences: which filter chip and sort a list was left on, so a
  // reload doesn't drop you back into an unfiltered list. Deliberately kept
  // apart from SETTINGS: this is where you were, not what you chose.
  getViewPrefs() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VIEW_PREFS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to get view preferences:', error);
      return {};
    }
  }

  saveViewPrefs(prefs) {
    try {
      const updated = { ...this.getViewPrefs(), ...prefs };
      localStorage.setItem(STORAGE_KEYS.VIEW_PREFS, JSON.stringify(updated));
      emitChange(STORAGE_KEYS.VIEW_PREFS);
      return updated;
    } catch (error) {
      console.error('Failed to save view preferences:', error);
      return null;
    }
  }

  // Settings management
  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
        ...settings,
        lastUpdated: Date.now()
      }));
      emitChange(STORAGE_KEYS.SETTINGS);
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return clone(DEFAULT_SETTINGS);

      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to get settings:', error);
      return clone(DEFAULT_SETTINGS);
    }
  }

  // Wellness data management
  saveWellnessData(data) {
    try {
      const existing = this.getWellnessData();
      const updated = { ...existing, ...data, lastUpdated: Date.now() };
      localStorage.setItem(STORAGE_KEYS.WELLNESS, JSON.stringify(updated));
      emitChange(STORAGE_KEYS.WELLNESS);
      return true;
    } catch (error) {
      console.error('Failed to save wellness data:', error);
      return false;
    }
  }

  getWellnessData() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WELLNESS);
      if (!data) return {};

      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to get wellness data:', error);
      return {};
    }
  }

  // Clear all data
  clearAllData() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      emitChange(null);
      return true;
    } catch (error) {
      console.error('Failed to clear all data:', error);
      return false;
    }
  }

  // Get storage usage information
  getStorageInfo() {
    try {
      const info = {};
      let totalSize = 0;

      Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
        const data = localStorage.getItem(key);
        const size = data ? new Blob([data]).size : 0;
        info[name] = {
          size,
          hasData: !!data
        };
        totalSize += size;
      });

      return {
        ...info,
        totalSize,
        totalSizeFormatted: this.formatBytes(totalSize)
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return {};
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const localStorageService = new LocalStorageService();
export default localStorageService;
