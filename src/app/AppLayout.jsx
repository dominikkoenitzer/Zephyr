import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LazyMotion, domMax, MotionConfig, AnimatePresence, m } from 'motion/react';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import { Toaster } from '../components/ui/toast';
import { themeService } from '../services/themeService';
import { notificationService } from '../services/notificationService';
import { useSEO } from '../hooks/useSEO';

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Update SEO metadata for each route
  useSEO();

  useEffect(() => {
    themeService.initialize();
    
    // Start notification checking
    notificationService.startChecking();
    
    return () => {
      notificationService.stopChecking();
    };
  }, []);

  const handleSidebarOpen = () => setSidebarOpen(true);
  const handleSidebarClose = () => setSidebarOpen(false);

  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        <div className="min-h-dvh flex flex-col bg-background transition-colors duration-300 overflow-x-hidden">
          {/* Keyboard / screen-reader users can jump straight to the content */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-3 focus:left-3 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
          >
            Skip to main content
          </a>

          {/* Desktop Sidebar */}
          <Sidebar isMobile={false} />

          {/* Mobile Sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <Sidebar isMobile={true} onClose={handleSidebarClose} />
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="lg:pl-[var(--sidebar-width)] flex-1 flex flex-col min-h-0">
            <Header onMenuClick={handleSidebarOpen} />
            <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col pt-[var(--header-height)] overflow-x-hidden overflow-y-auto lg:overflow-y-auto focus:outline-none">
              {/* Re-keyed per route so every page mounts with a quick
                  fade-and-rise. Enter-only (no exit) keeps navigation snappy. */}
              <m.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex-1 w-full content-wide px-responsive py-responsive flex flex-col min-h-0 gap-[var(--panel-gap)]"
              >
                <Outlet />
              </m.div>
            </main>
          </div>
          <Toaster />
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}

export default AppLayout;

