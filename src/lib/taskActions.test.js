import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { toast } from 'sonner';
import { clearCompletedWithUndo, deleteTaskWithUndo } from './taskActions';
import { dashboardStats } from './dashboard';
import { localStorageService } from '../services/localStorage';

vi.mock('sonner', () => ({ toast: vi.fn() }));

const task = (id, completed = false) => ({ id, title: `Task ${id}`, completed, tags: [], subtasks: [] });
const ids = () => localStorageService.getTasks().map((t) => t.id);
/** The Undo handler of the most recent toast. */
const undo = () => toast.mock.calls.at(-1)[1].action.onClick;

beforeEach(() => {
  localStorage.clear();
  toast.mockClear();
});

describe('deleteTaskWithUndo', () => {
  it('removes the task and Undo puts it back in its place', () => {
    localStorageService.saveTasks([task('a'), task('b'), task('c')]);
    const removed = deleteTaskWithUndo('b');
    expect(removed.id).toBe('b');
    expect(ids()).toEqual(['a', 'c']);
    expect(toast).toHaveBeenCalledWith('Task deleted', expect.objectContaining({ description: 'Task b' }));

    undo()();
    expect(ids()).toEqual(['a', 'b', 'c']);
  });

  it('restores once when Undo is pressed twice, and keeps tasks added since', () => {
    localStorageService.saveTasks([task('a'), task('b')]);
    deleteTaskWithUndo('a');
    const onUndo = undo();
    localStorageService.saveTasks([...localStorageService.getTasks(), task('new')]);

    onUndo();
    onUndo();
    expect(ids()).toEqual(['a', 'b', 'new']);
  });

  it('returns null and shows no toast for an unknown id', () => {
    localStorageService.saveTasks([task('a')]);
    expect(deleteTaskWithUndo('missing')).toBeNull();
    expect(toast).not.toHaveBeenCalled();
    expect(ids()).toEqual(['a']);
  });
});

describe('clearCompletedWithUndo', () => {
  it('clears the completed tasks and Undo restores each at its index', () => {
    localStorageService.saveTasks([task('a', true), task('b'), task('c', true), task('d')]);
    expect(clearCompletedWithUndo()).toBe(2);
    expect(ids()).toEqual(['b', 'd']);
    expect(toast).toHaveBeenCalledWith('Cleared 2 completed tasks', expect.any(Object));

    undo()();
    expect(ids()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('says "Nothing to clear" when nothing is completed', () => {
    localStorageService.saveTasks([task('a'), task('b')]);
    expect(clearCompletedWithUndo()).toBe(0);
    expect(toast).toHaveBeenCalledWith('Nothing to clear', expect.any(Object));
    expect(ids()).toEqual(['a', 'b']);
  });

  it('restores once when Undo is pressed twice, and keeps tasks added since', () => {
    localStorageService.saveTasks([task('a', true), task('b')]);
    expect(clearCompletedWithUndo()).toBe(1);
    expect(toast).toHaveBeenCalledWith('Cleared 1 completed task', expect.any(Object));
    const onUndo = undo();
    localStorageService.saveTasks([...localStorageService.getTasks(), task('new')]);

    onUndo();
    onUndo();
    expect(ids()).toEqual(['a', 'b', 'new']);
  });
});

describe('a write that fails', () => {
  const failWrites = () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  };
  /** Press Undo the way the toast does, and report whether the toast stays open. */
  const pressUndo = (onClick) => {
    const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
    onClick(event);
    return event.defaultPrevented;
  };

  afterEach(() => vi.restoreAllMocks());

  it('shows no delete toast when the task could not be removed', () => {
    localStorageService.saveTasks([task('a'), task('b')]);
    failWrites();
    expect(deleteTaskWithUndo('a')).toBeNull();
    expect(toast).not.toHaveBeenCalled();
    vi.restoreAllMocks();
    expect(ids()).toEqual(['a', 'b']);
  });

  it('shows no clear toast when the completed tasks could not be removed', () => {
    localStorageService.saveTasks([task('a', true), task('b'), task('c', true)]);
    failWrites();
    expect(clearCompletedWithUndo()).toBe(0);
    expect(toast).not.toHaveBeenCalled();
    vi.restoreAllMocks();
    expect(ids()).toEqual(['a', 'b', 'c']);
  });

  it('keeps the delete toast open when Undo could not put the task back', () => {
    localStorageService.saveTasks([task('a'), task('b')]);
    deleteTaskWithUndo('a');
    const onUndo = undo();

    failWrites();
    expect(pressUndo(onUndo)).toBe(true);
    vi.restoreAllMocks();
    expect(ids()).toEqual(['b']);

    expect(pressUndo(onUndo)).toBe(false);
    expect(ids()).toEqual(['a', 'b']);
  });

  it('keeps the clear toast open when Undo could not put the tasks back', () => {
    localStorageService.saveTasks([task('a', true), task('b'), task('c', true)]);
    clearCompletedWithUndo();
    const onUndo = undo();

    failWrites();
    expect(pressUndo(onUndo)).toBe(true);
    vi.restoreAllMocks();
    expect(ids()).toEqual(['b']);

    expect(pressUndo(onUndo)).toBe(false);
    expect(ids()).toEqual(['a', 'b', 'c']);
  });
});

describe('the Done count around Clear completed', () => {
  const done = () =>
    dashboardStats(localStorageService.getTasks(), [], new Date(), localStorageService.getClearedTasks()).done;

  it('stays the same after the completed tasks are cleared', () => {
    localStorageService.saveTasks([task('a', true), task('b'), task('c', true)]);
    expect(done()).toBe(2);
    clearCompletedWithUndo();
    expect(ids()).toEqual(['b']);
    expect(done()).toBe(2);
  });

  it('does not count a task twice after Undo, and drops it when it is reopened', () => {
    localStorageService.saveTasks([task('a', true), task('b')]);
    clearCompletedWithUndo();
    undo()();
    expect(done()).toBe(1);
    expect(localStorageService.getClearedTasks()).toEqual([]);

    localStorageService.updateTask('a', { completed: false });
    expect(done()).toBe(0);
  });

  it('keeps a finished task counted when it is deleted on its own, but not an open one', () => {
    localStorageService.saveTasks([task('a', true), task('b')]);
    deleteTaskWithUndo('a');
    deleteTaskWithUndo('b');
    expect(done()).toBe(1);
  });

  it('survives a reload: the count is read back from storage', () => {
    localStorageService.saveTasks([task('a', true), task('b', true)]);
    clearCompletedWithUndo();
    const stored = localStorage.getItem('zephyr_tasks');
    localStorage.clear();
    localStorage.setItem('zephyr_tasks', stored);
    expect(done()).toBe(2);
  });
});
