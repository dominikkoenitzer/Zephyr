import { afterEach, describe, it, expect, vi } from 'vitest';
import { parseQuickTask } from './quickParse';

const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const addDays = (n) => {
  const d = todayStart();
  d.setDate(d.getDate() + n);
  return toISO(d);
};

describe('parseQuickTask', () => {
  it('handles empty / invalid input', () => {
    expect(parseQuickTask('')).toEqual({ title: '', dueDate: null, priority: null, tags: [] });
    expect(parseQuickTask(null).title).toBe('');
    expect(parseQuickTask(undefined).tags).toEqual([]);
  });

  it('keeps a plain title untouched', () => {
    const r = parseQuickTask('Buy milk');
    expect(r).toEqual({ title: 'Buy milk', dueDate: null, priority: null, tags: [] });
  });

  it('extracts #tags (lowercased, de-duplicated) and strips them from the title', () => {
    const r = parseQuickTask('Call mom #Family #family');
    expect(r.tags).toEqual(['family']);
    expect(r.title).toBe('Call mom');
  });

  it('parses priority tokens', () => {
    expect(parseQuickTask('Ship it !high').priority).toBe('high');
    expect(parseQuickTask('Ship it !h').priority).toBe('high');
    expect(parseQuickTask('Ship it p1').priority).toBe('high');
    expect(parseQuickTask('Ship it !med').priority).toBe('medium');
    expect(parseQuickTask('Ship it !low').priority).toBe('low');
    expect(parseQuickTask('Ship it p3').priority).toBe('low');
  });

  it('does not treat an unknown !word as a priority', () => {
    const r = parseQuickTask('Read !chapter');
    expect(r.priority).toBeNull();
    expect(r.title).toBe('Read !chapter');
  });

  it('parses relative dates', () => {
    expect(parseQuickTask('Submit today').dueDate).toBe(addDays(0));
    expect(parseQuickTask('Submit tonight').dueDate).toBe(addDays(0));
    expect(parseQuickTask('Submit tomorrow').dueDate).toBe(addDays(1));
    expect(parseQuickTask('Submit tmr').dueDate).toBe(addDays(1));
    expect(parseQuickTask('Submit in 3 days').dueDate).toBe(addDays(3));
    expect(parseQuickTask('Submit in 2 weeks').dueDate).toBe(addDays(14));
  });

  it('parses an absolute ISO date exactly', () => {
    const r = parseQuickTask('Launch 2030-08-05');
    expect(r.dueDate).toBe('2030-08-05');
    expect(r.title).toBe('Launch');
  });

  it('parses month-name and M/D dates (month-day match)', () => {
    expect(parseQuickTask('Dentist Aug 5').dueDate).toMatch(/-08-05$/);
    expect(parseQuickTask('Trip 12/25').dueDate).toMatch(/-12-25$/);
  });

  it('leaves days that do not exist in the title instead of rolling them over', () => {
    expect(parseQuickTask('Pay 2/30')).toMatchObject({ dueDate: null, title: 'Pay 2/30' });
    expect(parseQuickTask('Party 25/12').dueDate).toBeNull();
    expect(parseQuickTask('Ship 2030-02-30').dueDate).toBeNull();
    expect(parseQuickTask('Call feb 31').dueDate).toBeNull();
  });

  it('moves a yearless M/D that has passed to next year, like a month name', () => {
    const past = todayStart();
    past.setDate(past.getDate() - 3);
    const r = parseQuickTask(`Renew ${past.getMonth() + 1}/${past.getDate()}`);
    expect(r.dueDate).toBe(`${past.getFullYear() + 1}-${pad(past.getMonth() + 1)}-${pad(past.getDate())}`);
  });

  it('parses a combined quick-add string', () => {
    const r = parseQuickTask('Email Sam tomorrow !high #work');
    expect(r.title).toBe('Email Sam');
    expect(r.dueDate).toBe(addDays(1));
    expect(r.priority).toBe('high');
    expect(r.tags).toEqual(['work']);
  });

  it('never returns an empty title (falls back to original text)', () => {
    const r = parseQuickTask('tomorrow');
    expect(r.title.length).toBeGreaterThan(0);
  });
});

describe('parseQuickTask: times of day', () => {
  const at = (h, m = 0) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 29, h, m));
  };

  afterEach(() => vi.useRealTimers());

  it('gives a time still ahead today the day of today, and keeps it in the title', () => {
    at(10);
    expect(parseQuickTask('Call the dentist at 3pm')).toEqual({
      title: 'Call the dentist at 3pm', dueDate: '2026-09-29', priority: null, tags: [],
    });
    expect(parseQuickTask('Standup 15:30').dueDate).toBe('2026-09-29');
    expect(parseQuickTask('Pick up at 11:45 am').dueDate).toBe('2026-09-29');
  });

  it('moves a time that has passed to tomorrow', () => {
    at(16);
    expect(parseQuickTask('Call the dentist at 3pm').dueDate).toBe('2026-09-30');
    expect(parseQuickTask('Standup 15:30').dueDate).toBe('2026-09-30');
    expect(parseQuickTask('Call at 4pm').dueDate).toBe('2026-09-30');
  });

  it('reads noon and midnight on the 12-hour clock', () => {
    at(11, 30);
    expect(parseQuickTask('Lunch 12pm').dueDate).toBe('2026-09-29');
    expect(parseQuickTask('Backup 12am').dueDate).toBe('2026-09-30');
  });

  it('lets a date win and leaves its time in the title', () => {
    at(10);
    const r = parseQuickTask('Gym tomorrow at 9');
    expect(r.dueDate).toBe('2026-09-30');
    expect(r.title).toBe('Gym at 9');
    expect(parseQuickTask('Review fri 15:30').title).toBe('Review 15:30');
  });

  it('picks no day for an hour without am, pm or minutes, or for a time that does not exist', () => {
    at(10);
    expect(parseQuickTask('Meet at 9').dueDate).toBeNull();
    expect(parseQuickTask('Score 25:10').dueDate).toBeNull();
    expect(parseQuickTask('Call at 13pm').dueDate).toBeNull();
    expect(parseQuickTask('Chapter 3:5').dueDate).toBeNull();
  });
});

describe('parseQuickTask: words that lead into the date', () => {
  it('takes "by", "on", "due" and "until" away with the date they introduce', () => {
    expect(parseQuickTask('Submit report by tomorrow').title).toBe('Submit report');
    expect(parseQuickTask('Do thing on 2031-10-05')).toMatchObject({ title: 'Do thing', dueDate: '2031-10-05' });
    expect(parseQuickTask('Report due tomorrow').title).toBe('Report');
    expect(parseQuickTask('Hold the room until tomorrow').title).toBe('Hold the room');
  });

  it('leaves those words alone when no date follows them', () => {
    expect(parseQuickTask('Pay rent on the 1st').title).toBe('Pay rent on the 1st');
    expect(parseQuickTask('Stand by me').title).toBe('Stand by me');
  });
});

describe('parseQuickTask: day before month', () => {
  it('reads "5 oct" and "5th October" like "oct 5"', () => {
    const year = new Date().getFullYear();
    const expected = parseQuickTask('Dentist oct 5').dueDate;
    expect(parseQuickTask('Dentist 5 oct')).toMatchObject({ title: 'Dentist', dueDate: expected });
    expect(parseQuickTask('Dentist 5th October').dueDate).toBe(expected);
    expect(expected.startsWith(String(year)) || expected.startsWith(String(year + 1))).toBe(true);
  });

  it('refuses a day the month does not have', () => {
    expect(parseQuickTask('Party 31 feb').dueDate).toBeNull();
  });
});

describe('parseQuickTask: month names', () => {
  it('reads only real month names, never a word that starts like one', () => {
    expect(parseQuickTask('Buy 2 mars bars')).toMatchObject({ title: 'Buy 2 mars bars', dueDate: null });
    expect(parseQuickTask('Mayday 5 drill').dueDate).toBeNull();
    expect(parseQuickTask('Trip sept 3').dueDate).not.toBeNull();
    expect(parseQuickTask('Trip september 3rd').dueDate).toBe(parseQuickTask('Trip sep 3').dueDate);
  });
});

describe('parseQuickTask: a typed year', () => {
  it('reads the year after a month name, with or without a comma', () => {
    expect(parseQuickTask('renew passport dec 5 2027')).toMatchObject({ title: 'renew passport', dueDate: '2027-12-05' });
    expect(parseQuickTask('Trip 5 oct 2027')).toMatchObject({ title: 'Trip', dueDate: '2027-10-05' });
    expect(parseQuickTask('Trip october 5, 2027')).toMatchObject({ title: 'Trip', dueDate: '2027-10-05' });
    expect(parseQuickTask('Pay jan 15, 2027')).toMatchObject({ title: 'Pay', dueDate: '2027-01-15' });
    expect(parseQuickTask('Trip 5th october, 2027').dueDate).toBe('2027-10-05');
  });

  it('refuses a day that year does not have', () => {
    expect(parseQuickTask('Party feb 29 2027').dueDate).toBeNull();
    expect(parseQuickTask('Party feb 29 2028').dueDate).toBe('2028-02-29');
  });
});
