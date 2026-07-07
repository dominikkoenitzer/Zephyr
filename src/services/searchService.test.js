import { describe, it, expect, beforeEach } from 'vitest';
import { localStorageService } from './localStorage';
import { searchService } from './searchService';

beforeEach(() => {
  localStorage.clear();
});

describe('searchService', () => {
  it('finds matching notes and tasks and ignores non-matches', () => {
    localStorageService.addNote({ title: 'Grocery list', content: 'milk, eggs' });
    localStorageService.addNote({ title: 'Ideas', content: 'random' });
    localStorageService.addTask({ title: 'Buy groceries' });

    const res = searchService.searchAll('grocer');
    expect(res.notes).toHaveLength(1);
    expect(res.tasks).toHaveLength(1);
    expect(searchService.getTotalCount(res)).toBe(2);
  });

  it('no longer returns journal or events groups (features removed)', () => {
    const res = searchService.searchAll('anything');
    expect(res.journal).toBeUndefined();
    expect(res.events).toBeUndefined();
  });

  it('returns nothing for a blank query', () => {
    const res = searchService.searchAll('   ');
    expect(searchService.getTotalCount(res)).toBe(0);
  });
});
