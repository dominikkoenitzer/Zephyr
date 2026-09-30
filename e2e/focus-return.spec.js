import { expect, test } from '@playwright/test';
import { seed } from './helpers';

// Closing a dialog or the full-screen timer must hand the keyboard back to
// where it was. Dropped on <body>, the next Tab starts again from the top of
// the page.

const focusedOn = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return 'body';
    return el.getAttribute('aria-label') || el.textContent.trim().slice(0, 40) || el.tagName.toLowerCase();
  });

test.describe('closing a dialog returns focus to what opened it', () => {
  // The list page is lazy and its quick add autofocuses when it arrives; wait
  // for that so it cannot take focus from a button mid-test.
  const openTasks = async (page) => {
    await seed(page);
    await page.goto('/tasks');
    await expect(page.getByRole('textbox', { name: 'Add a task' })).toBeFocused();
    return page.getByRole('dialog', { name: 'Command palette' });
  };

  test('the command palette, opened from the search button', async ({ page }) => {
    const palette = await openTasks(page);
    const search = page.getByRole('button', { name: 'Search your tasks, or run a command' });
    await search.focus();
    await page.keyboard.press('Enter');
    await expect(palette).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(palette).toHaveCount(0);
    await expect(search).toBeFocused();
  });

  test('the command palette, opened with Ctrl+K', async ({ page }) => {
    const palette = await openTasks(page);
    const edit = page.getByRole('button', { name: 'Edit "Buy oat milk"' });
    await edit.focus();
    await page.keyboard.press('Control+K');
    await expect(palette).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(palette).toHaveCount(0);
    await expect(edit).toBeFocused();
  });

  test('the task editor, closed with Escape', async ({ page }) => {
    await seed(page);
    await page.goto('/tasks');
    const edit = page.getByRole('button', { name: 'Edit "Buy oat milk"' });
    await edit.focus();
    await page.keyboard.press('Enter');
    const editor = page.getByRole('dialog', { name: 'Edit task' });
    await expect(editor).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(editor).toHaveCount(0);
    await expect(edit).toBeFocused();
  });

  test('deleting from the task editor moves focus to the next row', async ({ page }) => {
    await seed(page);
    await page.goto('/tasks');
    await page.getByRole('button', { name: 'Edit "Book the dentist"' }).focus();
    await page.keyboard.press('Enter');
    const editor = page.getByRole('dialog', { name: 'Edit task' });
    await editor.getByRole('button', { name: 'Delete', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(editor).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Edit "Book the dentist"' })).toHaveCount(0);
    // The next row's checkbox, whichever row that is.
    await expect
      .poll(async () => {
        const check = await page.evaluate(() => document.activeElement?.getAttribute('data-task-check'));
        return check || `not a row checkbox: ${await focusedOn(page)}`;
      }, { timeout: 3000 })
      .toMatch(/^task-/);
  });

  test('the preset editor, closed with Escape', async ({ page }) => {
    await seed(page);
    await page.goto('/focus');
    const edit = page.getByRole('button', { name: 'Edit Pomodoro' });
    await edit.focus();
    await page.keyboard.press('Enter');
    const editor = page.getByRole('dialog', { name: 'Edit timer preset' });
    await expect(editor).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(editor).toHaveCount(0);
    await expect(edit).toBeFocused();
  });

  test('the shortcuts sheet in Settings', async ({ page }) => {
    await seed(page);
    await page.goto('/settings');
    const view = page.getByRole('button', { name: 'View shortcuts' });
    await view.focus();
    await page.keyboard.press('Enter');
    const sheet = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
    await expect(sheet).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);
    await expect(view).toBeFocused();
  });

  test('the delete-data dialog in Settings', async ({ page }) => {
    await seed(page);
    await page.goto('/settings');
    const del = page.getByRole('button', { name: 'Delete', exact: true });
    await del.focus();
    await page.keyboard.press('Enter');
    const confirm = page.getByRole('dialog', { name: 'Delete all data?' });
    await expect(confirm).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(confirm).toHaveCount(0);
    await expect(del).toBeFocused();
  });
});

test('the full-screen timer takes focus and gives it back', async ({ page }) => {
  await seed(page);
  await page.goto('/focus');
  const open = page.getByRole('button', { name: 'Full screen' });
  const night = page.getByRole('dialog', { name: 'Full screen timer' });

  await open.focus();
  await page.keyboard.press('Enter');
  await expect(night).toBeVisible();
  await expect(night.getByRole('button', { name: 'Start timer' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(night).toHaveCount(0);
  await expect(open).toBeFocused();

  await open.focus();
  await page.keyboard.press('Enter');
  await expect(night).toBeVisible();
  await night.getByRole('button', { name: 'Exit fullscreen' }).click();
  await expect(night).toHaveCount(0);
  await expect(open).toBeFocused();
});
