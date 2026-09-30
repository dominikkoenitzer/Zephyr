import { expect, test } from '@playwright/test';
import { seed } from './helpers';

test.describe('the task list', () => {
  test('a saved tag filter whose tag is gone does not hide every task', async ({ page }) => {
    await seed(page, { extra: { zephyr_view_prefs: JSON.stringify({ taskView: 'all', taskTag: 'gone' }) } });
    await page.goto('/tasks');
    await expect(page.getByText('Buy oat milk')).toBeVisible();
    await expect(page.getByText('Nothing here')).toHaveCount(0);
  });

  test('Escape in the date picker closes the picker and keeps the edit open', async ({ page }) => {
    await seed(page);
    await page.goto('/tasks?task=task-4');
    const dialog = page.getByRole('dialog', { name: 'Edit task' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Title').fill('Buy oat milk and bread');

    await dialog.getByRole('button', { name: /Due date/ }).click();
    const next = page.getByRole('button', { name: 'Next month' });
    await expect(next).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(next).toHaveCount(0);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('Title')).toHaveValue('Buy oat milk and bread');
  });

  test('the date picker takes the focus when it opens, and gives it back', async ({ page }) => {
    await seed(page);
    await page.goto('/tasks?task=task-4');
    const trigger = page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: /Due date/ });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const next = page.getByRole('button', { name: 'Next month' });
    await expect(next).toBeVisible();
    // Today's day, since the task has no date yet.
    const today = page.locator('button:focus');
    await expect(today).toHaveText(String(new Date().getDate()));
    // Still there a moment later and after a Tab: the dialog's focus trap must not pull it back.
    await page.waitForTimeout(300);
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('button:focus')).toHaveCount(1);
    expect(await page.evaluate(() => document.activeElement.closest('[role="dialog"]')?.getAttribute('aria-label'))).toBe(
      'Choose a date',
    );

    await page.keyboard.press('Escape');
    await expect(next).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.getByRole('dialog', { name: 'Edit task' })).toBeVisible();
  });
});
