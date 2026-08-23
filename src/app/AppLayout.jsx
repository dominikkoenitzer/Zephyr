import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LazyMotion, domMax, MotionConfig, m } from 'motion/react';
import { toast } from 'sonner';
import TopBar from '../components/Layout/TopBar';
import CommandPalette from '../components/CommandPalette/CommandPalette';
import ShortcutsDialog from '../components/Shortcuts/ShortcutsDialog';
import { Toaster } from '../components/ui/toast';
import { themeService } from '../services/themeService';
import { notificationService } from '../services/notificationService';
import { useSEO } from '../hooks/useSEO';
import { useAppShortcuts } from '../hooks/useAppShortcuts';
import { usePwaUpdate } from '../hooks/usePwaUpdate';

const THEME_LABEL = { light: 'Light theme', dark: 'Dark theme', system: 'Matching your system' };

function AppLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Update SEO metadata for each route
  useSEO();

  // Registers the service worker, and offers a reload when a new build lands.
  usePwaUpdate();

  useEffect(() => {
    themeService.initialize();

    // Start notification checking
    notificationService.startChecking();

    return () => {
      notificationService.stopChecking();
    };
  }, []);

  // The palette and the keyboard map are both mounted here, so a command can
  // be run from any route without each page wiring it up.
  const openPalette = useCallback(() => {
    setShortcutsOpen(false);
    setPaletteOpen(true);
  }, []);
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);

  // Page-level intents travel as query params — the page answers them during
  // its own render, then strips the param.
  const newTask = useCallback(() => navigate('/tasks?new=1'), [navigate]);

  const toggleTheme = useCallback(() => {
    const { preference } = themeService.cyclePreference();
    // "System" is invisible when it happens to match what you already had, so
    // the switch says which of the three you landed on.
    toast(THEME_LABEL[preference], { duration: 1600 });
  }, []);

  useAppShortcuts({
    onOpenPalette: openPalette,
    onOpenShortcuts: openShortcuts,
    onNewTask: newTask,
    onToggleTheme: toggleTheme,
    onNavigate: navigate,
  });

  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        <div className="flex min-h-dvh flex-col overflow-x-hidden bg-background transition-colors duration-300">
          {/* Keyboard / screen-reader users can jump straight to the content */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:left-3 focus:top-3 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
          >
            Skip to main content
          </a>

          <TopBar onSearchClick={openPalette} />

          <main
            id="main-content"
            tabIndex={-1}
            className="scroll-stable flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto pt-(--header-height) focus:outline-none"
          >
            {/* Re-keyed per route so every page mounts with a quick
                fade-and-rise. Enter-only (no exit) keeps navigation snappy. */}
            <m.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex min-h-0 w-full flex-1 flex-col gap-(--panel-gap) px-responsive py-responsive"
            >
              <Outlet />
            </m.div>
          </main>

          <CommandPalette
            open={paletteOpen}
            onOpenChange={setPaletteOpen}
            onShowShortcuts={openShortcuts}
            onNewTask={newTask}
          />
          <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
          <Toaster />
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}

export default AppLayout;
