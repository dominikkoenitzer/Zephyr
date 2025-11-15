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
    <div className="h-screen bg-background transition-colors duration-300 overflow-hidden flex">
      {/* Desktop Sidebar */}
      <Sidebar isMobile={false} />
      
      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <Sidebar isMobile={true} onClose={handleSidebarClose} />
      )}

      {/* Main Content */}
      <div className="lg:pl-72 h-screen flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={handleSidebarOpen} />
        <main className="flex-1 overflow-hidden flex items-center justify-center">
          <div className="w-full h-full px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 2xl:px-10 py-2 sm:py-3 md:py-4 lg:py-5 xl:py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;