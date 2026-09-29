import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings, CheckCheck } from 'lucide-react';
import { Button } from '../ui/button';
import NotificationItem from './NotificationItem';
import { notificationService } from '../../services/notificationService';

const NotificationCenter = ({ onClose }) => {
  // Seeded from the service rather than filled in by an effect, so the panel
  // opens on its real contents instead of flashing the empty state first.
  const [notifications, setNotifications] = useState(() =>
    notificationService.getNotifications()
  );
  const [unreadCount, setUnreadCount] = useState(() =>
    notificationService.getUnreadCount()
  );
  const navigate = useNavigate();

  const loadNotifications = useCallback(() => {
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());
  }, []);

  // Only keeps the seeded list fresh while the panel stays open.
  useEffect(() => {
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleRead = (notificationId) => {
    notificationService.markAsRead(notificationId);
    loadNotifications();
  };

  const handleDelete = (notificationId) => {
    notificationService.deleteNotification(notificationId);
    loadNotifications();
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
    loadNotifications();
  };

  const handleNotificationClick = (notification) => {
    if (notification.action && notification.action.type === 'navigate') {
      navigate(notification.action.path);
      onClose();
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <div className="absolute top-full right-0 z-50 mt-3 flex max-h-[calc(100vh-6rem)] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-3xl bg-popover shadow-(--shadow-overlay) sm:max-h-[600px] sm:w-96 sm:max-w-96">
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                    <h3 className="truncate text-[17px] font-semibold tracking-[-0.015em] text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium bg-primary text-primary-foreground rounded-full shrink-0">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-7 sm:h-8 px-1.5 sm:px-2 text-[10px] sm:text-xs"
            >
              <CheckCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" />
              <span className="hidden sm:inline">Mark all read</span>
              <span className="sm:hidden">All</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              navigate('/settings');
              onClose();
            }}
            className="h-7 w-7 sm:h-8 sm:w-8"
          >
            <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-3 sm:px-4">
            <Bell className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mb-2 sm:mb-3 opacity-50" />
            <p className="text-xs sm:text-sm font-medium text-foreground mb-0.5 sm:mb-1">No notifications</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground text-center px-2">
              Reminders about due tasks and finished sessions show up here.
            </p>
          </div>
        ) : (
          <div className="p-1.5 sm:p-2 space-y-0.5 sm:space-y-1">
            {unreadNotifications.length > 0 && (
              <>
                {unreadNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={handleRead}
                    onDelete={handleDelete}
                    onClick={handleNotificationClick}
                  />
                ))}
                {readNotifications.length > 0 && (
                  <div className="mt-2 pt-2">
                    <div className="px-3 py-1 text-[12px] font-semibold text-muted-foreground">
                      Earlier
                    </div>
                  </div>
                )}
              </>
            )}
            {readNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={handleRead}
                onDelete={handleDelete}
                onClick={handleNotificationClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;

