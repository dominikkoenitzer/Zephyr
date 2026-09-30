import { describe, expect, it } from 'vitest';
import {
  dashboardStats,
  dueLabel,
  donePercent,
  dueSoon,
  focusByDay,
  focusToday,
  gaugeSegments,
  formatMinutes,
  msUntilNextDay,
  recentSessions,
  startOfDay,
  tasksViewHref,
  upNext,
  weekDays,
  weekStart,
} from './dashboard';

// Wednesday 30 September 2026, mid-afternoon.
const NOW = new Date(2026, 8, 30, 15, 0, 0);
const at = (d, h = 10) => new Date(2026, 8, d, h, 0, 0).toISOString();

describe('weekStart and weekDays', () => {
  it('starts the week on Monday', () => {
    expect(weekStart(NOW).getDate()).toBe(28);
  });

  it('treats Sunday as the end of the week, not the start', () => {
    expect(weekStart(new Date(2026, 9, 4, 12)).getDate()).toBe(28);
  });

  it('marks today and the days still to come', () => {
    const days = weekDays(NOW);
    expect(days.map((d) => d.letter).join('')).toBe('MTWTFSS');
    expect(days.findIndex((d) => d.isToday)).toBe(2);
    expect(days.filter((d) => d.isFuture)).toHaveLength(4);
  });
});

describe('focusByDay', () => {
  it('sums work minutes per day and ignores breaks and other weeks', () => {
    const sessions = [
      { date: at(28), duration: 1500, type: 'work' },
      { date: at(28, 14), duration: 1500 },
      { date: at(30), duration: 3000, type: 'work' },
      { date: at(30), duration: 300, type: 'break' },
      { date: at(20), duration: 1500, type: 'work' },
    ];
    const minutes = focusByDay(sessions, NOW).map((d) => d.minutes);
    expect(minutes).toEqual([50, 0, 50, 0, 0, 0, 0]);
  });
});

describe('focusToday', () => {
  it("counts only today's work sessions, at their real length", () => {
    const sessions = [
      { date: at(30, 9), duration: 1500, type: 'work' },
      { date: at(30, 11), duration: 2700 },
      { date: at(30, 12), duration: 300, type: 'break' },
      { date: at(29, 10), duration: 1500, type: 'work' },
    ];
    expect(focusToday(sessions, NOW)).toEqual({ sessions: 2, minutes: 70 });
  });

  it('starts every day at zero', () => {
    expect(focusToday([{ date: at(29), duration: 1500 }], NOW)).toEqual({ sessions: 0, minutes: 0 });
  });
});

describe('dashboardStats', () => {
  const tasks = [
    { id: 'a', completed: false, dueDate: '2026-09-30' },
    { id: 'b', completed: false, dueDate: '2026-09-29' },
    { id: 'c', completed: false, dueDate: null },
    { id: 'd', completed: true, completedAt: at(29) },
    { id: 'e', completed: true, completedAt: at(10) },
  ];
  const sessions = [{ date: at(29), duration: 1500, type: 'work' }];

  it('counts open, due, overdue and done', () => {
    expect(dashboardStats(tasks, sessions, NOW)).toEqual({
      open: 3,
      dueToday: 1,
      overdue: 1,
      done: 2,
      total: 5,
      doneThisWeek: 1,
      focusMinutes: 25,
      sessions: 1,
    });
  });

  it('puts the overdue task up next', () => {
    expect(upNext(tasks).id).toBe('b');
  });

  it('lists only dated open tasks as due soon', () => {
    expect(dueSoon(tasks).map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('has nothing up next when everything is done', () => {
    expect(upNext([{ id: 'x', completed: true }])).toBeNull();
  });
});

describe('recentSessions', () => {
  it('returns the latest work sessions first', () => {
    const list = recentSessions([
      { date: at(28), type: 'work' },
      { date: at(30), type: 'work' },
      { date: at(30, 12), type: 'break' },
    ]);
    expect(list.map((s) => s.date)).toEqual([at(30), at(28)]);
  });
});

describe('formatMinutes and dueLabel', () => {
  it('writes minutes as hours and minutes', () => {
    expect(formatMinutes(0)).toBe('0m');
    expect(formatMinutes(45)).toBe('45m');
    expect(formatMinutes(120)).toBe('2h');
    expect(formatMinutes(125)).toBe('2h 5m');
  });

  it('says how far off a due day is', () => {
    expect(dueLabel('2026-09-30', NOW)).toBe('Today');
    expect(dueLabel('2026-10-01', NOW)).toBe('Tomorrow');
    expect(dueLabel('2026-09-29', NOW)).toBe('1 day late');
    expect(dueLabel('2026-09-27', NOW)).toBe('3 days late');
    expect(dueLabel(null, NOW)).toBe('No date');
  });
});

describe('msUntilNextDay and startOfDay', () => {
  it('waits until the next local midnight', () => {
    expect(msUntilNextDay(NOW)).toBe(9 * 3600000);
    expect(msUntilNextDay(new Date(2026, 8, 30, 23, 59, 59, 500))).toBe(500);
    expect(msUntilNextDay(new Date(2026, 8, 30))).toBe(new Date(2026, 9, 1) - new Date(2026, 8, 30));
  });

  it('turns a day key back into that local midnight', () => {
    expect(startOfDay('2026-10-01').getTime()).toBe(new Date(2026, 9, 1).getTime());
  });

  it('moves the figures to the new day once the key changes', () => {
    const tasks = [{ id: 'a', completed: false, dueDate: '2026-09-30' }];
    expect(dashboardStats(tasks, [], startOfDay('2026-09-30')).dueToday).toBe(1);
    const after = dashboardStats(tasks, [], startOfDay('2026-10-01'));
    expect(after.dueToday).toBe(0);
    expect(after.overdue).toBe(1);
  });
});

describe('tasksViewHref', () => {
  it('opens the list on the view a card counts, whatever filter was left on', () => {
    expect(tasksViewHref('overdue')).toBe('/tasks?view=overdue');
    expect(tasksViewHref('all')).toBe('/tasks?view=all');
  });
});

describe('donePercent', () => {
  it('only says 100 when everything is done', () => {
    expect(donePercent(199, 200)).toBe(99);
    expect(donePercent(200, 200)).toBe(100);
  });

  it('never says 0 once something is done', () => {
    expect(donePercent(1, 300)).toBe(1);
    expect(donePercent(0, 300)).toBe(0);
    expect(donePercent(0, 0)).toBe(0);
  });

  it('otherwise rounds down', () => {
    expect(donePercent(2, 3)).toBe(66);
    expect(donePercent(1, 2)).toBe(50);
  });
});

describe('gaugeSegments', () => {
  const parts = (done, open, late) => [
    { key: 'done', value: done },
    { key: 'open', value: open },
    { key: 'late', value: late },
  ];

  it('draws every slice the legend counts, however small', () => {
    for (const [done, open, late] of [[0, 80, 1], [80, 0, 1], [1, 80, 0], [40, 1, 40], [1, 1, 200]]) {
      const segs = gaugeSegments(parts(done, open, late));
      const counted = parts(done, open, late).filter((p) => p.value > 0).map((p) => p.key);
      expect(segs.map((s) => s.key)).toEqual(counted);
      segs.forEach((s) => expect(s.to - s.from).toBeGreaterThanOrEqual(4));
    }
  });

  it('keeps the slices in order inside the half circle, with gaps between', () => {
    const segs = gaugeSegments(parts(1, 1, 200));
    expect(segs[0].from).toBe(180);
    expect(segs.at(-1).to).toBeCloseTo(360);
    for (let i = 1; i < segs.length; i += 1) {
      expect(segs[i].from - segs[i - 1].to).toBeCloseTo(5);
    }
  });

  it('shares the arc by value when every slice is large', () => {
    const [a, b] = gaugeSegments(parts(1, 1, 0));
    expect(a.to - a.from).toBeCloseTo(b.to - b.from);
  });

  it('draws nothing when there are no tasks', () => {
    expect(gaugeSegments(parts(0, 0, 0))).toEqual([]);
  });
});
