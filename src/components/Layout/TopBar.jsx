import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { m } from 'motion/react';
import { Bell, Monitor, Moon, Search, Sun } from 'lucide-react';
import { cn } from '../../lib/utils';
import NotificationCenter from '../Notifications/NotificationCenter';
import { notificationService } from '../../services/notificationService';
import { CHANGE_EVENT } from '../../services/localStorage';
import { useTheme } from '../../hooks/useTheme';
import { modKey } from '../../lib/shortcuts';

// Two destinations is the whole app. They are the only large type in the
// shell, which is why the pages below don't repeat their own title.
const NAV = [
  { name: 'Tasks', href: '/tasks' },
  { name: 'Focus', href: '/focus' },
];

const UTILITY = [
  { name: 'Settings', href: '/settings' },
  { name: 'Help', href: '/help' },
];

const THEME_ICON = { light: Sun, dark: Moon, system: Monitor };

/**
 * The whole navigation, in two rows on one hairline.
 *
 * Row one is a whisper: the wordmark (which is also the way home) and the
 * utility controls. Row two is the deliberate move — the two destinations set
 * large and tightly tracked, with the active one in caps over a rule and the
 * other lowercase and quiet. Case carries the state, so nothing else has to.
 *
 * The inner container shares `.page-width` with every page, so the wordmark,
 * the nav and the first task in the list all sit on the same left edge.
 */
function TopBar({ onSearchClick }) {
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationContainerRef = useRef(null);
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

  const iconButton =
    'flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/85 backdrop-blur-2xl">
      <div className="px-responsive">
        <div className="page-width">
          {/* Row one — the way home, and the utilities */}
          <div className="flex h-14 items-center justify-between gap-4">
            {/* A home *button*, not a label: the app's own mark, its name at
                reading size, and a target that lights up under the cursor. */}
            <Link
              to="/"
              aria-label="Zephyr — go to the home screen"
              title="Home"
              className="-ml-2 flex items-center gap-2.5 rounded-full py-1.5 pl-2 pr-3.5 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <img
                src="/android-icon-192x192.png"
                alt=""
                width="26"
                height="26"
                className="h-[26px] w-[26px] rounded-full"
              />
              <span className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">
                Zephyr
              </span>
            </Link>

            <div className="flex items-center gap-1">
              {UTILITY.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  aria-current={location.pathname === item.href ? 'page' : undefined}
                  className={cn(
                    'hidden rounded-full px-3 py-1.5 text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block',
                    location.pathname === item.href
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                  )}
                >
                  {item.name}
                </Link>
              ))}

              <button
                type="button"
                onClick={cycle}
                className={iconButton}
                title="Switch between light, dark and system (T)"
                aria-label={`Theme: ${themeLabel}. Switch to the next theme.`}
              >
                <ThemeIcon className="h-[18px] w-[18px]" />
              </button>

              <button
                type="button"
                onClick={onSearchClick}
                className={iconButton}
                title={`Search or run a command (${modKey()}+K)`}
                aria-label="Search your tasks, or run a command"
              >
                <Search className="h-[18px] w-[18px]" />
              </button>

              <div className="relative" ref={notificationContainerRef}>
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={cn(iconButton, 'relative')}
                  title={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                  aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                >
                  <Bell className="h-[18px] w-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
                  )}
                </button>
                {showNotifications && (
                  <NotificationCenter onClose={() => setShowNotifications(false)} />
                )}
              </div>
            </div>
          </div>

          {/* Row two — the one deliberate move */}
          <nav aria-label="Primary" className="flex items-end gap-6 sm:gap-8">
            {NAV.map((item) => {
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group relative pb-3 pt-1 text-[2rem] font-semibold leading-none tracking-[-0.045em] transition-colors sm:text-[2.75rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background',
                    isActive
                      ? 'uppercase text-foreground'
                      : 'lowercase text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.name}
                  {isActive && (
                    <m.span
                      // One rule that slides between the two words rather than
                      // blinking out and back in.
                      layoutId="nav-underline"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-x-0 bottom-1.5 h-[3px] rounded-full bg-foreground"
                    />
                  )}
                </Link>
              );
            })}
            </nav>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
