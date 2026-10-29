// Task mutations that come with their own undo. Both the task list and the
// ⌘K palette run these, so the toast copy and the restore behaviour stay in
// one place. An undo that silently reordered the list was the reason this
// moved out of the component.

import { toast } from 'sonner';
import { localStorageService } from '../services/localStorage';

/** Put a task back where it was, not at the end of the list. False if the write failed. */
const restoreAt = (task, index) => {
  const tasks = localStorageService.getTasks();
  if (tasks.some((t) => t.id === task.id)) return true;
  tasks.splice(Math.min(index, tasks.length), 0, task);
  return localStorageService.saveTasks(tasks);
};

/** An Undo that was not saved keeps its toast open, so it can be pressed again. */
const keepToastUnless = (saved, event) => {
  if (!saved) event?.preventDefault();
};

/** Delete one task, with an Undo that restores its original position. */
export function deleteTaskWithUndo(taskId) {
  const tasks = localStorageService.getTasks();
  const index = tasks.findIndex((t) => t.id === taskId);
  if (index === -1) return null;
  const [removed] = tasks.splice(index, 1);
  if (!localStorageService.saveTasks(tasks)) return null;

  toast('Task deleted', {
    description: removed.title,
    action: { label: 'Undo', onClick: (event) => keepToastUnless(restoreAt(removed, index), event) },
  });
  return removed;
}

/** Delete every completed task at once, with an Undo for the whole batch. */
export function clearCompletedWithUndo() {
  const tasks = localStorageService.getTasks();
  const removed = tasks
    .map((task, index) => ({ task, index }))
    .filter(({ task }) => task.completed);

  if (removed.length === 0) {
    toast('Nothing to clear', { description: 'No completed tasks yet.' });
    return 0;
  }

  if (!localStorageService.saveTasks(tasks.filter((t) => !t.completed))) return 0;
  toast(`Cleared ${removed.length} completed task${removed.length === 1 ? '' : 's'}`, {
    action: {
      label: 'Undo',
      onClick: (event) => {
        // Re-insert in original order so earlier indices are valid again.
        const saved = removed.map(({ task, index }) => restoreAt(task, index));
        keepToastUnless(saved.every(Boolean), event);
      },
    },
  });
  return removed.length;
}

/** Toggle one task's completed flag. Returns the updated task. */
export function toggleTaskCompleted(taskId) {
  const task = localStorageService.getTasks().find((t) => t.id === taskId);
  if (!task) return null;
  return localStorageService.updateTask(taskId, { completed: !task.completed });
}
