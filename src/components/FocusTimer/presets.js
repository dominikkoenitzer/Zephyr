import { BookOpen, Heart, Settings, Target, Zap } from 'lucide-react';

/**
 * The timer presets and the colour handling around them.
 *
 * Preset colours are CSS variables so they follow the theme. Presets saved by
 * older builds stored literal Tailwind hexes instead, and the colour picker
 * hands back a hex too — `normalizePresetColor` maps the known old values onto
 * theme tokens on load, and `toHexColor` resolves whatever is stored back to a
 * hex the `<input type="color">` can display.
 */

export const THEME_COLOR_OPTIONS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--ring))',
  'hsl(var(--secondary-foreground))',
  'hsl(var(--destructive))',
  'hsl(var(--muted-foreground))'
];

export const LEGACY_PRESET_COLOR_MAP = {
  '#3b82f6': THEME_COLOR_OPTIONS[0],
  '#8b5cf6': THEME_COLOR_OPTIONS[2],
  '#6366f1': THEME_COLOR_OPTIONS[2],
  '#ec4899': THEME_COLOR_OPTIONS[3],
  '#ef4444': THEME_COLOR_OPTIONS[4],
  '#10b981': THEME_COLOR_OPTIONS[1],
  '#f59e0b': THEME_COLOR_OPTIONS[0],
};

export const normalizePresetColor = (color) => {
  if (!color || typeof color !== 'string') return color;
  const trimmed = color.trim();
  if (trimmed.startsWith('hsl(') || trimmed.startsWith('var(')) return trimmed;
  const lower = trimmed.toLowerCase();
  return LEGACY_PRESET_COLOR_MAP[lower] || trimmed;
};

export const toHexColor = (inputColor) => {
  try {
    if (!inputColor || typeof inputColor !== 'string') return '#3b82f6';
    const color = inputColor.trim();

    if (/^#[0-9a-f]{6}$/i.test(color)) {
      return color.toLowerCase();
    }

    if (/^#[0-9a-f]{3}$/i.test(color)) {
      const [r, g, b] = color.slice(1).split('');
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }

    if (typeof window === 'undefined' || typeof document === 'undefined' || !document.body) {
      return '#3b82f6';
    }

    const el = document.createElement('div');
    el.style.color = color;
    document.body.appendChild(el);
    const computed = window.getComputedStyle(el).color;
    document.body.removeChild(el);

    const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) return '#3b82f6';

    const toHex = (n) => Number.parseInt(n, 10).toString(16).padStart(2, '0');
    return `#${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`;
  } catch {
    return '#3b82f6';
  }
};

export const DEFAULT_PRESETS = [
  {
    id: 'pomodoro',
    name: 'Pomodoro',
    icon: Target,
    color: THEME_COLOR_OPTIONS[0],
    workTime: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
    sessionsUntilLongBreak: 4,
    description: 'The Pomodoro Technique: Work for 25 minutes, then take a 5-minute break. After 4 cycles, take a longer 15-minute break.'
  },
  {
    id: 'short',
    name: 'Short Focus',
    icon: Zap,
    color: THEME_COLOR_OPTIONS[1],
    workTime: 15 * 60,
    shortBreak: 3 * 60,
    longBreak: 10 * 60,
    sessionsUntilLongBreak: 4,
    description: 'Perfect for quick bursts of productivity. Work for 15 minutes, take a 3-minute break. After 4 sessions, enjoy a 10-minute longer break.'
  },
  {
    id: 'long',
    name: 'Deep Work',
    icon: BookOpen,
    color: THEME_COLOR_OPTIONS[2],
    workTime: 45 * 60,
    shortBreak: 10 * 60,
    longBreak: 20 * 60,
    sessionsUntilLongBreak: 3,
    description: 'Designed for extended focus sessions. Work for 45 minutes, then take a 10-minute break. After 3 cycles, take a 20-minute longer break.'
  },
  {
    id: 'meditation',
    name: 'Meditation',
    icon: Heart,
    color: THEME_COLOR_OPTIONS[3],
    workTime: 10 * 60,
    shortBreak: 2 * 60,
    longBreak: 5 * 60,
    sessionsUntilLongBreak: 3,
    description: 'Mindfulness and meditation timer. Meditate for 10 minutes, take a 2-minute break. After 3 sessions, take a 5-minute longer break.'
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: Settings,
    color: THEME_COLOR_OPTIONS[4],
    workTime: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
    sessionsUntilLongBreak: 4,
    description: 'Create your own custom timer with personalized work and break durations.'
  }
];
