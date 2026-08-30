import { useState, useRef } from 'react';
import {
  Bell, Volume2, CheckSquare, Timer, Trash2, AlertTriangle, Download, Upload,
  Palette, Monitor, Moon, Sun, HardDrive, Keyboard,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import ShortcutsDialog from '../components/Shortcuts/ShortcutsDialog';
import { notificationService } from '../services/notificationService';
import { localStorageService } from '../services/localStorage';
import { applyBackup, downloadBackup, isValidBackup, wipeAllData } from '../lib/backup';
import { cn } from '../lib/utils';
import { useStoreValue } from '../hooks/useStore';
import { useTheme } from '../hooks/useTheme';
import PageHeader from '../components/Layout/PageHeader';
import PageContainer from '../components/Layout/PageContainer';
import { usePageMeta } from '../hooks/usePageMeta';
import { ROUTE_META } from '../routes/meta';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

const readStorageInfo = () => localStorageService.getStorageInfo();

function Settings() {
  usePageMeta(ROUTE_META['/settings']);

  const [notificationSettings, setNotificationSettings] = useState(notificationService.getSettings());
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const importInputRef = useRef(null);
  const { preference, colorMode, setPreference } = useTheme();
  // Re-reads itself on every write, so the figure moves as you use the app.
  const [storageInfo] = useStoreValue(readStorageInfo);

  const handleExport = () => {
    const { fileName } = downloadBackup();
    toast.success('Backup downloaded', { description: fileName });
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again later
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(reader.result);
        if (!isValidBackup(backup)) {
          toast.error('That file is not a Zephyr backup.');
          return;
        }
        const restored = applyBackup(backup);
        toast.success(`Restored ${restored} item${restored === 1 ? '' : 's'}. Reloading…`);
        setTimeout(() => window.location.reload(), 1200);
      } catch {
        toast.error('Could not read that backup file.');
      }
    };
    reader.readAsText(file);
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

  const handleClearAllLocalStorage = () => {
    try {
      // Scoped on purpose: this used to finish with localStorage.clear(),
      // which empties the whole origin rather than just what Zephyr owns.
      localStorageService.clearAllData();
      const removed = wipeAllData();

      setNotificationSettings(notificationService.getSettings());
      toast.success(`Cleared ${removed} stored item${removed === 1 ? '' : 's'}. The page will reload.`);

      setTimeout(() => window.location.reload(), 1600);
    } catch (error) {
      console.error('Failed to clear local storage:', error);
      toast.error('Failed to clear local storage. Please try again.');
    }
  };


  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Theme, notifications and what happens to your data"
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-(--panel-gap)">
        {/* Appearance Card */}
        <Card className="h-fit lg:col-span-2">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl text-foreground">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20">
                <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">Theme</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {preference === 'system'
                    ? `Following your system, which is currently ${colorMode}.`
                    : `Always ${preference}, whatever your system does.`}
                </p>
              </div>
              <div
                role="radiogroup"
                aria-label="Theme"
                className="flex items-center gap-1 rounded-full border border-border bg-background/70 p-1"
              >
                {THEME_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const active = preference === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setPreference(option.value)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border/50 pt-4">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">Keyboard shortcuts</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Press <kbd className="kbd">?</kbd> anywhere for this list, or <kbd className="kbd">Ctrl</kbd>
                  <kbd className="kbd">K</kbd> for the command palette.
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowShortcuts(true)}>
                <Keyboard className="h-4 w-4 mr-1.5" />
                View shortcuts
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card className="h-fit">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl text-foreground">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Global Settings */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-background/70 border border-border/60 hover:border-primary/30 hover:shadow-sm transition-colors">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">Enable Notifications</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Master switch for all notifications</p>
              </div>
              <Checkbox
                aria-label="Enable notifications"
                checked={notificationSettings.enabled}
                onCheckedChange={(checked) => handleNotificationSettingsChange({ enabled: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-background/70 border border-border/60 hover:border-primary/30 hover:shadow-sm transition-colors">
              <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
                <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">Notification Sound</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Play sound when notifications arrive</p>
                </div>
              </div>
              <Checkbox
                aria-label="Notification sound"
                checked={notificationSettings.soundEnabled}
                onCheckedChange={(checked) => handleNotificationSettingsChange({ soundEnabled: checked })}
              />
            </div>
          </div>

          {/* Notification Types */}
          <div className="border-t border-border/50 pt-6 space-y-4">
            <h3 className="font-semibold text-foreground text-base mb-4">Notification Types</h3>
            
            {/* Task Notifications */}
            <div className="relative rounded-xl border border-border/60 bg-background/80 hover:border-primary/30 hover:shadow-md transition-colors">
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/15 border border-primary/20 text-primary">
                      <CheckSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Task Notifications</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Reminders for due and overdue tasks</p>
                    </div>
                  </div>
                  <Checkbox
                    aria-label="Task notifications"
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
                        onValueChange={(value) => handleTaskSettingsChange({ dueDateReminder: parseInt(value) })}
                      >
                        <SelectTrigger aria-label="Due date reminder" className="w-32">
                          <SelectValue placeholder="Select reminder" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 day</SelectItem>
                          <SelectItem value="2">2 days</SelectItem>
                          <SelectItem value="3">3 days</SelectItem>
                          <SelectItem value="7">1 week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground mb-1">Overdue Tasks</p>
                        <p className="text-xs text-muted-foreground">Notify about overdue tasks</p>
                      </div>
                      <Checkbox
                        aria-label="Overdue tasks"
                        checked={notificationSettings.tasks.overdue}
                        onCheckedChange={(checked) => handleTaskSettingsChange({ overdue: checked })}
                      />
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
                    <div className="p-2 rounded-lg bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20">
                      <Timer className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Timer Notifications</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Alerts when sessions complete</p>
                    </div>
                  </div>
                  <Checkbox
                    aria-label="Timer notifications"
                    checked={notificationSettings.timer.enabled}
                    onCheckedChange={(checked) => handleNotificationSettingsChange({ 
                      timer: { ...notificationSettings.timer, enabled: checked }
                    })}
                  />
                </div>
                {notificationSettings.timer.enabled && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">A chime and a notification when a work or break session ends</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Data Management Card */}
        <Card className="h-fit">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex items-center gap-2 sm:gap-4 text-lg sm:text-xl md:text-2xl">
              <div className="p-2 sm:p-3 rounded-lg bg-destructive/15 shadow-sm ring-1 ring-destructive/20">
                <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
              </div>
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Backup & restore */}
            <div className="p-4 sm:p-6 rounded-xl bg-background/70 border border-border/60 space-y-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <Download className="h-5 w-5 sm:h-6 sm:w-6 text-primary mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg text-foreground mb-1 sm:mb-2">Backup &amp; Restore</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Download all your data as a single file, or restore a backup on any device.
                    The file is written by your browser, so nothing is uploaded.
                  </p>
                </div>
              </div>
              <p className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <HardDrive className="h-4 w-4 shrink-0" aria-hidden="true" />
                Zephyr is currently storing {storageInfo.totalSizeFormatted || '0 Bytes'} in this browser.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-1.5" />
                  Export data
                </Button>
                <Button variant="outline" onClick={() => importInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-1.5" />
                  Import backup
                </Button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  aria-label="Import a Zephyr backup file"
                  onChange={handleImportFile}
                />
              </div>
            </div>

            <div className="p-4 sm:p-6 rounded-xl bg-background/80 border border-border/60 space-y-4 sm:space-y-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg text-foreground mb-1 sm:mb-2">Clear All Local Storage</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-2 sm:mb-3">
                    This will permanently delete all data stored locally in your browser, including:
                  </p>
                  <ul className="text-sm sm:text-base text-muted-foreground mt-2 sm:mt-3 ml-4 sm:ml-6 list-disc space-y-1 sm:space-y-2">
                    <li>Tasks</li>
                                        <li>Focus timer sessions and presets</li>
                    <li>Settings and preferences</li>
                    <li>Notification history</li>
                  </ul>
                  <p className="text-sm sm:text-base text-destructive-strong font-semibold mt-3 sm:mt-4">
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
                  className="w-full sm:w-auto cursor-pointer text-sm sm:text-base px-4 sm:px-6 py-4 sm:py-6"
                >
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Clear All Local Storage</span>
                  <span className="sm:hidden">Clear All Data</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clear Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Clear All Local Storage?
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to clear all local storage data? This will permanently delete:
              <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
                <li>All tasks</li>
                <li>All settings and preferences</li>
                <li>All timer sessions and presets</li>
              </ul>
              <p className="mt-3 font-semibold text-destructive-strong">
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

      <ShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
    </PageContainer>
  );
}

export default Settings;
