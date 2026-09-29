import { Link, useLocation } from 'react-router-dom';
import { m } from 'motion/react';
import { cn } from '../../lib/utils';
import { useTasks } from '../../hooks/useStore';
import { useTimerSnapshot } from '../../hooks/useTimerSnapshot';
import { formatTime } from '../../lib/time';
import { NightSurface } from '../ui/night-surface';
import ZephyrMark from './ZephyrMark';
import { GENERAL, MENU } from './navItems';

function NavItem({ item, active, badge }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative isolate flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground hover:text-foreground'
      )}
    >
      {active && (
        <m.span
          layoutId="sidebar-active"
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          className="absolute inset-0 -z-10 rounded-2xl bg-accent"
        />
      )}
      <Icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
      <span className="flex-1">{item.name}</span>
      {badge ? (
        <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-semibold tabular-nums text-background">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

/**
 * The card at the foot of the sidebar. While a session runs, or waits paused,
 * it is the timer, readable from any page; otherwise it is the way into one.
 */
function FocusCard() {
  const timer = useTimerSnapshot();
  const running = Boolean(timer?.running);
  const paused = Boolean(timer?.paused);
  const live = running || paused;
  const minutes = Math.round((timer?.workTime || 1500) / 60);
  const label = running ? (timer.isBreak ? 'On a break' : 'In focus') : paused ? 'Paused' : 'Focus';

  return (
    <NightSurface className="p-5">
      <p className="text-[13px] font-semibold text-hero-foreground/65">{label}</p>
      {live ? (
        <>
          <p className="mt-2 text-3xl font-semibold tabular-nums tracking-[-0.02em]">{formatTime(timer.timeLeft)}</p>
          {timer.focusTask?.title && (
            <p className="mt-1 truncate text-sm text-hero-foreground/70">{timer.focusTask.title}</p>
          )}
        </>
      ) : (
        <p className="mt-2 text-3xl font-semibold tabular-nums tracking-[-0.02em]">{formatTime(minutes * 60)}</p>
      )}
      <Link
        to={live ? '/focus' : '/focus?start=1'}
        className="mt-5 flex h-10 items-center justify-center rounded-full bg-hero-foreground text-sm font-semibold text-hero-to transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun"
      >
        {running ? 'Open' : paused ? 'Resume' : 'Start'}
      </Link>
    </NightSurface>
  );
}

function Sidebar() {
  const { pathname } = useLocation();
  const [tasks] = useTasks();
  const open = tasks.filter((t) => !t.completed).length;

  return (
    <aside
      aria-label="Sidebar"
      className="fixed inset-y-0 left-0 z-30 hidden w-(--sidebar-width) p-3 pr-0 lg:block"
    >
      <div className="flex h-full flex-col overflow-y-auto rounded-[1.75rem] bg-card px-4 pb-4 pt-6 shadow-(--shadow-card)">
        <Link
          to="/"
          aria-label="Zephyr, go to the dashboard"
          className="mx-2 flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ZephyrMark size={36} />
          <span className="text-[22px] font-semibold tracking-[-0.03em] text-foreground">Zephyr</span>
        </Link>

        <nav aria-label="Primary" className="mt-10">
          <p className="mb-2 px-3.5 text-[13px] font-semibold text-muted-foreground">Menu</p>
          <ul className="space-y-1">
            {MENU.map((item) => (
              <li key={item.href}>
                <NavItem item={item} active={pathname === item.href} badge={item.href === '/tasks' && open ? open : null} />
              </li>
            ))}
          </ul>

          <p className="mb-2 mt-8 px-3.5 text-[13px] font-semibold text-muted-foreground">General</p>
          <ul className="space-y-1">
            {GENERAL.map((item) => (
              <li key={item.href}>
                <NavItem item={item} active={pathname === item.href} />
              </li>
            ))}
          </ul>
        </nav>

        {/* The dashboard and Focus carry their own timer, so the card stands down there. */}
        <div className="mt-auto pt-8">{pathname !== '/focus' && pathname !== '/' && <FocusCard />}</div>
      </div>
    </aside>
  );
}

export default Sidebar;
