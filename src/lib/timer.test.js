import { describe, expect, it } from 'vitest';
import { longBreakDue, nextPhase, timerSnapshot } from './timer';

describe('longBreakDue', () => {
  it('gives no long break before the first finished session', () => {
    expect(longBreakDue(0, 4)).toBe(false);
  });

  it('gives one after every nth session', () => {
    expect([1, 2, 3, 4, 5, 8].map((n) => longBreakDue(n, 4))).toEqual([false, false, false, true, false, true]);
    expect(longBreakDue(3, 3)).toBe(true);
  });

  it('falls back to four when the preset has no count', () => {
    expect(longBreakDue(4, undefined)).toBe(true);
    expect(longBreakDue(4, 0)).toBe(true);
  });
});

describe('timerSnapshot', () => {
  const saved = { timeLeft: 900, isRunning: true, isBreak: false, workTime: 1500, breakTime: 300, lastSaved: 1_000_000 };

  it('is null before the timer was ever used', () => {
    expect(timerSnapshot(null, 0)).toBeNull();
  });

  it('takes the time since saving off a running timer', () => {
    const s = timerSnapshot(saved, 1_000_000 + 60_000);
    expect(s.timeLeft).toBe(840);
    expect(s.running).toBe(true);
    expect(s.paused).toBe(false);
    expect(Math.round(s.progress)).toBe(44);
  });

  it('stops at zero and stops counting as running when the time ran out', () => {
    const s = timerSnapshot(saved, 1_000_000 + 3_600_000);
    expect(s.timeLeft).toBe(0);
    expect(s.running).toBe(false);
    expect(s.progress).toBe(100);
  });

  it('leaves a paused timer where it was', () => {
    const s = timerSnapshot({ ...saved, isRunning: false }, 9_999_999);
    expect(s.timeLeft).toBe(900);
    expect(s.paused).toBe(true);
  });

  it('calls a full, stopped timer ready rather than paused', () => {
    const s = timerSnapshot({ ...saved, isRunning: false, timeLeft: 1500 }, 0);
    expect(s.paused).toBe(false);
    expect(s.running).toBe(false);
  });

  it('measures a break against the break length', () => {
    const s = timerSnapshot({ ...saved, isRunning: false, isBreak: true, timeLeft: 150 }, 0);
    expect(s.total).toBe(300);
    expect(s.progress).toBe(50);
  });

  it('measures a long break against its own length when that was saved', () => {
    const s = timerSnapshot({ ...saved, isRunning: false, isBreak: true, sessionTotal: 900, timeLeft: 600 }, 0);
    expect(s.total).toBe(900);
    expect(s.paused).toBe(true);
    expect(Math.round(s.progress)).toBe(33);
  });
});

describe('nextPhase', () => {
  const base = { workTime: 1500, breakTime: 300, longBreakTime: 900, every: 4, endedAt: 1_000_000, now: 1_000_000 };

  it('stops on the next phase when auto-start is off', () => {
    expect(nextPhase({ ...base, isBreak: false, completed: 0 })).toEqual({
      isBreak: true, sessionsCompleted: 1, timeLeft: 300, isRunning: false,
    });
    expect(nextPhase({ ...base, isBreak: true, completed: 1 })).toEqual({
      isBreak: false, sessionsCompleted: 1, timeLeft: 1500, isRunning: false,
    });
  });

  it('counts a finished focus session once, and a finished break not at all', () => {
    expect(nextPhase({ ...base, isBreak: false, completed: 2, autoStartBreaks: true }).sessionsCompleted).toBe(3);
    expect(nextPhase({ ...base, isBreak: true, completed: 2, autoStartFocus: true }).sessionsCompleted).toBe(2);
  });

  it('starts the break by itself, the long one when it is due', () => {
    expect(nextPhase({ ...base, isBreak: false, completed: 0, autoStartBreaks: true })).toEqual({
      isBreak: true, sessionsCompleted: 1, timeLeft: 300, isRunning: true,
    });
    expect(nextPhase({ ...base, isBreak: false, completed: 3, autoStartBreaks: true }).timeLeft).toBe(900);
  });

  it('starts focus by itself after a break', () => {
    expect(nextPhase({ ...base, isBreak: true, completed: 1, autoStartFocus: true })).toEqual({
      isBreak: false, sessionsCompleted: 1, timeLeft: 1500, isRunning: true,
    });
  });

  it('keeps each setting to its own phase', () => {
    expect(nextPhase({ ...base, isBreak: false, completed: 0, autoStartFocus: true }).isRunning).toBe(false);
    expect(nextPhase({ ...base, isBreak: true, completed: 1, autoStartBreaks: true }).isRunning).toBe(false);
  });

  it('runs the next phase from the moment the last one ended', () => {
    const late = nextPhase({ ...base, isBreak: false, completed: 0, autoStartBreaks: true, now: base.endedAt + 45_000 });
    expect(late).toMatchObject({ isBreak: true, timeLeft: 255, isRunning: true });
  });

  it('lets a break that ran out unseen pass, then carries on into focus', () => {
    // Break 300s from 1_000_000, focus from 1_300_000; seen 100s into focus.
    const s = nextPhase({
      ...base, isBreak: false, completed: 0, autoStartBreaks: true, autoStartFocus: true, now: base.endedAt + 400_000,
    });
    expect(s).toEqual({ isBreak: false, sessionsCompleted: 1, timeLeft: 1400, isRunning: true });
  });

  it('lands on a ready focus session when the break ran out unseen and focus is not automatic', () => {
    const s = nextPhase({ ...base, isBreak: false, completed: 0, autoStartBreaks: true, now: base.endedAt + 400_000 });
    expect(s).toEqual({ isBreak: false, sessionsCompleted: 1, timeLeft: 1500, isRunning: false });
  });

  it('never counts a focus session that would have run out while no one was there', () => {
    const overnight = base.endedAt + 8 * 3_600_000;
    expect(nextPhase({
      ...base, isBreak: false, completed: 0, autoStartBreaks: true, autoStartFocus: true, now: overnight,
    })).toEqual({ isBreak: false, sessionsCompleted: 1, timeLeft: 1500, isRunning: false });
    expect(nextPhase({ ...base, isBreak: true, completed: 1, autoStartFocus: true, now: overnight })).toEqual({
      isBreak: false, sessionsCompleted: 1, timeLeft: 1500, isRunning: false,
    });
  });

  it('treats a missing end time as now', () => {
    expect(nextPhase({ ...base, endedAt: undefined, isBreak: true, completed: 1, autoStartFocus: true }).timeLeft).toBe(1500);
  });
});
