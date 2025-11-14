import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Bell, Moon, Sun, Monitor, Sparkles, Zap, Volume2 } from 'lucide-react';
import { Button } from '../components/ui/button';

function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [theme, setTheme] = useState('system');

  const applyTheme = (newTheme) => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'light');
    
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
  };

  useEffect(() => {
    // Load current theme
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
    
    // Listen for theme changes from sidebar
    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem('theme') || 'system';
      setTheme(currentTheme);
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event in case theme changes in same window
    const handleThemeChange = (e) => {
      setTheme(e.detail.theme);
    };
    
    window.addEventListener('themechange', handleThemeChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themechange', handleThemeChange);
    };
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    
    // Dispatch custom event so sidebar can update
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-8 py-8">
      <div className="space-y-4 animate-fade-in-up">
        <h1 className="text-5xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground text-lg">
          Customize your Zephyr experience
        </p>
      </div>

      {/* Notifications Card */}
      <Card className="glass-card border-none animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl">
            <div>
              <h3 className="font-medium text-foreground">Desktop Notifications</h3>
              <p className="text-sm text-muted-foreground">Get notified when sessions complete</p>
            </div>
            <Button
              variant={notifications ? "default" : "outline"}
              size="sm"
              onClick={() => setNotifications(!notifications)}
            >
              {notifications ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl">
            <div>
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Sound Effects
              </h3>
              <p className="text-sm text-muted-foreground">Play sounds on task completion</p>
            </div>
            <Button
              variant={sounds ? "default" : "outline"}
              size="sm"
              onClick={() => setSounds(!sounds)}
            >
              {sounds ? 'On' : 'Off'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Card */}
      <Card className="glass-card border-none animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => handleThemeChange('light')}
              className={`p-6 border-2 rounded-xl cursor-pointer hover:scale-105 transition-transform ${
                theme === 'light' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <Sun className={`h-8 w-8 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`font-medium ${theme === 'light' ? 'text-foreground' : 'text-muted-foreground'}`}>Light</span>
              </div>
            </div>
            
            <div 
              onClick={() => handleThemeChange('dark')}
              className={`p-6 border-2 rounded-xl cursor-pointer hover:scale-105 transition-transform ${
                theme === 'dark' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <Moon className={`h-8 w-8 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`font-medium ${theme === 'dark' ? 'text-foreground' : 'text-muted-foreground'}`}>Dark</span>
              </div>
            </div>
            
            <div 
              onClick={() => handleThemeChange('system')}
              className={`p-6 border-2 rounded-xl cursor-pointer hover:scale-105 transition-transform ${
                theme === 'system' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <Monitor className={`h-8 w-8 ${theme === 'system' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`font-medium ${theme === 'system' ? 'text-foreground' : 'text-muted-foreground'}`}>Auto</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About Card */}
      <Card className="glass-card border-none animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            About Zephyr
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Zephyr</strong> is a next-generation productivity platform 
              that helps you achieve deep focus through Pomodoro sessions, intelligent task management, 
              and mindful planning.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold">Version:</span>
              <span>1.0.0</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground font-semibold">Tagline:</span>
              <span className="italic text-primary">&ldquo;Flow Through Focus&rdquo;</span>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

export default Settings;
