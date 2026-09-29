import { Link, useLocation } from 'react-router-dom';
import { m } from 'motion/react';
import { cn } from '../../lib/utils';
import { GENERAL, MENU } from './navItems';

const ITEMS = [...MENU, GENERAL[0]];

/**
 * The sidebar's phone form: one floating pill at the bottom of the screen with
 * the three destinations and Settings. Help stays one tap away in Settings and
 * the footer.
 */
function MobileNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-center justify-between rounded-full bg-card p-1.5 shadow-(--shadow-overlay)">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <li key={item.href} className="flex-1">
              <Link
                to={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative isolate flex h-12 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'bg-hero-to text-hero-foreground' : 'text-muted-foreground'
                )}
              >
                {active && (
                  <m.span
                    layoutId="mobile-nav-active"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    className="absolute inset-0 -z-10 rounded-full bg-linear-to-br from-hero-from to-hero-to dark:ring-1 dark:ring-inset dark:ring-white/12"
                  />
                )}
                <Icon className="h-[18px] w-[18px]" />
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default MobileNav;
