import { Save } from 'lucide-react';
import { Button } from '../ui/button';
import { CustomNumberInput } from '../ui/custom-number-input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';

/**
 * Editor for one preset's name, four durations and colour.
 *
 * Fully controlled: it writes every change straight back through
 * `onPresetChange` so the preset dot and the timer ring update live, and
 * nothing is persisted until Save. The hex field keeps its own draft string so
 * a half-typed value ("#3b8") does not repaint the UI mid-keystroke.
 */
const PresetSettingsDialog = ({
  open,
  onOpenChange,
  preset,
  onPresetChange,
  name,
  onNameChange,
  colorDraft,
  onColorDraftChange,
  colorHex,
  onSave,
  onCancel,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="w-[96vw] sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0">
      <DialogHeader>
        <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border/60 bg-muted/30">
          <DialogTitle className="text-lg sm:text-xl">Edit Timer Preset</DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Fine-tune session timings and choose any custom color.
          </p>
        </div>
      </DialogHeader>
      {preset && (
        <div className="px-4 sm:px-6 py-5 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium mb-2 block text-foreground">Preset Name</label>
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter preset name"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">Focus Time (min)</label>
              <CustomNumberInput
                min={1}
                max={120}
                step={1}
                value={Math.floor(preset.workTime / 60)}
                onChange={(e) => {
                  const minutes = parseInt(e.target.value) || 1;
                  onPresetChange({ ...preset, workTime: minutes * 60 });
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">Short Break (min)</label>
              <CustomNumberInput
                min={1}
                max={60}
                step={1}
                value={Math.floor(preset.shortBreak / 60)}
                onChange={(e) => {
                  const minutes = parseInt(e.target.value) || 1;
                  onPresetChange({ ...preset, shortBreak: minutes * 60 });
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">Long Break (min)</label>
              <CustomNumberInput
                min={1}
                max={120}
                step={1}
                value={Math.floor(preset.longBreak / 60)}
                onChange={(e) => {
                  const minutes = parseInt(e.target.value) || 1;
                  onPresetChange({ ...preset, longBreak: minutes * 60 });
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">Sessions Until Long Break</label>
              <CustomNumberInput
                min={1}
                max={10}
                step={1}
                value={preset.sessionsUntilLongBreak || 4}
                onChange={(e) => {
                  const count = parseInt(e.target.value) || 4;
                  onPresetChange({ ...preset, sessionsUntilLongBreak: count });
                }}
              />
            </div>
          </div>

          <div className="space-y-4 border border-border/60 rounded-xl p-3 sm:p-4 bg-background/70">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-foreground">Color</label>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-xs text-muted-foreground">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: preset.color }} />
                Live preview
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 sm:gap-5 items-center">
              <div className="relative h-20 w-20 rounded-full p-1.5 bg-linear-to-br from-primary/30 via-accent/30 to-muted/40 shadow-inner">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => onPresetChange({ ...preset, color: e.target.value })}
                  className="h-full w-full cursor-pointer rounded-full border-2 border-background bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:border-0"
                  aria-label="Choose preset color"
                  title="Choose preset color"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hex Value</label>
                <Input
                  value={colorDraft}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    onColorDraftChange(val);
                    if (/^#[0-9a-f]{6}$/i.test(val)) {
                      onPresetChange({ ...preset, color: val.toLowerCase() });
                    }
                  }}
                  placeholder="#3b82f6"
                  className="w-full sm:max-w-[220px] font-mono uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  Pick any color from the wheel or paste a hex value.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-1">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={!name.trim()}
              style={{ backgroundColor: preset.color }}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Preset
            </Button>
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
);

export default PresetSettingsDialog;
