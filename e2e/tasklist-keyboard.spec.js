import { expect, test } from '@playwright/test';
import { seed } from './helpers';

const undated = (titles) =>
  titles.map((title, i) => ({
    id: `kb-${i}`,
    title,
    priority: 'medium',
    dueDate: null,
    tags: [],
    description: '',
    subtasks: [],
    completed: false,
    createdAt: new Date(2026, 0, 1, 9).toISOString(),
  }));

const check = (page, title) => page.getByRole('button', { name: `Mark "${title}" complete` });

test.describe('the task list from the keyboard', () => {
  test('completing a task moves focus to the next row, then the previous, then the quick add', async ({ page }) => {
    await seed(page, { tasks: undated(['First', 'Second', 'Third']), sessions: [] });
    await page.goto('/tasks');
    await expect(check(page, 'Third')).toBeVisible();

    await check(page, 'Second').focus();
    await page.keyboard.press('Space');
    await expect(check(page, 'Second')).toHaveCount(0);
    await expect(check(page, 'Third')).toBeFocused();

    // The last row goes: the one above it takes the focus.
    await page.keyboard.press('Space');
    await expect(check(page, 'Third')).toHaveCount(0);
    await expect(check(page, 'First')).toBeFocused();

    // The list is empty: back to where a new task is written.
    await page.keyboard.press('Space');
    await expect(check(page, 'First')).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'Add a task' })).toBeFocused();
  });

  test('deleting a task from its row moves focus to the next row', async ({ page }) => {
    await seed(page, { tasks: undated(['First', 'Second', 'Third']), sessions: [] });
    await page.goto('/tasks');
    const remove = page.getByRole('button', { name: 'Delete "Second"' });
    await remove.focus();
    await page.keyboard.press('Enter');
    await expect(check(page, 'Second')).toHaveCount(0);
    await expect(check(page, 'Third')).toBeFocused();
  });
});

test.describe('the task list at midnight', () => {
  test('a list left open regroups when the day changes', async ({ page }) => {
    // Local 23:59:50, so the browser's own midnight is ten seconds away. The
    // clock then runs twenty seconds: past midnight, but short of the
    // reminder poll's first minute, whose write would re-render the list anyway.
    const now = new Date(2026, 5, 10, 23, 59, 50);
    await page.clock.install({ time: now });
    await seed(page, {
      sessions: [],
      tasks: [
        { title: 'Due on the tenth', dueDate: '2026-06-10' },
        { title: 'Due on the eleventh', dueDate: '2026-06-11' },
      ].map((t, i) => ({
        id: `mid-${i}`,
        priority: 'medium',
        tags: [],
        description: '',
        subtasks: [],
        completed: false,
        createdAt: new Date(2026, 5, 1, 9).toISOString(),
        ...t,
      })),
    });
    await page.goto('/tasks');

    const list = page.getByRole('region', { name: 'Open tasks' });
    const group = (label) =>
      list.locator('div').filter({ has: page.getByRole('heading', { name: new RegExp(`^${label}\\b`) }) }).last();

    await expect(group('Today')).toContainText('Due on the tenth');
    await expect(group('Tomorrow')).toContainText('Due on the eleventh');
    await expect(list.getByRole('heading', { name: /^Overdue\b/ })).toHaveCount(0);

    await page.clock.runFor('00:20');

    await expect(group('Overdue')).toContainText('Due on the tenth');
    await expect(group('Today')).toContainText('Due on the eleventh');
    await expect(list.getByRole('heading', { name: /^Tomorrow\b/ })).toHaveCount(0);
  });
});
