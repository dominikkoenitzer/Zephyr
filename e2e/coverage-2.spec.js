import { expect, test } from '@playwright/test';
import { seed } from './helpers';

const read = (page, key, fallback) =>
  page.evaluate(([k, f]) => JSON.parse(localStorage.getItem(k) || f), [key, fallback]);
const storedTasks = async (page) => (await read(page, 'zephyr_tasks', '{"tasks":[]}')).tasks;
const storedTask = async (page, id) => (await storedTasks(page)).find((t) => t.id === id);
const sessionsLogged = async (page) => (await read(page, 'zephyr_focus_sessions', '[]')).length;
const timerState = (page) => read(page, 'zephyr_timer_state', 'null');

const savedTimer = (state) =>
  JSON.stringify({
    timeLeft: 1500, isRunning: false, isBreak: false, pomodorosCompleted: 0,
    workTime: 1500, breakTime: 300, longBreakTime: 900, focusTask: null, lastSaved: Date.now(), ...state,
  });

/** Titles of the open tasks on screen, in the order they are listed. */
const openTitles = (page) =>
  page
    .getByRole('region', { name: 'Open tasks' })
    .getByRole('button', { name: /^Mark ".*" complete$/ })
    .evaluateAll((els) => els.map((el) => el.getAttribute('aria-label').replace(/^Mark "(.*)" complete$/, '$1')));

test.describe('completed tasks', () => {
  test('un-completing a task puts it back in its group, open, with completedAt cleared', async ({ page }) => {
    await seed(page);
    await page.goto('/tasks');
    expect((await storedTask(page, 'task-5')).completedAt).toBeTruthy();

    await page.getByRole('button', { name: 'Show', exact: true }).click();
    await page.getByRole('button', { name: 'Mark "Send the invoice" not complete' }).click();

    // Due two days ago, so it goes back under Overdue.
    const overdue = page
      .getByRole('region', { name: 'Open tasks' })
      .locator('h2', { hasText: 'Overdue' })
      .locator('xpath=..');
    await expect(overdue.getByRole('button', { name: 'Send the invoice', exact: true })).toBeVisible();
    await expect(overdue.getByRole('button', { name: 'Mark "Send the invoice" complete' })).toBeVisible();
    // It was the only completed task, so the Completed card goes with it.
    await expect(page.getByRole('button', { name: /^Completed/ })).toHaveCount(0);

    const saved = await storedTask(page, 'task-5');
    expect(saved.completed).toBe(false);
    expect(saved.completedAt).toBeNull();
  });
});

test.describe('reset timer', () => {
  test('the Reset button puts a running session back to its full length and logs nothing', async ({ page }) => {
    await seed(page, { sessions: [] });
    await page.goto('/focus');
    const timer = page.getByRole('region', { name: 'Timer' });

    await page.getByRole('button', { name: 'Start timer' }).click();
    await expect(timer).not.toContainText('25:00', { timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Pause timer' })).toBeVisible();

    await page.getByRole('button', { name: 'Reset timer' }).click();
    await expect(timer).toContainText('25:00');
    await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible();
    await page.waitForTimeout(1200);
    await expect(timer).toContainText('25:00');

    const state = await timerState(page);
    expect(state.timeLeft).toBe(1500);
    expect(state.isRunning).toBe(false);
    expect(await sessionsLogged(page)).toBe(0);
  });

  test('the R key puts a paused session back to its full length and logs nothing', async ({ page }) => {
    await seed(page, { sessions: [] });
    await page.goto('/focus');
    const timer = page.getByRole('region', { name: 'Timer' });

    await page.getByRole('button', { name: 'Start timer' }).click();
    await expect(timer).not.toContainText('25:00', { timeout: 5000 });
    await page.getByRole('button', { name: 'Pause timer' }).click();
    await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible();
    await expect(timer).not.toContainText('25:00');

    await page.keyboard.press('r');
    await expect(timer).toContainText('25:00');
    await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible();

    const state = await timerState(page);
    expect(state.timeLeft).toBe(1500);
    expect(state.isRunning).toBe(false);
    expect(await sessionsLogged(page)).toBe(0);
  });

  test('the R key resets a running session too', async ({ page }) => {
    await seed(page, { sessions: [] });
    await page.goto('/focus');
    const timer = page.getByRole('region', { name: 'Timer' });

    await page.getByRole('button', { name: 'Start timer' }).click();
    await expect(timer).not.toContainText('25:00', { timeout: 5000 });
    await page.keyboard.press('r');
    await expect(timer).toContainText('25:00');
    await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible();

    expect((await timerState(page)).isRunning).toBe(false);
    expect(await sessionsLogged(page)).toBe(0);
  });
});

test.describe('focus on a task', () => {
  test("a task's own focus button runs the session under that task's title", async ({ page }) => {
    await seed(page, { sessions: [] });
    await page.goto('/tasks');

    await page.getByRole('button', { name: 'Draft the quarterly review', exact: true }).hover();
    await page.getByRole('button', { name: 'Start a focus session on "Draft the quarterly review"' }).click();

    await expect(page).toHaveURL(/\/focus$/);
    await expect(page.getByRole('button', { name: 'Pause timer' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Task for this session' })).toHaveText('Draft the quarterly review');

    await expect.poll(async () => (await timerState(page))?.focusTask).toEqual({
      id: 'task-0',
      title: 'Draft the quarterly review',
    });
    expect((await timerState(page)).isRunning).toBe(true);
  });

  test('Mark done on the finished session toast completes the task', async ({ page }) => {
    await seed(page, {
      sessions: [],
      extra: {
        zephyr_timer_state: savedTimer({
          timeLeft: 2,
          isRunning: true,
          focusTask: { id: 'task-1', title: 'Reply to the landlord about the heating' },
        }),
      },
    });
    await page.goto('/focus');

    const toast = page.locator('[data-sonner-toast]', { hasText: 'Session complete' });
    await expect(toast).toBeVisible({ timeout: 8000 });
    await expect(toast).toContainText('Reply to the landlord about the heating');
    expect((await storedTask(page, 'task-1')).completed).toBe(false);

    await toast.getByRole('button', { name: 'Mark done' }).click();
    await expect.poll(async () => (await storedTask(page, 'task-1')).completed).toBe(true);
    expect((await storedTask(page, 'task-1')).completedAt).toBeTruthy();

    const sessions = await read(page, 'zephyr_focus_sessions', '[]');
    expect(sessions).toHaveLength(1);
    expect(sessions[0].task).toEqual({ id: 'task-1', title: 'Reply to the landlord about the heating' });

    await page.goto('/tasks');
    await expect(page.getByRole('button', { name: 'Mark "Reply to the landlord about the heating" complete' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Show', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Mark "Reply to the landlord about the heating" not complete' }),
    ).toBeVisible();
  });
});

test.describe('task filters', () => {
  test('each view shows exactly its tasks, a tag narrows it, and the choice survives a reload', async ({ page }) => {
    await seed(page);
    await page.goto('/tasks');
    const views = page.getByRole('group', { name: 'Filter tasks' });
    const tags = page.getByRole('group', { name: 'Filter by tag' });
    const chip = (name) => views.getByRole('button', { name: new RegExp(`^${name}`) });
    const sorted = async () => (await openTitles(page)).sort();

    await expect(chip('All')).toHaveAttribute('aria-pressed', 'true');

    const expected = {
      Today: ['Draft the quarterly review', 'Fix the flaky login test', 'Reply to the landlord about the heating'],
      Overdue: ['Fix the flaky login test'],
      Upcoming: ['Book the dentist'],
      'No date': ['Buy oat milk'],
    };
    for (const [name, titles] of Object.entries(expected)) {
      await chip(name).click();
      await expect(chip(name)).toHaveAttribute('aria-pressed', 'true');
      await expect.poll(sorted).toEqual(titles);
    }

    await chip('Today').click();
    await tags.getByRole('button', { name: '#work' }).click();
    await expect(tags.getByRole('button', { name: '#work' })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(sorted).toEqual(['Draft the quarterly review', 'Fix the flaky login test']);
    expect(await read(page, 'zephyr_view_prefs', '{}')).toMatchObject({ taskView: 'today', taskTag: 'work' });

    await page.reload();
    await expect(chip('Today')).toHaveAttribute('aria-pressed', 'true');
    await expect(tags.getByRole('button', { name: '#work' })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(sorted).toEqual(['Draft the quarterly review', 'Fix the flaky login test']);
  });
});

test.describe('full screen', () => {
  test('F opens full screen and Esc leaves it', async ({ page }) => {
    await seed(page, { sessions: [] });
    await page.goto('/focus');
    await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible();
    const night = page.getByRole('dialog', { name: 'Full screen timer' });

    await page.keyboard.press('f');
    await expect(night).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-fullscreen', '');

    await page.keyboard.press('Escape');
    await expect(night).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveAttribute('data-fullscreen');
    await expect(page.getByRole('region', { name: 'Timer' })).toBeVisible();
  });

  test('the full-screen Start/Pause and Skip buttons work', async ({ page }) => {
    await seed(page, { sessions: [] });
    await page.goto('/focus');
    await page.getByRole('button', { name: 'Full screen' }).click();
    const night = page.getByRole('dialog', { name: 'Full screen timer' });
    await expect(night).toBeVisible();
    await expect(night).toContainText('25:00');

    await night.getByRole('button', { name: 'Start timer' }).click();
    await expect(night.getByRole('button', { name: 'Pause timer' })).toBeVisible();
    await expect(night).not.toContainText('25:00', { timeout: 5000 });
    expect((await timerState(page)).isRunning).toBe(true);

    await night.getByRole('button', { name: 'Pause timer' }).click();
    await expect(night.getByRole('button', { name: 'Start timer' })).toBeVisible();
    await expect.poll(async () => (await timerState(page)).isRunning).toBe(false);

    await night.getByRole('button', { name: 'Skip session' }).click();
    await expect(night.getByRole('heading', { name: 'Short break' })).toBeVisible();
    await expect(night).toContainText('05:00');
    await expect.poll(async () => (await timerState(page)).isBreak).toBe(true);
    expect(await sessionsLogged(page)).toBe(0);

    await page.keyboard.press('Escape');
    await expect(night).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Timer' })).toContainText('Short break');
  });
});
