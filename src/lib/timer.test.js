import { describe, expect, it } from 'vitest';
import { longBreakDue, timerSnapshot } from './timer';

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
