import { expect, test } from '@playwright/test';
import { seed } from './helpers';

const palette = (page) => page.getByRole('dialog', { name: 'Command palette' });

test.describe('the command palette', () => {
  test('the clear-completed count follows the tasks you tick off', async ({ page }) => {
    await seed(page);
    await page.goto('/tasks');
    await page.keyboard.press('Control+K');
    await expect(palette(page).getByRole('option', { name: 'Clear 1 completed task' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(palette(page)).toHaveCount(0);

    await page.getByRole('button', { name: 'Mark "Buy oat milk" complete' }).click();
    await page.keyboard.press('Control+K');
    await expect(palette(page).getByRole('option', { name: 'Clear 2 completed tasks' })).toBeVisible();
  });

  test('a session finished after the page loaded can be resumed', async ({ page }) => {
    await seed(page, {
      extra: {
        zephyr_timer_state: JSON.stringify({
          timeLeft: 2, isRunning: true, isBreak: false, pomodorosCompleted: 0,
          workTime: 1500, breakTime: 300, longBreakTime: 900,
          focusTask: { id: 'task-0', title: 'Draft the quarterly review' }, lastSaved: Date.now(),
        }),
      },
    });
    await page.goto('/focus');
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('zephyr_last_focus_session')), { timeout: 8000 })
      .not.toBeNull();
    await page.keyboard.press('Control+K');
    await expect(palette(page).getByRole('option', { name: 'Resume "Draft the quarterly review"' })).toBeVisible();
  });
});
