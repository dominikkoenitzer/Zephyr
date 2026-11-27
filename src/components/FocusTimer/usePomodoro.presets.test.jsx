import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));
vi.mock('../../services/notificationService', async (importOriginal) => {
  const { notificationService: real } = await importOriginal();
  return { notificationService: { allows: real.allows.bind(real), createNotification: vi.fn(), playChime: vi.fn(), showOsNotification: vi.fn() } };
});
const { usePomodoro } = await import('./usePomodoro');
const { localStorageService } = await import('../../services/localStorage');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root; let timer;
const Harness = () => { timer = usePomodoro(); return null; };
const mount = (path = '/focus') => {
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  act(() => { root.render(<MemoryRouter initialEntries={[path]}><Harness /></MemoryRouter>); });
};

describe('usePomodoro, Z2 and Z3', () => {
  beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 8, 30, 9, 0)); });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.useRealTimers(); });

  it('Resume on a paused break resumes the break', () => {
    localStorageService.saveTimerState({ timeLeft: 180, isRunning: false, isBreak: true, pomodorosCompleted: 1,
      workTime: 1500, breakTime: 300, longBreakTime: 900, sessionTotal: 300, longBreak: false });
    mount('/focus?start=1');
    expect([timer.isBreak, timer.timeLeft, timer.isRunning]).toEqual([true, 180, true]);
  });

  it('a break that is only waiting still gives way to a focus session', () => {
    localStorageService.saveTimerState({ timeLeft: 300, isRunning: false, isBreak: true, pomodorosCompleted: 1,
      workTime: 1500, breakTime: 300, longBreakTime: 900, sessionTotal: 300, longBreak: false });
    mount('/focus?start=1');
    expect([timer.isBreak, timer.isRunning]).toEqual([false, true]);
  });

  it('New then Save keeps the preset, and a later Cancel of an edit does not take it back', () => {
    mount();
    act(() => timer.handleCreatePreset());
    act(() => timer.handleSavePreset());
    const id = timer.presets.at(-1).id;
    expect(id).toMatch(/^custom-/);
    act(() => { timer.setEditingPreset(timer.presets.at(-1)); timer.setIsSettingsOpen(true); });
    act(() => timer.cancelPresetEdit());
    expect(timer.presets.map((p) => p.id)).toContain(id);
  });

  it('New then Cancel leaves no preset behind and keeps the choice', () => {
    mount();
    const before = timer.presets.map((p) => p.id);
    const chosen = localStorage.getItem('selectedFocusPreset');
    act(() => timer.handleCreatePreset());
    act(() => timer.cancelPresetEdit());
    expect(timer.presets.map((p) => p.id)).toEqual(before);
    expect(JSON.stringify(JSON.parse(localStorage.getItem('focusTimerPresets') || '[]').map((p) => p.id))).not.toMatch(/custom-/);
    expect(localStorage.getItem('selectedFocusPreset') ?? 'pomodoro').toBe(chosen ?? 'pomodoro');
  });
});
