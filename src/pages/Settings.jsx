import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Bell, Volume2, CheckSquare, Calendar, Timer, Trash2, AlertTriangle } from 'lucide-react';
import { Checkbox } from '../components/ui/checkbox';
import { Select } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import Toast from '../components/ui/toast';
import { notificationService } from '../services/notificationService';
import { localStorageService } from '../services/localStorage';

function Settings() {
  const [notificationSettings, setNotificationSettings] = useState(notificationService.getSettings());
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [toast, setToast] = useState(null);

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

  const handleClearAllLocalStorage = () => {
    try {
      // Clear all data using the localStorage service
      localStorageService.clearAllData();
      
      // Clear additional keys that might not be in STORAGE_KEYS
      const additionalKeys = [
        'zephyrSettings',
        'focusTimerPresets',
        'selectedFocusPreset',
        'zephyr_note_folders',
        'theme',
        'gardenTheme',
        'zephyr_notifications',
        'zephyr_notification_settings'
      ];
      
      additionalKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear all remaining localStorage items (catch-all)
      localStorage.clear();
      
      // Reset notification settings to default
      setNotificationSettings(notificationService.getSettings());
      
      // Show custom toast notification
      setToast({
        message: 'All local storage data has been cleared successfully. The page will reload.',
        type: 'success'
      });
      
      // Reload the page after a short delay to show the toast
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Failed to clear local storage:', error);
      setToast({
        message: 'Failed to clear local storage. Please try again.',
        type: 'error'
      });
    }
  };


  return (
    <div className="container mx-auto max-w-7xl py-8 px-6 h-[calc(100vh-6rem)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="space-y-2 mb-6 flex-shrink-0">
        <h1 className="text-4xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-base text-muted-foreground">
          Manage your notification preferences and app settings
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-y-auto pb-4">
        {/* Notifications Card */}
        <Card className="glass-card border-none shadow-lg h-fit">
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

        {/* Data Management Card */}
        <Card className="glass-card border-none shadow-lg h-fit">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-4 text-2xl">
              <div className="p-3 rounded-lg bg-destructive/10">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 rounded-xl bg-background/50 border border-border/50 space-y-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground mb-2">Clear All Local Storage</h3>
                  <p className="text-base text-muted-foreground mb-3">
                    This will permanently delete all data stored locally in your browser, including:
                  </p>
                  <ul className="text-base text-muted-foreground mt-3 ml-6 list-disc space-y-2">
                    <li>Tasks and task folders</li>
                    <li>Calendar events</li>
                    <li>Notes and journals</li>
                    <li>Focus timer sessions and presets</li>
                    <li>Wellness data</li>
                    <li>Settings and preferences</li>
                    <li>Notification history</li>
                  </ul>
                  <p className="text-base text-destructive font-semibold mt-4">
                    This action cannot be undone. The page will reload after clearing.
                  </p>
                </div>
              </div>
              <div className="flex justify-start pt-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowClearDialog(true);
                  }}
                  className="w-full sm:w-auto cursor-pointer text-base px-6 py-6"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  Clear All Local Storage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clear Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Clear All Local Storage?
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to clear all local storage data? This will permanently delete:
              <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
                <li>All tasks, events, notes, and journal entries</li>
                <li>All settings and preferences</li>
                <li>All timer sessions and presets</li>
                <li>All wellness tracking data</li>
              </ul>
              <p className="mt-3 font-semibold text-destructive">
                This action cannot be undone. The page will reload after clearing.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowClearDialog(false);
                handleClearAllLocalStorage();
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={toast.type === 'success' ? 2000 : 4000}
        />
      )}
    </div>
  );
}

export default Settings;
