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
    <div className="min-h-dvh flex flex-col bg-background transition-colors duration-300 overflow-x-hidden">
      {/* Desktop Sidebar */}
      <Sidebar isMobile={false} />
      
      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <Sidebar isMobile={true} onClose={handleSidebarClose} />
      )}

      {/* Main Content */}
      <div className="lg:pl-[var(--sidebar-width)] flex-1 flex flex-col min-h-0">
        <Header onMenuClick={handleSidebarOpen} />
        <main className="flex-1 flex flex-col pt-[var(--header-height)] overflow-x-hidden overflow-y-auto lg:overflow-y-auto">
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

