import { expect, test } from '@playwright/test';
import { greenPaint, seed } from './helpers';

const sessionsLogged = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('zephyr_focus_sessions') || '[]').length);

test.describe('the focus timer', () => {
  test('Skip moves on without logging a session', async ({ page }) => {
    await seed(page, { sessions: [] });
    await page.goto('/focus');
    for (let i = 0; i < 4; i += 1) {
      await page.getByRole('button', { name: 'Start timer' }).click();
      await page.waitForTimeout(1100);
      await page.getByRole('button', { name: 'Skip session' }).click();
    }
    expect(await sessionsLogged(page)).toBe(0);
  });

  test('the first break is a short one', async ({ page }) => {
    await seed(page, { sessions: [] });
    await page.goto('/focus');
    await page.getByRole('button', { name: 'Start timer' }).click();
    await page.waitForTimeout(1100);
    await page.getByRole('button', { name: 'Skip session' }).click();
    await expect(page.getByText('Short break', { exact: true })).toBeVisible();
    await expect(page.getByText('05:00', { exact: true })).toBeVisible();
  });

  test('a finished session is logged', async ({ page }) => {
    await seed(page, {
      sessions: [],
      extra: {
        zephyr_timer_state: JSON.stringify({
          timeLeft: 2, isRunning: true, isBreak: false, pomodorosCompleted: 0,
          workTime: 1500, breakTime: 300, longBreakTime: 900, focusTask: null, lastSaved: Date.now(),
        }),
      },
    });
    await page.goto('/focus');
    await expect.poll(() => sessionsLogged(page), { timeout: 8000 }).toBe(1);
  });

  test('a session that runs out on another page is logged there, once, when it ended', async ({ page }) => {
    const lastSaved = Date.now();
    await seed(page, {
      sessions: [],
      extra: {
        zephyr_timer_state: JSON.stringify({
          timeLeft: 2, isRunning: true, isBreak: false, pomodorosCompleted: 0,
          workTime: 1500, breakTime: 300, longBreakTime: 900, focusTask: null, lastSaved,
        }),
      },
    });
    await page.goto('/tasks');
    await expect.poll(() => sessionsLogged(page), { timeout: 8000 }).toBe(1);
    await page.waitForTimeout(2500);
    expect(await sessionsLogged(page)).toBe(1);
    const loggedAt = await page.evaluate(() => JSON.parse(localStorage.getItem('zephyr_focus_sessions'))[0].date);
    expect(Math.abs(new Date(loggedAt).getTime() - (lastSaved + 2000))).toBeLessThan(1500);
  });

  test('a session that ran out while the app was closed counts on the day it ended', async ({ page }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(10, 0, 0, 0);
    await seed(page, {
      sessions: [],
      extra: {
        zephyr_timer_state: JSON.stringify({
          timeLeft: 60, isRunning: true, isBreak: false, pomodorosCompleted: 0,
          workTime: 1500, breakTime: 300, longBreakTime: 900, focusTask: null, lastSaved: yesterday.getTime(),
        }),
      },
    });
    await page.goto('/');
    await expect.poll(() => sessionsLogged(page), { timeout: 8000 }).toBe(1);
    const loggedAt = await page.evaluate(() => JSON.parse(localStorage.getItem('zephyr_focus_sessions'))[0].date);
    expect(new Date(loggedAt).toDateString()).toBe(yesterday.toDateString());
  });

  test('So far counts today, from the session log', async ({ page }) => {
    await seed(page, {
      extra: {
        zephyr_timer_state: JSON.stringify({
          timeLeft: 1500, isRunning: false, isBreak: false, pomodorosCompleted: 9,
          workTime: 1500, breakTime: 300, longBreakTime: 900, focusTask: null, lastSaved: Date.now(),
        }),
      },
    });
    await page.goto('/focus');
    const today = page.getByRole('region', { name: 'So far' });
    await expect(today.getByText('Sessions').locator('xpath=..')).toContainText('1');
    await expect(today.getByText('Minutes').locator('xpath=..')).toContainText('25');
  });

  test('a start link leaves the address bar, so a reload does not start again', async ({ page }) => {
    await seed(page);
    await page.goto('/focus?start=1');
    await expect(page.getByRole('button', { name: 'Pause timer' })).toBeVisible();
    await expect(page).toHaveURL(/\/focus$/);
    await page.getByRole('button', { name: 'Pause timer' }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible();
  });

  test('pausing gives the tab back the Focus title, even arriving from another page', async ({ page }) => {
    await seed(page);
    await page.goto('/help');
    await page.goto('/focus');
    await page.getByRole('button', { name: 'Start timer' }).click();
    await expect(page).toHaveTitle(/· Focus \| Zephyr/);
    await page.getByRole('button', { name: 'Pause timer' }).click();
    await expect(page).toHaveTitle('Focus Timer | Zephyr');
  });
});

test.describe('tasks', () => {
  test('quick add reads the date, the priority and the tag', async ({ page }) => {
    await seed(page, { tasks: [] });
    await page.goto('/tasks');
    const field = page.getByRole('textbox', { name: 'Add a task' });
    await expect(field).toHaveAttribute('placeholder', 'Add a task');
    await field.fill('Water the basil tomorrow !high #home');
    await field.press('Enter');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('zephyr_tasks')).tasks[0]);
    expect(saved.title).toBe('Water the basil');
    expect(saved.priority).toBe('high');
    expect(saved.tags).toEqual(['home']);
    expect(saved.dueDate).toBeTruthy();
  });

  test('ticking a task off moves it to Completed', async ({ page }) => {
    await seed(page);
    await page.goto('/tasks');
    await page.getByRole('button', { name: 'Mark "Buy oat milk" complete' }).click();
    await expect(page.getByRole('button', { name: 'Mark "Buy oat milk" complete' })).toHaveCount(0);
    const done = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('zephyr_tasks')).tasks.find((t) => t.title === 'Buy oat milk').completed,
    );
    expect(done).toBe(true);
  });
});

test.describe('settings', () => {
  test('Delete all data deletes it and says so', async ({ page }) => {
    await seed(page);
    await page.addInitScript(() => localStorage.setItem('unrelated-app', 'keep me'));
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();

    const toast = page.getByText('All data deleted');
    await expect(toast).toBeVisible();
    expect(await greenPaint(page), 'the toast stays in the app palette').toEqual([]);

    const left = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('zephyr_')));
    expect(left).toEqual([]);
    expect(await page.evaluate(() => localStorage.getItem('unrelated-app'))).toBe('keep me');
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('a preset can be edited without a mouse', async ({ page }) => {
    await seed(page);
    await page.goto('/focus');
    await page.getByRole('button', { name: 'Edit Pomodoro' }).click();
    await expect(page.getByRole('dialog', { name: 'Edit timer preset' })).toBeVisible();
  });

  test('the task editor fits on the screen, Save included', async ({ page }) => {
    await seed(page);
    await page.goto('/tasks?task=task-0');
    const dialog = page.getByRole('dialog', { name: 'Edit task' });
    await expect(dialog).toBeInViewport({ ratio: 1 });
    const box = await dialog.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    await expect(dialog.getByRole('button', { name: 'Save' })).toBeInViewport();
  });
});
