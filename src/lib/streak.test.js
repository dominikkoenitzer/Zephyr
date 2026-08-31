import { describe, it, expect } from 'vitest';
import { activeStreak, streakAtRisk } from './streak';

const TODAY = new Date(2026, 7, 21, 14, 30); // 21 Aug 2026, mid-afternoon
const day = (offset) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + offset);
  // The service stores toDateString(), so read it back in that shape.
  return d.toDateString();
};

describe('activeStreak', () => {
  it('counts a streak finished today', () => {
    expect(activeStreak({ count: 5, lastDate: day(0) }, TODAY)).toBe(5);
  });

  it('keeps yesterday alive: you still have today to continue it', () => {
    expect(activeStreak({ count: 5, lastDate: day(-1) }, TODAY)).toBe(5);
  });

  it('drops a streak whose last day was the day before yesterday', () => {
    expect(activeStreak({ count: 5, lastDate: day(-2) }, TODAY)).toBe(0);
    expect(activeStreak({ count: 40, lastDate: day(-30) }, TODAY)).toBe(0);
  });

  it('handles the empty, missing and malformed cases', () => {
    expect(activeStreak(null, TODAY)).toBe(0);
    expect(activeStreak({}, TODAY)).toBe(0);
    expect(activeStreak({ count: 0, lastDate: day(0) }, TODAY)).toBe(0);
    expect(activeStreak({ count: 3, lastDate: null }, TODAY)).toBe(0);
    expect(activeStreak({ count: 3, lastDate: 'not a date' }, TODAY)).toBe(0);
    expect(activeStreak({ count: -2, lastDate: day(0) }, TODAY)).toBe(0);
  });

  it('ignores the time of day on both sides', () => {
    const lateNight = new Date(2026, 7, 21, 23, 59);
    const earlyMorning = new Date(2026, 7, 21, 0, 1);
    expect(activeStreak({ count: 2, lastDate: day(0) }, lateNight)).toBe(2);
    expect(activeStreak({ count: 2, lastDate: day(0) }, earlyMorning)).toBe(2);
  });
});

describe('streakAtRisk', () => {
  it('is true only when the last session was yesterday', () => {
    expect(streakAtRisk({ count: 5, lastDate: day(-1) }, TODAY)).toBe(true);
    expect(streakAtRisk({ count: 5, lastDate: day(0) }, TODAY)).toBe(false);
    expect(streakAtRisk({ count: 5, lastDate: day(-3) }, TODAY)).toBe(false);
    expect(streakAtRisk(null, TODAY)).toBe(false);
  });
});
