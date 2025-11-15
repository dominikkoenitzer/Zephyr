import { FileText, BookOpen, Calendar, CheckSquare, Timer, X } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

const NOTIFICATION_ICONS = {
  task: CheckSquare,
  event: Calendar,
  journal: BookOpen,
  timer: Timer,
  note: FileText
};

const NOTIFICATION_COLORS = {
  task: 'text-blue-500',
  event: 'text-orange-500',
  journal: 'text-purple-500',
  timer: 'text-green-500',
  note: 'text-indigo-500'
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

  return (
    <div
      className={cn(
        "group flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer",
        notification.read 
          ? "bg-transparent hover:bg-accent/30" 
          : "bg-accent/50 hover:bg-accent"
      )}
      onClick={() => {
        if (!notification.read) {
          onRead(notification.id);
        }
        if (onClick) {
          onClick(notification);
        }
      }}
    >
      <div className={cn("p-2 rounded-lg bg-background", iconColor)}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className={cn(
              "text-sm font-medium",
              notification.read ? "text-foreground" : "text-foreground font-semibold"
            )}>
              {notification.title}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {notification.message}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatTime(notification.createdAt)}
            </div>
          </div>
          
          {!notification.read && (
            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

export default NotificationItem;

