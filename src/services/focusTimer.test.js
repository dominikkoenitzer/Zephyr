import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

  it('logs a session once when the stored list holds entries that are not sessions', () => {
    const earlier = { id: 's1', date: '2026-09-01T08:00:00.000Z', duration: 1500, type: 'work' };
    localStorage.setItem('zephyr_focus_sessions', JSON.stringify([null, earlier, 5, 'work']));
    const endedAt = Date.now() - 1000;
    run(endedAt);
    run(endedAt + 800);
    const sessions = localStorageService.getFocusSessions();
    expect(sessions).toHaveLength(2);
    expect(sessions[0]).toEqual(earlier);
    expect(new Date(sessions[1].date).getTime()).toBe(endedAt);
    expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
  });
});

describe('the focus streak', () => {
  const at = (day, hour) => new Date(2026, 8, day, hour).getTime();
  const streakFrom = (lastDate, endedAt) => {
    localStorage.clear();
    localStorageService.saveFocusStreak({ count: 4, lastDate: lastDate.toDateString() });
    run(endedAt);
    return localStorageService.getFocusStreak();
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30, 9, 30));
  });

  afterEach(() => vi.useRealTimers());

  it("reads a last day after today as today, so today's session keeps the count", () => {
    const today = new Date(2026, 8, 30).toDateString();
    expect(streakFrom(new Date(2026, 9, 1), at(30, 9))).toEqual({ count: 4, lastDate: today });
    expect(streakFrom(new Date(2027, 8, 30), at(30, 9))).toEqual({ count: 4, lastDate: today });
    expect(streakFrom(new Date(2026, 8, 30), at(30, 9))).toEqual({ count: 4, lastDate: today });
    expect(streakFrom(new Date(2026, 8, 29), at(30, 9))).toEqual({ count: 5, lastDate: today });
  });

  it('never moves the streak back for a session that ended before the stored day', () => {
    const ahead = new Date(2026, 9, 1);
    expect(streakFrom(ahead, at(29, 22))).toEqual({ count: 4, lastDate: ahead.toDateString() });
    const today = new Date(2026, 8, 30);
    expect(streakFrom(today, at(29, 22))).toEqual({ count: 4, lastDate: today.toDateString() });
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
