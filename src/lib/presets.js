// What of the focus presets is stored, and how the stored list is read back.
// Built-in presets can be edited too, so a stored entry for a built-in id is
// its edit; it used to be dropped on save and filtered out on load, which lost
// every change to a built-in preset on reload.

/** The fields a preset's settings dialog can change. */
export const EDITABLE_PRESET_FIELDS = ['name', 'color', 'workTime', 'shortBreak', 'longBreak', 'sessionsUntilLongBreak'];

const isEdited = (preset, builtIn) => EDITABLE_PRESET_FIELDS.some((key) => preset[key] !== builtIn[key]);

/** The presets worth storing: every custom one, and each built-in one that was edited. */
export function presetsToStore(presets, defaults) {
  return presets.filter((preset) => {
    const builtIn = defaults.find((d) => d.id === preset.id);
    return !builtIn || isEdited(preset, builtIn);
  });
}

/**
 * The built-ins first, in their own order and with a stored edit laid over
 * the editable fields only (a stored entry cannot replace a built-in's icon or
 * description), then the custom presets.
 */
export function mergeStoredPresets(stored, defaults) {
  const byId = new Map(stored.map((preset) => [preset.id, preset]));
  const builtIns = defaults.map((builtIn) => {
    const edit = byId.get(builtIn.id);
    if (!edit) return builtIn;
    const merged = { ...builtIn };
    for (const key of EDITABLE_PRESET_FIELDS) {
      if (edit[key] !== undefined) merged[key] = edit[key];
    }
    return merged;
  });
  const custom = stored.filter((preset) => !defaults.some((d) => d.id === preset.id));
  return [...builtIns, ...custom];
}
