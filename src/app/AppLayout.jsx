import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import { Toaster } from '../components/ui/toast';
import { themeService } from '../services/themeService';
import { notificationService } from '../services/notificationService';
import { useSEO } from '../hooks/useSEO';

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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
    <div className="relative min-h-dvh flex flex-col bg-background transition-colors duration-300 overflow-x-hidden">
      {/* Ambient, calming background effect (sits behind all content) */}
      <div className="app-aurora" aria-hidden="true" />

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
      {sidebarOpen && (
        <Sidebar isMobile={true} onClose={handleSidebarClose} />
      )}

      {/* Main Content */}
      <div className="relative z-10 lg:pl-[var(--sidebar-width)] flex-1 flex flex-col min-h-0">
        <Header onMenuClick={handleSidebarOpen} />
        <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col pt-[var(--header-height)] overflow-x-hidden overflow-y-auto lg:overflow-y-auto focus:outline-none">
          <div className="flex-1 w-full content-wide px-responsive py-responsive flex flex-col min-h-0 gap-[var(--panel-gap)]">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

export default AppLayout;

