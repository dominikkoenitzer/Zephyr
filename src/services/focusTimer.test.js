import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));
vi.mock('./notificationService', () => ({
  notificationService: { createNotification: vi.fn(), playChime: vi.fn(), showOsNotification: vi.fn() },
}));

const { finishExpiredPhase, finishPhase } = await import('./focusTimer');
const { localStorageService } = await import('./localStorage');
const { notificationService } = await import('./notificationService');

const preset = { workTime: 1500, shortBreak: 300, longBreak: 900, sessionsUntilLongBreak: 4 };
const run = (endedAt) =>
  finishPhase({
    isBreak: false,
    completed: 0,
    preset,
    selectedPreset: 'pomodoro',
    sessionTask: null,
    autoStartBreaks: false,
    autoStartFocus: false,
    endedAt,
  });

describe('finishPhase', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('logs a finished session at the time it ended', () => {
    const endedAt = new Date(2026, 8, 30, 9, 25).getTime();
    run(endedAt);
    const sessions = localStorageService.getFocusSessions();
    expect(sessions).toHaveLength(1);
    expect(new Date(sessions[0].date).getTime()).toBe(endedAt);
  });

  it('logs a session once when two tabs finish it a moment apart', () => {
    const endedAt = Date.now() - 1000;
    run(endedAt);
    run(endedAt + 800);
    expect(localStorageService.getFocusSessions()).toHaveLength(1);
    expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
  });

  it('still logs two real sessions that end minutes apart', () => {
    const endedAt = Date.now() - 600_000;
    run(endedAt);
    run(endedAt + 300_000);
    expect(localStorageService.getFocusSessions()).toHaveLength(2);
  });
});

describe('finishExpiredPhase', () => {
  beforeEach(() => localStorage.clear());

  it('finishes a running phase whose time is up, and only once', () => {
    localStorageService.saveTimerState({ timeLeft: 0, isRunning: true, isBreak: false, pomodorosCompleted: 0, workTime: 1500 });
    expect(finishExpiredPhase(Date.now() + 1000)).toBe(true);
    expect(finishExpiredPhase(Date.now() + 2000)).toBe(false);
    expect(localStorageService.getFocusSessions()).toHaveLength(1);
  });

  it('leaves a phase that still has time alone', () => {
    localStorageService.saveTimerState({ timeLeft: 600, isRunning: true, isBreak: false, pomodorosCompleted: 0, workTime: 1500 });
    expect(finishExpiredPhase()).toBe(false);
  });
});
