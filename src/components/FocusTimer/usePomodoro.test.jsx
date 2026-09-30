import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));
vi.mock('../../services/notificationService', () => ({
  notificationService: { createNotification: vi.fn(), playChime: vi.fn(), showOsNotification: vi.fn() },
}));

const { usePomodoro } = await import('./usePomodoro');
const { localStorageService } = await import('../../services/localStorage');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
let timer;

const Harness = () => {
  timer = usePomodoro();
  return null;
};

const mount = () => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/focus']}>
        <Harness />
      </MemoryRouter>
    );
  });
};

const seconds = (n) => act(() => vi.advanceTimersByTime(n * 1000));

describe('usePomodoro', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30, 9, 0));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it('keeps the length a running session started with when its preset is edited', () => {
    mount();
    act(() => timer.toggleTimer());
    seconds(300);

    act(() => {
      timer.setEditingPreset({ ...timer.currentPreset, workTime: 50 * 60 });
      timer.setNewPresetName(timer.currentPreset.name);
    });
    act(() => timer.handleSavePreset());

    expect(timer.timeLeft).toBe(1200);
    expect(timer.currentSessionTime).toBe(1500);
    expect(timer.progress).toBe(20);
    expect(localStorageService.getTimerState().workTime).toBe(1500);

    seconds(1200);
    const sessions = localStorageService.getFocusSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].duration).toBe(1500);

    // The edit applies from the next focus session.
    act(() => timer.skipSession());
    expect(timer.timeLeft).toBe(3000);
    expect(timer.currentSessionTime).toBe(3000);
  });

  it('gives a short break for a session skipped right after the long break', () => {
    localStorageService.saveTimerState({
      timeLeft: 1500, isRunning: false, isBreak: false, pomodorosCompleted: 4,
      workTime: 1500, breakTime: 300, longBreakTime: 900, sessionTotal: 1500, focusTask: null,
    });
    mount();
    act(() => timer.toggleTimer());
    seconds(60);
    act(() => timer.skipSession());

    expect(timer.isBreak).toBe(true);
    expect(timer.sessionType.text).toBe('Short break');
    expect(timer.timeLeft).toBe(300);
    expect(timer.currentSessionTime).toBe(300);
    expect(timer.progress).toBe(0);
    expect(localStorageService.getTimerState().sessionTotal).toBe(300);
  });

  it('still gives the long break after the session that earns it', () => {
    localStorageService.saveTimerState({
      timeLeft: 1500, isRunning: false, isBreak: false, pomodorosCompleted: 3,
      workTime: 1500, breakTime: 300, longBreakTime: 900, sessionTotal: 1500, focusTask: null,
    });
    mount();
    act(() => timer.toggleTimer());
    seconds(1500);

    expect(timer.isBreak).toBe(true);
    expect(timer.sessionType.text).toBe('Long break');
    expect(timer.timeLeft).toBe(900);
    expect(timer.currentSessionTime).toBe(900);
  });
});
