import { FileText, CheckSquare, Timer, X } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

const NOTIFICATION_ICONS = {
  task: CheckSquare,
  timer: Timer,
  note: FileText
};

const NOTIFICATION_COLORS = {
  task: 'text-primary-strong',
  timer: 'text-night',
  note: 'text-muted-foreground'
};

const NotificationItem = ({ notification, onRead, onDelete, onClick }) => {
  const Icon = NOTIFICATION_ICONS[notification.type] || FileText;
  const iconColor = NOTIFICATION_COLORS[notification.type] || 'text-muted-foreground';

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const open = () => {
    if (!notification.read) {
      onRead(notification.id);
    }
    if (onClick) {
      onClick(notification);
    }
  };

  return (
    <div
      className={cn(
        "group flex cursor-pointer items-start gap-3 rounded-2xl p-2.5 transition-colors",
        notification.read 
          ? "bg-transparent hover:bg-accent/60" 
          : "bg-accent/50 hover:bg-accent"
      )}
      onClick={open}
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card shadow-(--shadow-sm)", iconColor)}>
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1.5 sm:gap-2">
          <div className="flex-1 min-w-0">
            {/* The row opens on a click anywhere; the title is its button so
                a keyboard can open it too. */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
              className={cn(
                "block w-full rounded-md text-left text-xs sm:text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                notification.read ? "text-foreground" : "text-foreground font-semibold"
              )}
            >
              {notification.title}
            </button>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
              {notification.message}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
              {formatTime(notification.createdAt)}
            </div>
          </div>
          
          {!notification.read && (
            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary shrink-0 mt-0.5 sm:mt-1" />
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete notification: ${notification.title}`}
        className="h-6 w-6 sm:h-7 sm:w-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 transition-opacity shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
      >
        <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      </Button>
    </div>
  );
};

export default NotificationItem;

