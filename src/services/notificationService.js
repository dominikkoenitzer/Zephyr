import { localStorageService, emitChange } from './localStorage';

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
  timer: {
    enabled: true
  }
};

const pad = (n) => String(n).padStart(2, '0');
/** Local day key — reminders are once per task per day, not once per poll. */
const dayKey = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

class NotificationService {
  constructor() {
    this.checkInterval = null;
    // One AudioContext, reused. Browsers cap a page at six, and the old code
    // built a new one per chime and never closed it — so the seventh
    // notification threw and every chime after it was silent.
    this.audioContext = null;
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
      emitChange(STORAGE_KEYS.NOTIFICATIONS);
      return true;
    } catch (error) {
      console.error('Failed to save notifications:', error);
      return false;
    }
  }

  /**
   * Create a new notification
   */
  createNotification(type, title, message, action = null, metadata = {}, dedupeKey = null) {
    const settings = this.getSettings();
    if (!settings.enabled) return null;

    // Check if this notification type is enabled
    if (type === 'task' && !settings.tasks.enabled) return null;
    if (type === 'timer' && !settings.timer.enabled) return null;

    const notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      action,
      metadata,
      dedupeKey,
      read: false,
      createdAt: new Date().toISOString()
    };

    const notifications = this.getNotifications();

    // A caller that supplies a key owns its own identity: one notification per
    // key, ever (within the 30-day retention). Task reminders key on the task
    // *and* the day, so a task due today is announced once today rather than
    // once per poll — the old guard compared type + title inside a 60s window,
    // which the 60s polling interval stepped straight over, and which also
    // collapsed two different tasks due on the same day into one alert.
    if (dedupeKey && notifications.some((n) => n.dedupeKey === dedupeKey)) return null;

    if (!dedupeKey) {
      const isDuplicate = notifications.some(
        (n) =>
          n.type === type &&
          n.title === title &&
          !n.read &&
          Date.now() - new Date(n.createdAt).getTime() < 60000
      );
      if (isDuplicate) return null;
    }

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
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      if (!this.audioContext) this.audioContext = new Ctor();
      const audioContext = this.audioContext;
      // A context created before the first gesture starts suspended.
      if (audioContext.state === 'suspended') audioContext.resume();

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
    const todayKey = dayKey(today);

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
          { taskId: task.id },
          `task:${task.id}:overdue:${todayKey}`
        );
      }
      // Due today
      else if (daysUntilDue === 0) {
        this.createNotification(
          'task',
          'Task Due Today',
          `${task.title} is due today`,
          { type: 'navigate', path: '/tasks' },
          { taskId: task.id },
          `task:${task.id}:due-today:${todayKey}`
        );
      }
      // Due soon
      else if (daysUntilDue > 0 && daysUntilDue <= settings.tasks.dueDateReminder) {
        this.createNotification(
          'task',
          'Task Due Soon',
          `${task.title} is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
          { type: 'navigate', path: '/tasks' },
          { taskId: task.id },
          `task:${task.id}:due-soon:${todayKey}`
        );
      }
    });
  }

  /**
   * Start checking for notifications at intervals
   */
  startChecking() {
    // Never stack intervals: a second start would orphan the first handle and
    // leave a checker running that nothing can stop.
    this.stopChecking();

    const settings = this.getSettings();
    if (!settings.enabled) return;

    // Check immediately
    this.checkTaskDueDates();

    // Then check every minute
    this.checkInterval = setInterval(() => {
      this.checkTaskDueDates();
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

