import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Bell, Moon, Sun, Monitor, Sparkles, Zap, Volume2, CheckSquare, Calendar, BookOpen, Timer, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { notificationService } from '../services/notificationService';

function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [theme, setTheme] = useState('system');
  const [notificationSettings, setNotificationSettings] = useState(notificationService.getSettings());

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

  const handleNotificationSettingsChange = (updates) => {
    const newSettings = { ...notificationSettings, ...updates };
    setNotificationSettings(newSettings);
    notificationService.saveSettings(newSettings);
    
    // Restart checking with new settings
    notificationService.stopChecking();
    notificationService.startChecking();
  };

  const handleTaskSettingsChange = (updates) => {
    handleNotificationSettingsChange({
      tasks: { ...notificationSettings.tasks, ...updates }
    });
  };

  const handleEventSettingsChange = (updates) => {
    handleNotificationSettingsChange({
      events: { ...notificationSettings.events, ...updates }
    });
  };

  const handleJournalSettingsChange = (updates) => {
    handleNotificationSettingsChange({
      journal: { ...notificationSettings.journal, ...updates }
    });
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
        <CardContent className="space-y-6">
          {/* Global Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl">
              <div className="flex-1">
                <h3 className="font-medium text-foreground">Enable Notifications</h3>
                <p className="text-sm text-muted-foreground">Master switch for all notifications</p>
              </div>
              <Checkbox
                checked={notificationSettings.enabled}
                onCheckedChange={(checked) => handleNotificationSettingsChange({ enabled: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl">
              <div className="flex-1">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Notification Sound
                </h3>
                <p className="text-sm text-muted-foreground">Play sound when notifications arrive</p>
              </div>
              <Checkbox
                checked={notificationSettings.soundEnabled}
                onCheckedChange={(checked) => handleNotificationSettingsChange({ soundEnabled: checked })}
              />
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Notification Types</h3>
            
            {/* Task Notifications */}
            <div className="space-y-3 p-4 bg-background/30 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-blue-500" />
                  <h4 className="font-medium text-foreground">Task Notifications</h4>
                </div>
                <Checkbox
                  checked={notificationSettings.tasks.enabled}
                  onCheckedChange={(checked) => handleTaskSettingsChange({ enabled: checked })}
                />
              </div>
              {notificationSettings.tasks.enabled && (
                <div className="space-y-3 pl-6 border-l-2 border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Due Date Reminder</p>
                      <p className="text-xs text-muted-foreground">Days before due date</p>
                    </div>
                    <Select
                      value={String(notificationSettings.tasks.dueDateReminder)}
                      onChange={(e) => handleTaskSettingsChange({ dueDateReminder: parseInt(e.target.value) })}
                      className="w-32"
                    >
                      <option value="1">1 day</option>
                      <option value="2">2 days</option>
                      <option value="3">3 days</option>
                      <option value="7">1 week</option>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Overdue Tasks</p>
                      <p className="text-xs text-muted-foreground">Notify about overdue tasks</p>
                    </div>
                    <Checkbox
                      checked={notificationSettings.tasks.overdue}
                      onCheckedChange={(checked) => handleTaskSettingsChange({ overdue: checked })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Event Notifications */}
            <div className="space-y-3 p-4 bg-background/30 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <h4 className="font-medium text-foreground">Event Notifications</h4>
                </div>
                <Checkbox
                  checked={notificationSettings.events.enabled}
                  onCheckedChange={(checked) => handleEventSettingsChange({ enabled: checked })}
                />
              </div>
              {notificationSettings.events.enabled && (
                <div className="space-y-3 pl-6 border-l-2 border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Reminder Time</p>
                      <p className="text-xs text-muted-foreground">Minutes before event starts</p>
                    </div>
                    <Select
                      value={String(notificationSettings.events.reminderTime)}
                      onChange={(e) => handleEventSettingsChange({ reminderTime: parseInt(e.target.value) })}
                      className="w-32"
                    >
                      <option value="5">5 minutes</option>
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Journal Notifications */}
            <div className="space-y-3 p-4 bg-background/30 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-500" />
                  <h4 className="font-medium text-foreground">Journal Reminders</h4>
                </div>
                <Checkbox
                  checked={notificationSettings.journal.enabled}
                  onCheckedChange={(checked) => handleJournalSettingsChange({ enabled: checked })}
                />
              </div>
              {notificationSettings.journal.enabled && (
                <div className="space-y-3 pl-6 border-l-2 border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Reminder Time</p>
                      <p className="text-xs text-muted-foreground">Daily reminder time</p>
                    </div>
                    <Input
                      type="time"
                      value={notificationSettings.journal.reminderTime}
                      onChange={(e) => handleJournalSettingsChange({ reminderTime: e.target.value })}
                      className="w-32"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Timer Notifications */}
            <div className="space-y-3 p-4 bg-background/30 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-green-500" />
                  <h4 className="font-medium text-foreground">Timer Notifications</h4>
                </div>
                <Checkbox
                  checked={notificationSettings.timer.enabled}
                  onCheckedChange={(checked) => handleNotificationSettingsChange({ 
                    timer: { ...notificationSettings.timer, enabled: checked }
                  })}
                />
              </div>
              {notificationSettings.timer.enabled && (
                <div className="pl-6 border-l-2 border-border">
                  <p className="text-xs text-muted-foreground">Get notified when timer sessions complete</p>
                </div>
              )}
            </div>
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
