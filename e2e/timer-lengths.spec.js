import { expect, test } from '@playwright/test';
import { seed } from './helpers';

const timerState = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('zephyr_timer_state')));
const loggedSessions = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('zephyr_focus_sessions') || '[]'));

test.describe('the length of a phase under way', () => {
  test('editing the running preset changes the next session, not this one', async ({ page }) => {
    await page.clock.install();
    await seed(page, { sessions: [] });
    await page.goto('/focus');
    await page.getByRole('button', { name: 'Start timer' }).click();
    await page.clock.runFor(300_000);
    await expect(page.getByText('20:00', { exact: true })).toBeVisible();

    await page.getByRole('listitem').filter({ hasText: 'Pomodoro' }).first().hover();
    await page.locator('button[aria-label="Edit Pomodoro"]:visible').first().click();
    await page.locator('#preset-work-time').fill('50');
    await page.getByRole('button', { name: 'Save preset' }).click();

    await expect(page.getByText('20:00', { exact: true })).toBeVisible();
    expect((await timerState(page)).workTime).toBe(1500);
    expect((await timerState(page)).sessionTotal).toBe(1500);

    await page.clock.runFor(1_200_000);
    await expect(page.getByText('Short break', { exact: true })).toBeVisible();
    const sessions = await loggedSessions(page);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].duration).toBe(1500);

    // The edit is there for the next focus session.
    await page.getByRole('button', { name: 'Skip session' }).click();
    await expect(page.getByText('50:00', { exact: true })).toBeVisible();
  });
});
