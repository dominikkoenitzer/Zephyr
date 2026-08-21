import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { m } from 'motion/react';
import {
  House,
  Timer,
  CheckSquare,
  Settings,
  HelpCircle,
  X,
  FileText,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { themeService } from '../../services/themeService';
import { useTasks } from '../../hooks/useStore';

// Everyday tools — the primary, high-emphasis destinations.
const primaryNavigation = [
  { name: 'Home', href: '/', icon: House },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Focus Timer', href: '/focus', icon: Timer },
  { name: 'Notes', href: '/notes', icon: FileText },
];

// Utility — kept available but visually de-emphasised at the bottom.
const secondaryNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

function Sidebar({ isMobile = false, onClose }) {
  const location = useLocation();
  const [colorMode, setColorMode] = useState(() =>
    themeService.getCurrentColorMode()
  );
  const [tasks] = useTasks();
  const activeTaskCount = tasks.filter((t) => !t.completed).length;

  // The mode is read straight into state above, so the only job here is to
  // follow later changes. The observer is attached before initialize() runs so
  // that a class it rewrites is still seen.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setColorMode(themeService.getCurrentColorMode());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    themeService.initialize();

    return () => observer.disconnect();
  }, []);

  const toggleColorMode = () => {
    const root = window.document.documentElement;
    const newMode = colorMode === 'dark' ? 'light' : 'dark';
    
    root.classList.remove('dark', 'light');
    root.classList.add(newMode);
    
    setColorMode(newMode);
    localStorage.setItem('theme', newMode);
    themeService.applyTheme(newMode);
    
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newMode } }));
  };

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 lg:hidden">
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <m.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 36 }}
          className="fixed left-0 top-0 h-full w-(--sidebar-width) bg-background border-r border-border shadow-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 sm:p-6 pb-4 sm:pb-6 shrink-0">
            <BrandMark />
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
              aria-label="Close sidebar"
              title="Close sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
            <SidebarContent
              primaryNavigation={primaryNavigation}
              secondaryNavigation={secondaryNavigation}
              location={location}
              onItemClick={onClose}
              colorMode={colorMode}
              onToggleColorMode={toggleColorMode}
              variant="mobile"
              activeTaskCount={activeTaskCount}
            />
          </div>
        </m.div>
      </div>
    );
  }

  return (
    <aside
      aria-label="Sidebar"
      className="hidden lg:flex lg:flex-col lg:w-[var(--sidebar-width)] lg:fixed lg:inset-y-0 bg-background border-r border-border overflow-hidden"
    >
      <div className="flex flex-col h-full">
        <div className="shrink-0 p-6 pb-4">
          <BrandMark />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
          <SidebarContent
            primaryNavigation={primaryNavigation}
            secondaryNavigation={secondaryNavigation}
            location={location}
            colorMode={colorMode}
            onToggleColorMode={toggleColorMode}
            variant="desktop"
            activeTaskCount={activeTaskCount}
          />
        </div>
      </div>
    </aside>
  );
}

function BrandMark() {
  return (
    <div className="min-w-0">
      {/* The app name, not a page heading: every route already renders its own
          h1 in PageHeader, and a second one here outranked it. */}
      <p className="text-2xl font-bold leading-tight text-foreground">Zephyr</p>
      <p className="text-xs text-muted-foreground truncate mt-0.5">Flow Through Focus</p>
    </div>
  );
}

function SidebarContent({
  primaryNavigation,
  secondaryNavigation,
  location,
  onItemClick,
  colorMode,
  onToggleColorMode,
  variant = 'desktop',
  activeTaskCount = 0
}) {
  const renderLink = (item, { compact = false } = {}) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href;

    return (
      <Link
        key={item.name}
        to={item.href}
        onClick={onItemClick}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          "group relative flex items-center gap-3 px-3.5 rounded-xl text-sm font-medium transition-colors duration-200",
          compact ? "py-2" : "py-2.5",
          isActive
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
        )}
      >
        {isActive && (
          <m.div
            // Shared layoutId per sidebar instance makes the active pill
            // glide between nav items instead of jumping. No CSS transform
            // here — Motion owns the transform during layout animations.
            layoutId={`sidebar-active-pill-${variant}`}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
          />
        )}
        <Icon className={cn(
          "relative h-5 w-5 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )} />
        <span className="relative flex-1">{item.name}</span>
        {item.href === '/tasks' && activeTaskCount > 0 && (
          <span className="relative ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[11px] font-semibold text-primary">
            {activeTaskCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="flex flex-col min-h-full">
      <nav className="flex-1 space-y-1" aria-label="Primary">
        {primaryNavigation.map((item) => renderLink(item))}
      </nav>

      <div className="mt-auto pt-4 border-t border-border/50 space-y-1">
        <nav className="space-y-1" aria-label="Settings and help">
          {secondaryNavigation.map((item) => renderLink(item, { compact: true }))}
        </nav>
        <Button
          variant="ghost"
          onClick={onToggleColorMode}
          className="w-full justify-start text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-xl transition-all"
        >
          {colorMode === 'dark' ? <Sun className="mr-3 h-4 w-4" /> : <Moon className="mr-3 h-4 w-4" />}
          {colorMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </div>
    </div>
  );
}

export default Sidebar;
