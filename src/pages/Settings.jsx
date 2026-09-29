import { useState, useRef } from 'react';
import {
  Bell, Volume2, CheckSquare, Timer, Trash2, Download, Upload,
  Palette, Monitor, Moon, Sun, HardDrive, Keyboard, Clock, Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import ShortcutsDialog from '../components/Shortcuts/ShortcutsDialog';
import { notificationService } from '../services/notificationService';
import { localStorageService } from '../services/localStorage';
import { applyBackup, deleteAllData, downloadBackup, isValidBackup } from '../lib/backup';
import { cn } from '../lib/utils';
import { useSettings, useStoreValue } from '../hooks/useStore';
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

const pill = 'rounded-full bg-card px-2.5 py-0.5 text-[12px] font-semibold text-foreground';

/** A card's title with its small round icon. */
function SettingsCardTitle({ icon: Icon, children }) {
  return (
    <CardTitle className="flex items-center gap-3">
      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-[18px] w-[18px] text-primary-strong" />
      </span>
      {children}
    </CardTitle>
  );
}

/** One setting: label and description on the left, its control on the right. */
function SettingRow({ icon: Icon, title, description, children, small = false }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-2xl px-3 py-3 transition-colors hover:bg-accent/60">
      <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
        {Icon && (
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card shadow-(--shadow-sm)">
            <Icon className="h-[18px] w-[18px] text-muted-foreground" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className={cn('font-semibold text-foreground', small ? 'text-sm' : 'text-[15px]')}>{title}</h3>
          {description && (
            <p className={cn('mt-0.5 text-muted-foreground', small ? 'text-[12px]' : 'text-[13px]')}>{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Settings() {
  usePageMeta(ROUTE_META['/settings']);

  const [notificationSettings, setNotificationSettings] = useState(notificationService.getSettings());
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const importInputRef = useRef(null);
  const { preference, setPreference } = useTheme();
  // Re-reads itself on every write, so the figure moves as you use the app.
  const [storageInfo] = useStoreValue(readStorageInfo);
  const [settings] = useSettings();

  // The timer reads these when a phase runs out (lib/timer nextPhase).
  const handleSettingsChange = (updates) => {
    localStorageService.saveSettings({ ...localStorageService.getSettings(), ...updates });
  };

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
      // Only what Zephyr owns, and counted before it goes (lib/backup).
      deleteAllData();

      setNotificationSettings(notificationService.getSettings());
      toast.success('All data deleted. Reloading.');

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
      />

      <div className="grid grid-cols-1 items-start gap-(--panel-gap) xl:grid-cols-2">
        {/* Appearance */}
        <Card className="p-6">
          <SettingsCardTitle icon={Palette}>Appearance</SettingsCardTitle>
          <div className="mt-4 -mx-3 space-y-1">
            <SettingRow
              title="Theme"
            >
              <div
                role="radiogroup"
                aria-label="Theme"
                className="flex items-center gap-1 rounded-full bg-accent p-1"
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
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors',
                        active
                          ? 'bg-hero-to bg-linear-to-br from-hero-from to-hero-to text-hero-foreground shadow-(--shadow-sm)'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </SettingRow>

            {/* Phones have no keyboard to use it with. */}
            <div className="hidden md:block">
            <SettingRow
              title="Keyboard shortcuts"
            >
              <Button variant="outline" size="sm" onClick={() => setShowShortcuts(true)}>
                <Keyboard className="h-4 w-4" />
                View shortcuts
              </Button>
            </SettingRow>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6 xl:row-span-2">
          <SettingsCardTitle icon={Bell}>Notifications</SettingsCardTitle>
          <div className="mt-4 -mx-3 space-y-1">
            <SettingRow icon={Bell} title="On">
              <Checkbox
                aria-label="Enable notifications"
                checked={notificationSettings.enabled}
                onCheckedChange={(checked) => handleNotificationSettingsChange({ enabled: checked })}
              />
            </SettingRow>
            <SettingRow icon={Volume2} title="Sound">
              <Checkbox
                aria-label="Notification sound"
                checked={notificationSettings.soundEnabled}
                onCheckedChange={(checked) => handleNotificationSettingsChange({ soundEnabled: checked })}
              />
            </SettingRow>
            <SettingRow icon={CheckSquare} title="Tasks">
              <Checkbox
                aria-label="Task notifications"
                checked={notificationSettings.tasks.enabled}
                onCheckedChange={(checked) => handleTaskSettingsChange({ enabled: checked })}
              />
            </SettingRow>
            {notificationSettings.tasks.enabled && (
              <div className="space-y-1 sm:pl-13">
                <SettingRow title="Remind me" small>
                  <Select
                    value={String(notificationSettings.tasks.dueDateReminder)}
                    onValueChange={(value) => handleTaskSettingsChange({ dueDateReminder: parseInt(value) })}
                  >
                    <SelectTrigger aria-label="Due date reminder" className="w-32">
                      <SelectValue placeholder="Select reminder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day before</SelectItem>
                      <SelectItem value="2">2 days before</SelectItem>
                      <SelectItem value="3">3 days before</SelectItem>
                      <SelectItem value="7">1 week before</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow title="When overdue" small>
                  <Checkbox
                    aria-label="Overdue tasks"
                    checked={notificationSettings.tasks.overdue}
                    onCheckedChange={(checked) => handleTaskSettingsChange({ overdue: checked })}
                  />
                </SettingRow>
              </div>
            )}
            <SettingRow icon={Timer} title="Timer">
              <Checkbox
                aria-label="Timer notifications"
                checked={notificationSettings.timer.enabled}
                onCheckedChange={(checked) => handleNotificationSettingsChange({
                  timer: { ...notificationSettings.timer, enabled: checked }
                })}
              />
            </SettingRow>
            <SettingRow icon={Clock} title="Start breaks automatically">
              <Checkbox
                aria-label="Start breaks automatically"
                checked={Boolean(settings.autoStartBreaks)}
                onCheckedChange={(checked) => handleSettingsChange({ autoStartBreaks: checked === true })}
              />
            </SettingRow>
            <SettingRow icon={Target} title="Start focus automatically">
              <Checkbox
                aria-label="Start focus automatically"
                checked={Boolean(settings.autoStartFocus)}
                onCheckedChange={(checked) => handleSettingsChange({ autoStartFocus: checked === true })}
              />
            </SettingRow>
          </div>
        </Card>

        {/* Data */}
        <Card className="p-6">
          <SettingsCardTitle icon={HardDrive}>Data</SettingsCardTitle>
          <div className="mt-4 -mx-3 space-y-1">
            <SettingRow icon={Download} title="Backup">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(pill, 'bg-accent tabular-nums text-muted-foreground')}>
                  {storageInfo.totalSizeFormatted || '0 Bytes'}
                </span>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={() => importInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  Import
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
            </SettingRow>
            <SettingRow icon={Trash2} title="Delete all data">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowClearDialog(true);
                }}
                className="border-destructive/30 text-destructive-strong hover:border-destructive/50 hover:bg-destructive/10"
              >
                Delete
              </Button>
            </SettingRow>
          </div>
        </Card>
      </div>

      {/* Clear confirmation */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete all data?</DialogTitle>
            <DialogDescription className="pt-1">
              Tasks, sessions, presets and settings. This can&rsquo;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowClearDialog(false);
                handleClearAllLocalStorage();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
    </PageContainer>
  );
}

export default Settings;
