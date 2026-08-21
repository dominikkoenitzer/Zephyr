import { describe, it, expect } from 'vitest';
import {
  bucketOf,
  collectTags,
  countsByView,
  daysUntil,
  filterActive,
  groupTasks,
  matchesView,
  sortByUrgency,
} from './taskFilters';

// Every case pins "today" explicitly so none of this depends on the clock.
const TODAY = '2026-08-21';

const task = (id, overrides = {}) => ({
  id,
  title: id,
  completed: false,
  priority: 'medium',
  tags: [],
  dueDate: null,
  ...overrides,
});

describe('daysUntil', () => {
  it('counts whole calendar days in both directions', () => {
    expect(daysUntil('2026-08-21', TODAY)).toBe(0);
    expect(daysUntil('2026-08-22', TODAY)).toBe(1);
    expect(daysUntil('2026-08-20', TODAY)).toBe(-1);
    expect(daysUntil('2026-09-01', TODAY)).toBe(11);
  });

  it('crosses a month and a DST boundary without drifting', () => {
    expect(daysUntil('2026-09-01', '2026-08-31')).toBe(1);
    expect(daysUntil('2026-03-30', '2026-03-28')).toBe(2);
  });

  it('returns null for a missing date', () => {
    expect(daysUntil(null, TODAY)).toBeNull();
  });
});

describe('bucketOf', () => {
  it('places a task under the heading its due date implies', () => {
    expect(bucketOf(task('a', { dueDate: '2026-08-19' }), TODAY)).toBe('overdue');
    expect(bucketOf(task('b', { dueDate: '2026-08-21' }), TODAY)).toBe('today');
    expect(bucketOf(task('c', { dueDate: '2026-08-22' }), TODAY)).toBe('tomorrow');
    expect(bucketOf(task('d', { dueDate: '2026-08-27' }), TODAY)).toBe('week');
    expect(bucketOf(task('e', { dueDate: '2026-08-29' }), TODAY)).toBe('later');
    expect(bucketOf(task('f'), TODAY)).toBe('undated');
  });

  it('reads a full ISO timestamp as its calendar day', () => {
    expect(bucketOf(task('g', { dueDate: '2026-08-21T22:00:00.000Z' }), TODAY)).toBe('today');
  });
});

describe('matchesView', () => {
  const overdue = task('a', { dueDate: '2026-08-19' });
  const due = task('b', { dueDate: '2026-08-21' });
  const soon = task('c', { dueDate: '2026-08-25' });
  const undated = task('d');

  it('shows everything under All', () => {
    [overdue, due, soon, undated].forEach((t) => expect(matchesView(t, 'all', TODAY)).toBe(true));
  });

  it('folds overdue work into Today, because it is still owed today', () => {
    expect(matchesView(overdue, 'today', TODAY)).toBe(true);
    expect(matchesView(due, 'today', TODAY)).toBe(true);
    expect(matchesView(soon, 'today', TODAY)).toBe(false);
    expect(matchesView(undated, 'today', TODAY)).toBe(false);
  });

  it('keeps Overdue, Upcoming and No date disjoint', () => {
    expect(matchesView(overdue, 'overdue', TODAY)).toBe(true);
    expect(matchesView(due, 'overdue', TODAY)).toBe(false);
    expect(matchesView(soon, 'upcoming', TODAY)).toBe(true);
    expect(matchesView(due, 'upcoming', TODAY)).toBe(false);
    expect(matchesView(undated, 'undated', TODAY)).toBe(true);
    expect(matchesView(soon, 'undated', TODAY)).toBe(false);
  });
});

describe('sortByUrgency', () => {
  it('sorts by due day, then priority, and leaves undated tasks last', () => {
    const list = [
      task('undated'),
      task('later', { dueDate: '2026-08-30' }),
      task('today-low', { dueDate: TODAY, priority: 'low' }),
      task('today-high', { dueDate: TODAY, priority: 'high' }),
    ];
    expect(sortByUrgency(list).map((t) => t.id)).toEqual([
      'today-high',
      'today-low',
      'later',
      'undated',
    ]);
  });

  it('does not mutate its input', () => {
    const list = [task('b', { dueDate: '2026-08-30' }), task('a', { dueDate: TODAY })];
    sortByUrgency(list);
    expect(list.map((t) => t.id)).toEqual(['b', 'a']);
  });
});

describe('filterActive', () => {
  const tasks = [
    task('done', { completed: true, dueDate: TODAY }),
    task('work', { dueDate: TODAY, tags: ['Work'] }),
    task('home', { dueDate: '2026-08-25', tags: ['home'] }),
  ];

  it('drops completed tasks', () => {
    expect(filterActive(tasks, {}, TODAY).map((t) => t.id)).toEqual(['work', 'home']);
  });

  it('matches tags case-insensitively', () => {
    expect(filterActive(tasks, { tag: 'work' }, TODAY).map((t) => t.id)).toEqual(['work']);
  });

  it('combines a view and a tag', () => {
    expect(filterActive(tasks, { view: 'upcoming', tag: 'home' }, TODAY).map((t) => t.id)).toEqual([
      'home',
    ]);
    expect(filterActive(tasks, { view: 'overdue', tag: 'home' }, TODAY)).toEqual([]);
  });
});

describe('groupTasks', () => {
  it('returns only non-empty groups, in heading order', () => {
    const groups = groupTasks(
      [task('a'), task('b', { dueDate: '2026-08-19' }), task('c', { dueDate: TODAY })],
      TODAY
    );
    expect(groups.map((g) => g.id)).toEqual(['overdue', 'today', 'undated']);
    expect(groups.map((g) => g.tasks.length)).toEqual([1, 1, 1]);
  });

  it('returns nothing for an empty list', () => {
    expect(groupTasks([], TODAY)).toEqual([]);
  });
});

describe('countsByView', () => {
  it('counts active tasks per chip, respecting the tag filter', () => {
    const tasks = [
      task('done', { completed: true }),
      task('late', { dueDate: '2026-08-01', tags: ['work'] }),
      task('now', { dueDate: TODAY, tags: ['work'] }),
      task('soon', { dueDate: '2026-08-24' }),
      task('someday'),
    ];
    expect(countsByView(tasks, '', TODAY)).toEqual({
      all: 4,
      today: 2,
      overdue: 1,
      upcoming: 1,
      undated: 1,
    });
    expect(countsByView(tasks, 'work', TODAY)).toEqual({
      all: 2,
      today: 2,
      overdue: 1,
      upcoming: 0,
      undated: 0,
    });
  });
});

describe('collectTags', () => {
  it('lowercases, de-duplicates and sorts', () => {
    const tasks = [task('a', { tags: ['Work', 'home'] }), task('b', { tags: ['work'] }), task('c')];
    expect(collectTags(tasks)).toEqual(['home', 'work']);
  });
});
