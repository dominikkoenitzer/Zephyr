import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings, CheckCheck } from 'lucide-react';
import { Button } from '../ui/button';
import NotificationItem from './NotificationItem';
import { notificationService } from '../../services/notificationService';

const NotificationCenter = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = () => {
    const allNotifications = notificationService.getNotifications();
    setNotifications(allNotifications);
    setUnreadCount(notificationService.getUnreadCount());
  };

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
    <div className="absolute top-full right-0 mt-2 w-96 bg-background border border-border rounded-lg shadow-lg max-h-[600px] flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-foreground" />
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-8 px-2 text-xs"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              navigate('/settings');
              onClose();
            }}
            className="h-8 w-8"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Bell className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
            <p className="text-sm font-medium text-foreground mb-1">No notifications</p>
            <p className="text-xs text-muted-foreground text-center">
              You&apos;re all caught up! Notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
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
                  <div className="pt-2 mt-2 border-t border-border">
                    <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
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

