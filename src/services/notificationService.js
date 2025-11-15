import { localStorageService } from './localStorage';

const STORAGE_KEYS = {
  NOTIFICATIONS: 'zephyr_notifications',
  NOTIFICATION_SETTINGS: 'zephyr_notification_settings'
};

const DEFAULT_SETTINGS = {
  enabled: true,
  soundEnabled: true,
  tasks: {
    enabled: true,
    dueDateReminder: 1, // days before due date
    overdue: true
  },
  events: {
    enabled: true,
    reminderTime: 15 // minutes before event
  },
  journal: {
    enabled: false,
    reminderTime: '20:00' // HH:mm format
  },
  timer: {
    enabled: true
  }
};

class NotificationService {
  constructor() {
    this.checkInterval = null;
  }

  /**
   * Get notification settings
   */
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save notification settings
   */
  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      return false;
    }
  }

  /**
   * Get all notifications
   */
  getNotifications() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }
  }

  /**
   * Save notifications
   */
  saveNotifications(notifications) {
    try {
      // Keep only last 30 days
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const filtered = notifications.filter(n => new Date(n.createdAt).getTime() > thirtyDaysAgo);
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Failed to save notifications:', error);
      return false;
    }
  }

  /**
   * Create a new notification
   */
  createNotification(type, title, message, action = null, metadata = {}) {
    const settings = this.getSettings();
    if (!settings.enabled) return null;

    // Check if this notification type is enabled
    if (type === 'task' && !settings.tasks.enabled) return null;
    if (type === 'event' && !settings.events.enabled) return null;
    if (type === 'journal' && !settings.journal.enabled) return null;
    if (type === 'timer' && !settings.timer.enabled) return null;

    const notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      action,
      metadata,
      read: false,
      createdAt: new Date().toISOString()
    };

    const notifications = this.getNotifications();
    
    // Check if similar notification already exists (prevent duplicates)
    const isDuplicate = notifications.some(n => 
      n.type === type && 
      n.title === title && 
      !n.read &&
      (Date.now() - new Date(n.createdAt).getTime()) < 60000 // Within last minute
    );

    if (isDuplicate) return null;

    notifications.unshift(notification);
    this.saveNotifications(notifications);

    // Play sound if enabled
    if (settings.soundEnabled) {
      this.playNotificationSound();
    }

    return notification;
  }

  /**
   * Play notification sound
   */
  playNotificationSound() {
    try {
      // Create a simple, pleasant notification sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Pleasant two-tone chime
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId) {
    const notifications = this.getNotifications();
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      notifications[index].read = true;
      this.saveNotifications(notifications);
      return true;
    }
    return false;
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    const notifications = this.getNotifications();
    notifications.forEach(n => n.read = true);
    this.saveNotifications(notifications);
    return true;
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId) {
    const notifications = this.getNotifications();
    const filtered = notifications.filter(n => n.id !== notificationId);
    this.saveNotifications(filtered);
    return true;
  }

  /**
   * Get unread count
   */
  getUnreadCount() {
    const notifications = this.getNotifications();
    return notifications.filter(n => !n.read).length;
  }

  /**
   * Check tasks for due date notifications
   */
  checkTaskDueDates() {
    const settings = this.getSettings();
    if (!settings.enabled || !settings.tasks.enabled) return;

    const tasks = localStorageService.getTasks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tasks.forEach(task => {
      if (!task.dueDate || task.completed) return;

      const dueDateParts = task.dueDate.split('T')[0].split('-').map(Number);
      const dueDate = new Date(dueDateParts[0], dueDateParts[1] - 1, dueDateParts[2]);
      dueDate.setHours(0, 0, 0, 0);

      const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

      // Overdue
      if (settings.tasks.overdue && daysUntilDue < 0) {
        this.createNotification(
          'task',
          'Task Overdue',
          `${task.title} was due ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''} ago`,
          { type: 'navigate', path: '/tasks' },
          { taskId: task.id }
        );
      }
      // Due today
      else if (daysUntilDue === 0) {
        this.createNotification(
          'task',
          'Task Due Today',
          `${task.title} is due today`,
          { type: 'navigate', path: '/tasks' },
          { taskId: task.id }
        );
      }
      // Due soon
      else if (daysUntilDue > 0 && daysUntilDue <= settings.tasks.dueDateReminder) {
        this.createNotification(
          'task',
          'Task Due Soon',
          `${task.title} is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
          { type: 'navigate', path: '/tasks' },
          { taskId: task.id }
        );
      }
    });
  }

  /**
   * Check calendar events for reminders
   */
  checkEventReminders() {
    const settings = this.getSettings();
    if (!settings.enabled || !settings.events.enabled) return;

    const events = localStorageService.getCalendarEvents();
    const now = new Date();
    const reminderMinutes = settings.events.reminderTime || 15;

    events.forEach(event => {
      if (!event.date || !event.reminder || event.allDay) return;

      const eventDate = new Date(event.date);
      if (event.time) {
        const [hours, minutes] = event.time.split(':').map(Number);
        eventDate.setHours(hours, minutes, 0, 0);
      } else {
        eventDate.setHours(0, 0, 0, 0);
      }

      const reminderTime = new Date(eventDate.getTime() - (reminderMinutes * 60 * 1000));
      const timeUntilEvent = eventDate - now;
      const timeUntilReminder = reminderTime - now;

      // Event starting now
      if (timeUntilEvent >= 0 && timeUntilEvent < 5 * 60 * 1000) {
        this.createNotification(
          'event',
          'Event Starting Now',
          `${event.title} is starting now`,
          { type: 'navigate', path: '/calendar' },
          { eventId: event.id }
        );
      }
      // Reminder time
      else if (timeUntilReminder >= 0 && timeUntilReminder < 2 * 60 * 1000) {
        this.createNotification(
          'event',
          'Event Reminder',
          `${event.title} starts in ${reminderMinutes} minutes`,
          { type: 'navigate', path: '/calendar' },
          { eventId: event.id }
        );
      }
    });
  }

  /**
   * Check journal reminders
   */
  checkJournalReminders() {
    const settings = this.getSettings();
    if (!settings.enabled || !settings.journal.enabled) return;

    const reminderTime = settings.journal.reminderTime || '20:00';
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const now = new Date();
    const reminderDate = new Date();
    reminderDate.setHours(hours, minutes, 0, 0);

    // Check if it's around reminder time (within 5 minutes)
    const timeDiff = Math.abs(now - reminderDate);
    if (timeDiff < 5 * 60 * 1000) {
      // Check if journal entry already exists for today
      const today = new Date().toISOString().split('T')[0];
      const existingEntry = localStorageService.getJournalEntryByDate(today);
      
      if (!existingEntry) {
        this.createNotification(
          'journal',
          'Journal Reminder',
          "Don't forget to write in your journal today",
          { type: 'navigate', path: '/journal' }
        );
      }
    }
  }

  /**
   * Start checking for notifications at intervals
   */
  startChecking() {
    const settings = this.getSettings();
    if (!settings.enabled) return;

    // Check immediately
    this.checkTaskDueDates();
    this.checkEventReminders();
    this.checkJournalReminders();

    // Then check every minute
    this.checkInterval = setInterval(() => {
      this.checkTaskDueDates();
      this.checkEventReminders();
      this.checkJournalReminders();
    }, 60000); // 1 minute
  }

  /**
   * Stop checking for notifications
   */
  stopChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;

