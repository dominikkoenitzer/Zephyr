// A damaged stored task list is set aside, and a full storage never stops the save.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { localStorageService } from './localStorage';

const DAMAGED = '{"tasks":[{"id":"t1","title":"keep me","completed":false}';
const full = () => { const e = new Error('quota'); e.name = 'QuotaExceededError'; return e; };

describe('a damaged task list', () => {
  let realSet;
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    realSet = Storage.prototype.setItem;
  });
  afterEach(() => { Storage.prototype.setItem = realSet; vi.restoreAllMocks(); });

  it('is set aside by the next add, and the add still works', () => {
    localStorage.setItem('zephyr_tasks', DAMAGED);
    expect(localStorageService.addTask({ title: 'new' })).not.toBeNull();
    expect(localStorage.getItem('zephyr_tasks_damaged')).toBe(DAMAGED);
    expect(localStorageService.getTasks().map((t) => t.title)).toEqual(['new']);
  });

  it('when the copy does not fit, the save still goes through', () => {
    localStorage.setItem('zephyr_tasks', DAMAGED);
    Storage.prototype.setItem = function (key, value) {
      if (key === 'zephyr_tasks_damaged') throw full();
      return realSet.call(this, key, value);
    };
    expect(localStorageService.addTask({ title: 'new' })).not.toBeNull();
    expect(localStorage.getItem('zephyr_tasks_damaged')).toBeNull();
    expect(localStorageService.getTasks().map((t) => t.title)).toEqual(['new']);
  });

  it('later saves still work after the copy failed once', () => {
    localStorage.setItem('zephyr_tasks', DAMAGED);
    let refuse = true;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'zephyr_tasks_damaged' && refuse) throw full();
      return realSet.call(this, key, value);
    };
    localStorageService.addTask({ title: 'one' });
    refuse = false;
    expect(localStorageService.addTask({ title: 'two' })).not.toBeNull();
    expect(localStorageService.getTasks().map((t) => t.title)).toEqual(['one', 'two']);
  });

  it('when the save itself fails, the damaged list is left as it was', () => {
    localStorage.setItem('zephyr_tasks', DAMAGED);
    Storage.prototype.setItem = function (key, value) {
      if (key === 'zephyr_tasks') throw full();
      return realSet.call(this, key, value);
    };
    expect(localStorageService.addTask({ title: 'new' })).toBeNull();
    expect(localStorage.getItem('zephyr_tasks')).toBe(DAMAGED);
    expect(localStorage.getItem('zephyr_tasks_damaged')).toBe(DAMAGED);
  });

  it('keeps the first damaged copy when it happens again', () => {
    localStorage.setItem('zephyr_tasks_damaged', 'first');
    localStorage.setItem('zephyr_tasks', 'second{');
    localStorageService.addTask({ title: 'new' });
    expect(localStorage.getItem('zephyr_tasks_damaged')).toBe('first');
  });
});
