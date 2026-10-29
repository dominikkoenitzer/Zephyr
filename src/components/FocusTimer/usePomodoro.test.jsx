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

const mount = (path = '/focus') => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
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
    vi.unstubAllGlobals();
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

  it('keeps the end time when the session task changes while it runs', () => {
    mount();
    act(() => timer.toggleTimer());
    seconds(1);
    act(() => vi.advanceTimersByTime(900));
    act(() => timer.setSessionTask({ id: null, title: 'Write the report' }));
    act(() => vi.advanceTimersByTime(1500 * 1000 - 1900));

    expect(timer.isBreak).toBe(true);
    expect(localStorageService.getFocusSessions()).toHaveLength(1);
  });

  it('asks for notification permission when a session is started, not on arrival', () => {
    const requestPermission = vi.fn(() => Promise.resolve('default'));
    vi.stubGlobal('Notification', Object.assign(function Notification() {}, { permission: 'default', requestPermission }));
    mount();
    seconds(5);
    expect(requestPermission).not.toHaveBeenCalled();

    act(() => timer.toggleTimer());
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it('asks for notification permission when a task starts a session', () => {
    const requestPermission = vi.fn(() => Promise.resolve('default'));
    vi.stubGlobal('Notification', Object.assign(function Notification() {}, { permission: 'default', requestPermission }));
    mount('/focus?title=Write%20the%20report&start=1');

    expect(timer.isRunning).toBe(true);
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it('finishes a break that ran out while closed before start=1 starts a focus session', () => {
    localStorageService.saveTimerState({
      timeLeft: 60, isRunning: true, isBreak: true, longBreak: false, pomodorosCompleted: 1,
      workTime: 1500, breakTime: 300, longBreakTime: 900, sessionTotal: 300, focusTask: null,
    });
    vi.setSystemTime(new Date(2026, 8, 30, 9, 10));
    mount('/focus?start=1');

    expect(localStorageService.getFocusSessions()).toHaveLength(0);
    expect(localStorageService.getFocusStreak().count).toBe(0);
    expect(timer.isBreak).toBe(false);
    expect(timer.isRunning).toBe(true);
    expect(timer.timeLeft).toBe(1500);
    seconds(10);
    expect(timer.timeLeft).toBe(1490);
    expect(localStorageService.getFocusSessions()).toHaveLength(0);
  });

  it('logs a focus session that ran out while closed once when opened with start=1', () => {
    localStorageService.saveTimerState({
      timeLeft: 60, isRunning: true, isBreak: false, pomodorosCompleted: 0,
      workTime: 1500, breakTime: 300, longBreakTime: 900, sessionTotal: 1500, focusTask: null,
    });
    vi.setSystemTime(new Date(2026, 8, 30, 9, 10));
    mount('/focus?start=1');

    expect(localStorageService.getFocusSessions()).toHaveLength(1);
    expect(timer.sessionsCompleted).toBe(1);
    seconds(120);
    expect(localStorageService.getFocusSessions()).toHaveLength(1);
  });
});
