import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import { themeService } from './services/themeService';
import { notificationService } from './services/notificationService';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="min-h-screen bg-background transition-colors duration-300 overflow-x-hidden">
      {/* Desktop Sidebar */}
      <Sidebar isMobile={false} />
      
      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <Sidebar isMobile={true} onClose={handleSidebarClose} />
      )}

      {/* Main Content */}
      <div className="lg:pl-72">
        <Header onMenuClick={handleSidebarOpen} />
        <main className="pt-16 scroll-smooth-momentum scroll-premium">
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;