import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Monitor, Moon, Search, Sun } from 'lucide-react';
import { cn } from '../../lib/utils';
import NotificationCenter from '../Notifications/NotificationCenter';
import { notificationService } from '../../services/notificationService';
import { CHANGE_EVENT } from '../../services/localStorage';
import { useTheme } from '../../hooks/useTheme';
import { modKey } from '../../lib/shortcuts';
import ZephyrMark from './ZephyrMark';

const THEME_ICON = { light: Sun, dark: Moon, system: Monitor };

const roundButton =
  'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-(--shadow-sm) transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/**
 * The bar above every page, inside the content column: the search pill on the
 * left, the round utility buttons on the right. On phones the
 * sidebar is gone, so the mark takes the search pill's place and search
 * becomes one more round button.
 */
function TopBar({ onSearchClick }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationContainerRef = useRef(null);
  const notificationPanelId = useId();
  const bellRef = useRef(null);
  const { preference, colorMode, cycle } = useTheme();
  const ThemeIcon = THEME_ICON[preference] || Monitor;
  const themeLabel =
    preference === 'system' ? `System (${colorMode})` : preference === 'dark' ? 'Dark' : 'Light';

  useEffect(() => {
    // Updates instantly when notifications change (via the in-app change
    // event), with a periodic refresh as a fallback for the service's
    // time-based reminders.
    const loadNotificationCount = () => setUnreadCount(notificationService.getUnreadCount());
    loadNotificationCount();
    const interval = setInterval(loadNotificationCount, 10000);
    window.addEventListener(CHANGE_EVENT, loadNotificationCount);
    window.addEventListener('focus', loadNotificationCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener(CHANGE_EVENT, loadNotificationCount);
      window.removeEventListener('focus', loadNotificationCount);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationContainerRef.current &&
        !notificationContainerRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showNotifications) return undefined;
    // Escape closes the panel from anywhere and puts focus back on the bell,
    // so a keyboard user lands where they opened it.
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return;
      setShowNotifications(false);
      bellRef.current?.focus();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showNotifications]);

  return (
    <header className="sticky top-0 z-40 bg-background/85 px-responsive pt-3 backdrop-blur-xl lg:pl-3">
      <div className="page-width flex h-(--header-height) items-center gap-3 pb-3">
        <Link
          to="/"
          aria-label="Zephyr, go to the dashboard"
          className="flex items-center gap-2.5 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <ZephyrMark size={34} />
          <span className="text-[19px] font-semibold tracking-[-0.03em]">Zephyr</span>
        </Link>

        <button
          type="button"
          onClick={onSearchClick}
          className="hidden h-12 w-full max-w-md items-center gap-3 rounded-full bg-card pl-5 pr-2 text-left text-[15px] text-muted-foreground shadow-(--shadow-sm) transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex"
          aria-label="Search your tasks, or run a command"
        >
          <Search className="h-[18px] w-[18px] shrink-0" />
          <span className="flex-1 truncate">Search tasks or run a command</span>
          <kbd className="kbd h-8 rounded-full px-3">{modKey()} K</kbd>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onSearchClick}
            className={cn(roundButton, 'lg:hidden')}
            title={`Search or run a command (${modKey()}+K)`}
            aria-label="Search your tasks, or run a command"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>

          <button
            type="button"
            onClick={cycle}
            className={roundButton}
            title="Switch between light, dark and system (T)"
            aria-label={`Theme: ${themeLabel}. Switch to the next theme.`}
          >
            <ThemeIcon className="h-[18px] w-[18px]" />
          </button>

          <div className="relative" ref={notificationContainerRef}>
            <button
              ref={bellRef}
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className={roundButton}
              aria-expanded={showNotifications}
              aria-controls={notificationPanelId}
              title={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
              )}
            </button>
            {showNotifications && (
              <NotificationCenter
                id={notificationPanelId}
                onClose={() => setShowNotifications(false)}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
