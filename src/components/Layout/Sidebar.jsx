import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Timer, 
  CheckSquare, 
  Calendar, 
  BarChart3, 
  Settings, 
  HelpCircle,
  X,
  BookOpen,
  FileText,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { themeService } from '../../services/themeService';

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Focus Timer', href: '/focus', icon: Timer },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Notes', href: '/notes', icon: FileText },
  { name: 'Journal', href: '/journal', icon: BookOpen },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

function Sidebar({ isMobile = false, onClose }) {
  const location = useLocation();
  const [colorMode, setColorMode] = useState('light');

  useEffect(() => {
    themeService.initialize();
    setColorMode(themeService.getCurrentColorMode());

    // Listen for color mode changes
    const observer = new MutationObserver(() => {
      setColorMode(themeService.getCurrentColorMode());
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
        <div className="fixed left-0 top-0 h-full w-[var(--sidebar-width)] bg-background/95 backdrop-blur-xl border-r border-border/50 animate-slide-in-from-left shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 sm:p-6 pb-4 sm:pb-6 flex-shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Zephyr</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Flow Through Focus</p>
            </div>
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
              navigation={navigation} 
              location={location} 
              onItemClick={onClose}
              colorMode={colorMode}
              onToggleColorMode={toggleColorMode}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-[var(--sidebar-width)] lg:fixed lg:inset-y-0 bg-background/95 backdrop-blur-xl border-r border-border/50 shadow-lg overflow-hidden">
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 p-6 pb-4">
          <h1 className="text-2xl font-bold text-foreground mb-1">Zephyr</h1>
          <p className="text-xs text-muted-foreground">Flow Through Focus</p>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
          <SidebarContent 
            navigation={navigation} 
            location={location} 
            colorMode={colorMode}
            onToggleColorMode={toggleColorMode}
          />
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ 
  navigation, 
  location, 
  onItemClick,
  colorMode,
  onToggleColorMode
}) {
  return (
    <div className="flex flex-col min-h-full">
      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onItemClick}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative",
                isActive 
                  ? "text-foreground bg-accent" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
              )}
              <Icon className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              <span className="flex-1">{item.name}</span>
              {isActive && (
                <ChevronRight className="h-4 w-4 text-primary" />
              )}
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto pt-4 border-t border-border/50 space-y-3">
        <Button
          variant="ghost"
          onClick={onToggleColorMode}
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-all"
        >
          <Sparkles className="mr-3 h-4 w-4" />
          {colorMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </div>
    </div>
  );
}

export default Sidebar;
