import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Bell, Volume2, CheckSquare, Calendar, Timer } from 'lucide-react';
import { Checkbox } from '../components/ui/checkbox';
import { Select } from '../components/ui/select';
import { notificationService } from '../services/notificationService';

function Settings() {
  const [notificationSettings, setNotificationSettings] = useState(notificationService.getSettings());

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


  return (
    <div className="container mx-auto max-w-5xl space-y-6 py-8 px-4">
      {/* Header */}
      <div className="space-y-2 animate-fade-in-up">
        <h1 className="text-4xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your notification preferences and app settings
        </p>
      </div>

      {/* Notifications Card */}
      <Card className="glass-card border-none animate-fade-in-up shadow-lg" style={{ animationDelay: '0.1s' }}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Global Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50 hover:bg-background/70 transition-colors">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Enable Notifications</h3>
                <p className="text-sm text-muted-foreground">Master switch for all notifications</p>
              </div>
              <Checkbox
                checked={notificationSettings.enabled}
                onCheckedChange={(checked) => handleNotificationSettingsChange({ enabled: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50 hover:bg-background/70 transition-colors">
              <div className="flex-1 flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Notification Sound</h3>
                  <p className="text-sm text-muted-foreground">Play sound when notifications arrive</p>
                </div>
              </div>
              <Checkbox
                checked={notificationSettings.soundEnabled}
                onCheckedChange={(checked) => handleNotificationSettingsChange({ soundEnabled: checked })}
              />
            </div>
          </div>

          {/* Notification Types */}
          <div className="border-t border-border/50 pt-6 space-y-4">
            <h3 className="font-semibold text-foreground text-base mb-4">Notification Types</h3>
            
            {/* Task Notifications */}
            <div className="relative rounded-xl border border-border/50 bg-background/30 hover:bg-background/40 transition-colors">
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <CheckSquare className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Task Notifications</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Stay on top of your tasks</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={notificationSettings.tasks.enabled}
                    onCheckedChange={(checked) => handleTaskSettingsChange({ enabled: checked })}
                  />
                </div>
                {notificationSettings.tasks.enabled && (
                  <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground mb-1">Due Date Reminder</p>
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
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground mb-1">Overdue Tasks</p>
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
            </div>

            {/* Event Notifications */}
            <div className="relative rounded-xl border border-border/50 bg-background/30 hover:bg-background/40 transition-colors">
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <Calendar className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Event Notifications</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Never miss an important event</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={notificationSettings.events.enabled}
                    onCheckedChange={(checked) => handleEventSettingsChange({ enabled: checked })}
                  />
                </div>
                {notificationSettings.events.enabled && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground mb-1">Reminder Time</p>
                        <p className="text-xs text-muted-foreground">Minutes before event starts</p>
                      </div>
                      <Select
                        value={String(notificationSettings.events.reminderTime)}
                        onChange={(e) => handleEventSettingsChange({ reminderTime: parseInt(e.target.value) })}
                        className="w-32"
                      >
                        <option value="5">5 min</option>
                        <option value="15">15 min</option>
                        <option value="30">30 min</option>
                        <option value="60">1 hour</option>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timer Notifications */}
            <div className="relative rounded-xl border border-border/50 bg-background/30 hover:bg-background/40 transition-colors">
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                      <Timer className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Timer Notifications</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Alerts when sessions complete</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={notificationSettings.timer.enabled}
                    onCheckedChange={(checked) => handleNotificationSettingsChange({ 
                      timer: { ...notificationSettings.timer, enabled: checked }
                    })}
                  />
                </div>
                {notificationSettings.timer.enabled && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">Get notified when your focus timer sessions complete</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Settings;
