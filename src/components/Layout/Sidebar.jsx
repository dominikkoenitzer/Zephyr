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
  Palette,
  ChevronRight,
  Gem,
  Sparkle,
  Moon,
  Waves,
  TreePine,
  Flower2,
  Droplets,
  Circle,
  Sunset
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { themeService, GARDEN_THEMES } from '../../services/themeService';

// Theme icons mapping
const THEME_ICONS = {
  emerald: Gem,
  sapphire: Sparkle,
  amethyst: Gem,
  sunset: Sunset,
  midnight: Moon,
  coral: Flower2,
  mint: Droplets,
  aurora: Sparkles,
  ocean: Waves,
  forest: TreePine,
  default: Circle
};

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
  const [currentTheme, setCurrentTheme] = useState('default');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [colorMode, setColorMode] = useState('light');

  useEffect(() => {
    themeService.initialize();
    const savedTheme = themeService.getCurrentTheme();
    setCurrentTheme(savedTheme);
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

  const handleThemeSelect = (themeId) => {
    setCurrentTheme(themeId);
    themeService.applyTheme(themeId, colorMode);
    setShowThemePicker(false);
  };

  const toggleColorMode = () => {
    const root = window.document.documentElement;
    const newMode = colorMode === 'dark' ? 'light' : 'dark';
    
    root.classList.remove('dark', 'light');
    root.classList.add(newMode);
    
    setColorMode(newMode);
    localStorage.setItem('theme', newMode);
    themeService.applyTheme(currentTheme, newMode);
    
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newMode } }));
  };

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 lg:hidden">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
        <div className="fixed left-0 top-0 h-full w-72 bg-background/95 backdrop-blur-xl border-r border-border/50 animate-slide-in-from-left shadow-2xl flex flex-col overflow-hidden">
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
              currentTheme={currentTheme}
              showThemePicker={showThemePicker}
              setShowThemePicker={setShowThemePicker}
              onThemeSelect={handleThemeSelect}
              colorMode={colorMode}
              onToggleColorMode={toggleColorMode}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-background/95 backdrop-blur-xl border-r border-border/50 shadow-lg overflow-hidden">
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 p-6 pb-4">
          <h1 className="text-2xl font-bold text-foreground mb-1">Zephyr</h1>
          <p className="text-xs text-muted-foreground">Flow Through Focus</p>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
          <SidebarContent 
            navigation={navigation} 
            location={location}
            currentTheme={currentTheme}
            showThemePicker={showThemePicker}
            setShowThemePicker={setShowThemePicker}
            onThemeSelect={handleThemeSelect}
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
  currentTheme,
  showThemePicker,
  setShowThemePicker,
  onThemeSelect,
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
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Theme</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="h-7 w-7 p-0"
            aria-label={showThemePicker ? "Collapse themes" : "Expand themes"}
          >
            <ChevronRight className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              showThemePicker && "rotate-90"
            )} />
          </Button>
        </div>

        {showThemePicker && (
          <div className="grid grid-cols-2 gap-2">
            {Object.values(GARDEN_THEMES).map((theme) => {
              const isSelected = currentTheme === theme.id;
              const themeColor = theme.colors 
                ? `hsl(${theme.colors.primary})` 
                : 'hsl(var(--primary))';
              const ThemeIcon = THEME_ICONS[theme.id] || Circle;
              
              return (
                <button
                  type="button"
                  key={theme.id}
                  onClick={() => onThemeSelect(theme.id)}
                  className={cn(
                    "relative p-3 rounded-lg transition-all duration-200 group",
                    "border",
                    isSelected
                      ? "border-primary/50 bg-primary/5 shadow-sm ring-1 ring-primary/20"
                      : "border-border/40 hover:border-border/60 hover:bg-accent/20"
                  )}
                  title={theme.description}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div 
                      className="relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm group-hover:scale-105"
                      style={{ 
                        backgroundColor: themeColor,
                        boxShadow: isSelected 
                          ? `0 0 0 2px ${themeColor}30, 0 4px 12px ${themeColor}25` 
                          : `0 2px 6px ${themeColor}15`
                      }}
                    >
                      <ThemeIcon 
                        className={cn(
                          "h-5 w-5 transition-all duration-200",
                          isSelected ? "text-white scale-110" : "text-white/90 group-hover:text-white"
                        )}
                        strokeWidth={isSelected ? 2.5 : 2}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 rounded-lg bg-white/10" />
                      )}
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium transition-colors leading-tight",
                      isSelected ? "text-primary font-semibold" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {theme.name}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full border-2 border-background bg-primary flex items-center justify-center shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

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
