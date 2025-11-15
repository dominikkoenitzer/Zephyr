// localStorage service for data persistence
const STORAGE_KEYS = {
  TIMER_STATE: 'zephyr_timer_state',
  TASKS: 'zephyr_tasks',
  FOCUS_SESSIONS: 'zephyr_focus_sessions',
  SETTINGS: 'zephyr_settings',
  WELLNESS: 'zephyr_wellness',
  CALENDAR_EVENTS: 'zephyr_calendar_events',
  TASK_FOLDERS: 'zephyr_task_folders',
  NOTES: 'zephyr_notes',
  JOURNAL_ENTRIES: 'zephyr_journal_entries',
};

class LocalStorageService {
  // Timer state management
  saveTimerState(state) {
    try {
      localStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify({
        ...state,
        lastSaved: Date.now()
      }));
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
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      completed: false,
      folderId: null,
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

  // Task folders management
  saveFolders(folders) {
    try {
      localStorage.setItem(STORAGE_KEYS.TASK_FOLDERS, JSON.stringify({
        folders,
        lastUpdated: Date.now()
      }));
      return true;
    } catch (error) {
      console.error('Failed to save folders:', error);
      return false;
    }
  }

  getFolders() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASK_FOLDERS);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      return parsed.folders || [];
    } catch (error) {
      console.error('Failed to get folders:', error);
      return [];
    }
  }

  addFolder(folder) {
    const folders = this.getFolders();
    const newFolder = {
      id: Date.now().toString(),
      name: folder.name || 'New Folder',
      color: folder.color || '#3b82f6',
      createdAt: new Date().toISOString()
    };
    folders.push(newFolder);
    this.saveFolders(folders);
    return newFolder;
  }

  updateFolder(folderId, updates) {
    const folders = this.getFolders();
    const folderIndex = folders.findIndex(folder => folder.id === folderId);
    if (folderIndex !== -1) {
      folders[folderIndex] = { ...folders[folderIndex], ...updates, updatedAt: new Date().toISOString() };
      this.saveFolders(folders);
      return folders[folderIndex];
    }
    return null;
  }

  deleteFolder(folderId) {
    const folders = this.getFolders();
    const filteredFolders = folders.filter(folder => folder.id !== folderId);
    this.saveFolders(filteredFolders);
    
    // Move tasks from deleted folder to no folder
    const tasks = this.getTasks();
    tasks.forEach(task => {
      if (task.folderId === folderId) {
        task.folderId = null;
      }
    });
    this.saveTasks(tasks);
  }

  // Focus sessions tracking
  saveFocusSession(session) {
    try {
      const existingSessions = this.getFocusSessions();
      const updatedSessions = [...existingSessions, {
        ...session,
        id: Date.now().toString(),
        date: new Date().toISOString()
      }];
      
      localStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(updatedSessions));
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
      return true;
    } catch (error) {
      console.error('Failed to save focus sessions:', error);
      return false;
    }
  }

  // Settings management
  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
        ...settings,
        lastUpdated: Date.now()
      }));
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        sessionsUntilLongBreak: 4,
        soundEnabled: true,
        notificationsEnabled: true,
        theme: 'system',
        calendar: {
          firstDayOfWeek: 0,
          defaultView: 'month',
          showWeekends: true,
          showWeekNumbers: false,
          timeFormat: '12h',
          showMiniCalendar: true,
          showTasks: true,
          eventDensity: 'normal',
          startHour: 0,
          endHour: 23
        }
      };
      
      const parsed = JSON.parse(data);
      if (!parsed.calendar) {
        parsed.calendar = {
          firstDayOfWeek: 0,
          defaultView: 'month',
          showWeekends: true,
          showWeekNumbers: false,
          timeFormat: '12h',
          showMiniCalendar: true,
          showTasks: true,
          eventDensity: 'normal',
          startHour: 0,
          endHour: 23
        };
      }
      return parsed;
    } catch (error) {
      console.error('Failed to get settings:', error);
      return {
        calendar: {
          firstDayOfWeek: 0,
          defaultView: 'month',
          showWeekends: true,
          showWeekNumbers: false,
          timeFormat: '12h',
          showMiniCalendar: true,
          showTasks: true,
          eventDensity: 'normal',
          startHour: 0,
          endHour: 23
        }
      };
    }
  }

  saveCalendarSettings(calendarSettings) {
    try {
      const currentSettings = this.getSettings();
      const updatedSettings = {
        ...currentSettings,
        calendar: calendarSettings
      };
      return this.saveSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to save calendar settings:', error);
      return false;
    }
  }

  getCalendarSettings() {
    try {
      const settings = this.getSettings();
      return settings.calendar || {
        firstDayOfWeek: 0,
        defaultView: 'month',
        showWeekends: true,
        showWeekNumbers: false,
        timeFormat: '12h',
        showMiniCalendar: true,
        showTasks: true,
        eventDensity: 'normal',
        startHour: 0,
        endHour: 23
      };
    } catch (error) {
      console.error('Failed to get calendar settings:', error);
      return {
        firstDayOfWeek: 0,
        defaultView: 'month',
        showWeekends: true,
        showWeekNumbers: false,
        timeFormat: '12h',
        showMiniCalendar: true,
        showTasks: true,
        eventDensity: 'normal',
        startHour: 0,
        endHour: 23
      };
    }
  }

  // Wellness data management
  saveWellnessData(data) {
    try {
      const existing = this.getWellnessData();
      const updated = { ...existing, ...data, lastUpdated: Date.now() };
      localStorage.setItem(STORAGE_KEYS.WELLNESS, JSON.stringify(updated));
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

  // Calendar events management
  saveCalendarEvents(events) {
    try {
      localStorage.setItem(STORAGE_KEYS.CALENDAR_EVENTS, JSON.stringify({
        events,
        lastUpdated: Date.now()
      }));
      return true;
    } catch (error) {
      console.error('Failed to save calendar events:', error);
      return false;
    }
  }

  getCalendarEvents() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CALENDAR_EVENTS);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      return parsed.events || [];
    } catch (error) {
      console.error('Failed to get calendar events:', error);
      return [];
    }
  }

  // Clear all data
  clearAllData() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
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

  // Notes management
  saveNotes(notes) {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
      return true;
    } catch (error) {
      console.error('Failed to save notes:', error);
      return false;
    }
  }

  getNotes() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get notes:', error);
      return [];
    }
  }

  addNote(note) {
    try {
      const notes = this.getNotes();
      const newNote = {
        id: note.id || `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: note.title || 'Untitled Note',
        content: note.content || '',
        tags: note.tags || [],
        color: note.color || '#6366f1',
        createdAt: note.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pinned: note.pinned || false,
      };
      notes.push(newNote);
      this.saveNotes(notes);
      return newNote;
    } catch (error) {
      console.error('Failed to add note:', error);
      return null;
    }
  }

  updateNote(noteId, updates) {
    try {
      const notes = this.getNotes();
      const index = notes.findIndex(n => n.id === noteId);
      if (index === -1) return null;
      
      notes[index] = {
        ...notes[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.saveNotes(notes);
      return notes[index];
    } catch (error) {
      console.error('Failed to update note:', error);
      return null;
    }
  }

  deleteNote(noteId) {
    try {
      const notes = this.getNotes();
      const filtered = notes.filter(n => n.id !== noteId);
      this.saveNotes(filtered);
      return true;
    } catch (error) {
      console.error('Failed to delete note:', error);
      return false;
    }
  }

  // Journal entries management
  saveJournalEntries(entries) {
    try {
      localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(entries));
      return true;
    } catch (error) {
      console.error('Failed to save journal entries:', error);
      return false;
    }
  }

  getJournalEntries() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get journal entries:', error);
      return [];
    }
  }

  addJournalEntry(entry) {
    try {
      const entries = this.getJournalEntries();
      const date = entry.date || new Date().toISOString().split('T')[0];
      const existingIndex = entries.findIndex(e => e.date === date);
      
      const newEntry = {
        id: entry.id || `journal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date,
        content: entry.content || '',
        mood: entry.mood || 'neutral',
        tags: entry.tags || [],
        createdAt: entry.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingIndex !== -1) {
        entries[existingIndex] = { ...entries[existingIndex], ...newEntry };
      } else {
        entries.push(newEntry);
      }
      
      this.saveJournalEntries(entries);
      return newEntry;
    } catch (error) {
      console.error('Failed to add journal entry:', error);
      return null;
    }
  }

  updateJournalEntry(entryId, updates) {
    try {
      const entries = this.getJournalEntries();
      const index = entries.findIndex(e => e.id === entryId);
      if (index === -1) return null;
      
      entries[index] = {
        ...entries[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.saveJournalEntries(entries);
      return entries[index];
    } catch (error) {
      console.error('Failed to update journal entry:', error);
      return null;
    }
  }

  deleteJournalEntry(entryId) {
    try {
      const entries = this.getJournalEntries();
      const filtered = entries.filter(e => e.id !== entryId);
      this.saveJournalEntries(filtered);
      return true;
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
      return false;
    }
  }

  getJournalEntryByDate(date) {
    try {
      const entries = this.getJournalEntries();
      return entries.find(e => e.date === date) || null;
    } catch (error) {
      console.error('Failed to get journal entry by date:', error);
      return null;
    }
  }
}

export const localStorageService = new LocalStorageService();
export default localStorageService;
