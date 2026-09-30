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
