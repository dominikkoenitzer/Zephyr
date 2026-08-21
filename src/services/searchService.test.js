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
});
