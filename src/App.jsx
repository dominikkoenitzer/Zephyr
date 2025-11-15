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
    <div className="h-screen lg:h-screen min-h-screen bg-background transition-colors duration-300 overflow-x-hidden lg:overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar isMobile={false} />
      
      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <Sidebar isMobile={true} onClose={handleSidebarClose} />
      )}

      {/* Main Content */}
      <div className="lg:pl-72 h-full lg:h-screen flex flex-col flex-1 lg:overflow-hidden">
        <Header onMenuClick={handleSidebarOpen} />
        <main className="flex-1 lg:overflow-hidden lg:flex lg:items-center lg:justify-center overflow-y-auto lg:overflow-y-hidden pt-16 lg:pt-16">
          <div className="w-full h-full lg:max-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 2xl:px-10 py-2 sm:py-3 md:py-4 lg:py-5 xl:py-6 flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;