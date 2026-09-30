import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toast } from 'sonner';
import { clearCompletedWithUndo, deleteTaskWithUndo } from './taskActions';
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
