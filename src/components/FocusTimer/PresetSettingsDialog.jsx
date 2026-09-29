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
        <div className="px-5 pt-6 pb-2 sm:px-7 sm:pt-7">
          <DialogTitle>Edit timer preset</DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Set the four durations and pick a color for the ring.
          </p>
        </div>
      </DialogHeader>
      {preset && (
        <div className="space-y-6 px-5 py-5 sm:px-7">
          <div className="space-y-2">
            <label className="text-sm font-medium mb-2 block text-foreground">Preset name</label>
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter preset name"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label htmlFor="preset-work-time" className="text-sm font-medium mb-2 block text-foreground">Focus time (min)</label>
              <CustomNumberInput
                id="preset-work-time"
                label="Focus Time"
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
              <label htmlFor="preset-short-break" className="text-sm font-medium mb-2 block text-foreground">Short break (min)</label>
              <CustomNumberInput
                id="preset-short-break"
                label="Short Break"
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
              <label htmlFor="preset-long-break" className="text-sm font-medium mb-2 block text-foreground">Long break (min)</label>
              <CustomNumberInput
                id="preset-long-break"
                label="Long Break"
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
              <label htmlFor="preset-sessions" className="text-sm font-medium mb-2 block text-foreground">Sessions until long break</label>
              <CustomNumberInput
                id="preset-sessions"
                label="Sessions Until Long Break"
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

          <div className="space-y-4 rounded-2xl bg-accent/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-foreground">Color</label>
              <div className="inline-flex items-center gap-2 rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: preset.color }} />
                Live preview
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 sm:gap-5 items-center">
              <div className="relative h-20 w-20 rounded-full bg-card p-1.5 shadow-(--shadow-sm)">
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
                <label className="text-sm font-medium text-foreground">Hex value</label>
                <Input
                  value={colorDraft}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    onColorDraftChange(val);
                    if (/^#[0-9a-f]{6}$/i.test(val)) {
                      onPresetChange({ ...preset, color: val.toLowerCase() });
                    }
                  }}
                  placeholder="#eb5f24"
                  className="w-full sm:max-w-[220px] font-mono uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  Pick any color from the wheel or paste a hex value.
                </p>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t border-border bg-card px-5 pb-1 pt-4 sm:-mx-7 sm:px-7">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={!name.trim()}
            >
              <Save className="h-4 w-4" />
              Save preset
            </Button>
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
);

export default PresetSettingsDialog;
