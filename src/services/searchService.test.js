import { describe, it, expect, beforeEach } from 'vitest';
import { localStorageService } from './localStorage';
import { searchService } from './searchService';

beforeEach(() => {
  localStorage.clear();
});

describe('searchService', () => {
  it('finds matching tasks and ignores non-matches', () => {
    localStorageService.addTask({ title: 'Buy groceries' });
    localStorageService.addTask({ title: 'Call the dentist' });

    const res = searchService.searchAll('grocer');
    expect(res.tasks).toHaveLength(1);
    expect(searchService.getTotalCount(res)).toBe(1);
  });

  it('matches a description and a #tag, not only the title', () => {
    localStorageService.addTask({ title: 'Ping Sam', description: 'about the invoice' });
    localStorageService.addTask({ title: 'Weekly review', tags: ['invoice'] });

    const res = searchService.searchAll('invoice');
    expect(res.tasks).toHaveLength(2);
    expect(res.tasks.map((t) => t.matchType).sort()).toEqual(['description', 'tag']);
  });

  it('puts title matches first', () => {
    localStorageService.addTask({ title: 'Something else', description: 'report' });
    localStorageService.addTask({ title: 'Report to the board' });

    const res = searchService.searchAll('report');
    expect(res.tasks[0].matchType).toBe('title');
  });

  it('no longer returns note, journal or event groups (features removed)', () => {
    localStorageService.addTask({ title: 'anything at all' });
    const res = searchService.searchAll('anything');
    expect(res.notes).toBeUndefined();
    expect(res.journal).toBeUndefined();
    expect(res.events).toBeUndefined();
  });

  it('returns nothing for a blank query', () => {
    const res = searchService.searchAll('   ');
    expect(searchService.getTotalCount(res)).toBe(0);
  });

  it('takes characters that mean something in a pattern literally', () => {
    localStorage.setItem('zephyr_tasks', JSON.stringify({ tasks: [{ id: 'c', title: 'Learn c++ (basics)', tags: [] }] }));
    expect(searchService.searchAll('c++').tasks).toHaveLength(1);
    expect(searchService.searchAll('(basics').tasks).toHaveLength(1);
    expect(searchService.searchAll('[').tasks).toHaveLength(0);
  });

  it('finds a tag typed with its #, as the app shows it', () => {
    localStorageService.addTask({ title: 'Weekly review', tags: ['work'] });
    localStorageService.addTask({ title: 'Issue #12 follow-up' });

    for (const query of ['#work', '#Work', ' #work ', 'work']) {
      const res = searchService.searchAll(query);
      expect(res.tasks.map((t) => [t.title, t.matchType])).toEqual([['Weekly review', 'tag']]);
    }

    // A bare # still matches only text that holds one, and an unknown tag matches nothing.
    expect(searchService.searchAll('#').tasks.map((t) => t.title)).toEqual(['Issue #12 follow-up']);
    expect(searchService.searchAll('#nothere').tasks).toHaveLength(0);
    expect(searchService.searchAll('#12').tasks.map((t) => t.matchType)).toEqual(['title']);
  });
});
