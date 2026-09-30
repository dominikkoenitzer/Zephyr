import { expect, test } from '@playwright/test';
import { seed } from './helpers';

test.describe('the task list', () => {
  test('a saved tag filter whose tag is gone does not hide every task', async ({ page }) => {
    await seed(page, { extra: { zephyr_view_prefs: JSON.stringify({ taskView: 'all', taskTag: 'gone' }) } });
    await page.goto('/tasks');
    await expect(page.getByText('Buy oat milk')).toBeVisible();
    await expect(page.getByText('Nothing here')).toHaveCount(0);
  });
});
