import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PRESETS,
  normalizePresetColor,
  THEME_COLOR_OPTIONS,
  toHexColor,
} from './presets';
import { formatTime } from './usePomodoro';

describe('normalizePresetColor', () => {
  it('leaves theme tokens alone', () => {
    for (const token of THEME_COLOR_OPTIONS) {
      expect(normalizePresetColor(token)).toBe(token);
    }
    expect(normalizePresetColor('var(--primary)')).toBe('var(--primary)');
  });

  it('maps a preset saved by an older build onto a theme token', () => {
    // Presets used to store literal Tailwind hexes, which stopped following the
    // theme. Anything in the legacy table is rewritten on load.
    expect(normalizePresetColor('#3b82f6')).toBe(THEME_COLOR_OPTIONS[0]);
    expect(normalizePresetColor('#10b981')).toBe(THEME_COLOR_OPTIONS[1]);
    expect(normalizePresetColor('#ef4444')).toBe(THEME_COLOR_OPTIONS[4]);
  });

  it('matches a legacy value regardless of case or padding', () => {
    expect(normalizePresetColor('  #3B82F6  ')).toBe(THEME_COLOR_OPTIONS[0]);
  });

  it('keeps a hex the user picked themselves', () => {
    expect(normalizePresetColor('#123456')).toBe('#123456');
  });

  it('passes through anything that is not a string', () => {
    expect(normalizePresetColor(null)).toBeNull();
    expect(normalizePresetColor(undefined)).toBeUndefined();
  });
});

describe('toHexColor', () => {
  it('returns a six-digit hex unchanged, lowercased', () => {
    expect(toHexColor('#1D9E75')).toBe('#1d9e75');
  });

  it('expands a three-digit hex', () => {
    expect(toHexColor('#abc')).toBe('#aabbcc');
    expect(toHexColor('#FFF')).toBe('#ffffff');
  });

  it('resolves a named colour through the DOM', () => {
    expect(toHexColor('red')).toBe('#ff0000');
    expect(toHexColor('rgb(29, 158, 117)')).toBe('#1d9e75');
  });

  it('always returns something the colour input can render', () => {
    // The <input type="color"> silently shows black for anything it cannot
    // parse, so the fallback matters more than the exact value.
    for (const bad of ['', null, undefined, 'not-a-colour', '#12345', {}]) {
      expect(toHexColor(bad)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('DEFAULT_PRESETS', () => {
  it('has unique ids and includes the one the app falls back to', () => {
    const ids = DEFAULT_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('pomodoro');
  });

  it('gives every preset the durations and cadence the timer reads', () => {
    for (const p of DEFAULT_PRESETS) {
      expect(p.workTime).toBeGreaterThan(0);
      expect(p.shortBreak).toBeGreaterThan(0);
      expect(p.longBreak).toBeGreaterThanOrEqual(p.shortBreak);
      expect(p.sessionsUntilLongBreak).toBeGreaterThan(0);
      expect(p.name).toBeTruthy();
      expect(p.icon).toBeTruthy();
    }
  });

  it('uses theme tokens rather than fixed colours', () => {
    for (const p of DEFAULT_PRESETS) {
      expect(THEME_COLOR_OPTIONS).toContain(p.color);
    }
  });
});

describe('formatTime', () => {
  it('pads both halves to two digits', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(5)).toBe('00:05');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(25 * 60)).toBe('25:00');
  });

  it('does not roll over at an hour — a focus session is counted in minutes', () => {
    expect(formatTime(90 * 60)).toBe('90:00');
  });
});

describe('the preset palette', () => {
  it('offers six colours that are actually different from each other', () => {
    // The palette used to be built from UI tokens: --primary and --ring are the
    // same blue and --accent is a near-white, so the presets were visually
    // indistinguishable. Whatever the palette is made of, it has to be distinct.
    expect(new Set(THEME_COLOR_OPTIONS).size).toBe(THEME_COLOR_OPTIONS.length);
  });

  it('gives every default preset a colour of its own', () => {
    const colors = DEFAULT_PRESETS.map((p) => p.color);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('rewrites a preset saved with the old UI tokens', () => {
    // These values are already `hsl(`, so without an explicit mapping they
    // would pass straight through and keep the old indistinguishable colour.
    expect(normalizePresetColor('hsl(var(--primary))')).toBe(THEME_COLOR_OPTIONS[0]);
    expect(normalizePresetColor('hsl(var(--ring))')).toBe(THEME_COLOR_OPTIONS[2]);
    expect(normalizePresetColor('hsl(var(--accent))')).toBe(THEME_COLOR_OPTIONS[1]);
    expect(normalizePresetColor('hsl(var(--muted-foreground))')).toBe(THEME_COLOR_OPTIONS[5]);
  });
});
