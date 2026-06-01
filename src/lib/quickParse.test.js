import { describe, it, expect } from 'vitest';
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
