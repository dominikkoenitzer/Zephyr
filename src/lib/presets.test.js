import { describe, expect, it } from 'vitest';
import { mergeStoredPresets, presetsToStore } from './presets';

const defaults = [
  { id: 'pomodoro', name: 'Pomodoro', icon: 'Target', color: '#f00', workTime: 1500, shortBreak: 300, longBreak: 900, sessionsUntilLongBreak: 4, description: 'd' },
  { id: 'custom', name: 'Custom', icon: 'Settings', color: '#0f0', workTime: 1500, shortBreak: 300, longBreak: 900, sessionsUntilLongBreak: 4, description: 'c' },
];
const mine = { id: 'custom-1', name: 'Mine', color: '#00f', workTime: 600, shortBreak: 60, longBreak: 300, sessionsUntilLongBreak: 2 };

describe('presetsToStore', () => {
  it('stores custom presets and leaves untouched built-ins out', () => {
    expect(presetsToStore([...defaults, mine], defaults)).toEqual([mine]);
  });

  it('stores a built-in preset once it was edited', () => {
    const edited = { ...defaults[1], workTime: 3000 };
    expect(presetsToStore([defaults[0], edited, mine], defaults)).toEqual([edited, mine]);
  });
});

describe('mergeStoredPresets', () => {
  it('survives the round trip through storage', () => {
    const edited = { ...defaults[1], workTime: 3000, name: 'Exams' };
    const stored = JSON.parse(JSON.stringify(presetsToStore([defaults[0], edited, mine], defaults)));
    const back = mergeStoredPresets(stored, defaults);
    expect(back.map((p) => p.id)).toEqual(['pomodoro', 'custom', 'custom-1']);
    expect(back[1]).toMatchObject({ workTime: 3000, name: 'Exams', icon: 'Settings', description: 'c' });
  });

  it('keeps the built-ins first and lets a stored entry change only editable fields', () => {
    const back = mergeStoredPresets([mine, { id: 'pomodoro', icon: 'X', description: 'y', workTime: 100 }], defaults);
    expect(back.map((p) => p.id)).toEqual(['pomodoro', 'custom', 'custom-1']);
    expect(back[0]).toMatchObject({ icon: 'Target', description: 'd', workTime: 100 });
  });

  it('reads an empty store as the built-ins', () => {
    expect(mergeStoredPresets([], defaults)).toEqual(defaults);
  });
});
