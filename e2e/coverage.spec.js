import { expect, test } from '@playwright/test';
import { seed } from './helpers';

const storedTasks = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('zephyr_tasks') || '{"tasks":[]}').tasks);

test.describe('tasks', () => {
  test('a deleted task comes back in its place with Undo', async ({ page }) => {
    await seed(page);
    await page.goto('/tasks');
    const before = (await storedTasks(page)).map((t) => t.id);

    await page.getByRole('button', { name: 'Buy oat milk', exact: true }).hover();
    await page.getByRole('button', { name: 'Delete "Buy oat milk"' }).click();
    await expect(page.getByRole('button', { name: 'Buy oat milk', exact: true })).toHaveCount(0);
    expect((await storedTasks(page)).map((t) => t.id)).not.toContain('task-4');

    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(page.getByRole('button', { name: 'Buy oat milk', exact: true })).toBeVisible();
    expect((await storedTasks(page)).map((t) => t.id)).toEqual(before);
  });

  test('editing a task saves the title, description and priority and keeps the due date', async ({ page }) => {
    await seed(page);
    await page.goto('/tasks');
    const original = (await storedTasks(page)).find((t) => t.id === 'task-1');

    await page.getByRole('button', { name: original.title, exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit task' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Title').fill('Call the landlord about the heating');
    await dialog.getByLabel('Description').fill('Radiator in the bedroom');
    await dialog.getByRole('combobox', { name: 'Priority' }).click();
    await page.getByRole('option', { name: 'High' }).click();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toBeHidden();

    const saved = (await storedTasks(page)).find((t) => t.id === 'task-1');
    expect(saved.title).toBe('Call the landlord about the heating');
    expect(saved.description).toBe('Radiator in the bedroom');
    expect(saved.priority).toBe('high');
    expect(saved.dueDate).toBe(original.dueDate);
    await expect(page.getByRole('button', { name: 'Call the landlord about the heating', exact: true })).toBeVisible();
  });

  test('Cancel in the task editor changes nothing', async ({ page }) => {
    await seed(page);
    await page.goto('/tasks');
    const before = await storedTasks(page);

    await page.getByRole('button', { name: 'Book the dentist', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit task' });
    await dialog.getByLabel('Title').fill('Something else entirely');
    await dialog.getByLabel('Description').fill('Not kept');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();

    expect(await storedTasks(page)).toEqual(before);
    await expect(page.getByRole('button', { name: 'Book the dentist', exact: true })).toBeVisible();
  });
});

test.describe('backup', () => {
  test('Export, Delete all data, then Import brings the tasks back', async ({ page }) => {
    await seed(page);
    await page.goto('/settings');
    const before = await storedTasks(page);
    expect(before.length).toBeGreaterThan(0);

    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export' }).click();
    const file = await (await downloading).path();

    const wiped = page.waitForEvent('load');
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await wiped;
    expect(await storedTasks(page)).toEqual([]);

    const restored = page.waitForEvent('load');
    await page.getByLabel('Import a Zephyr backup file').setInputFiles(file);
    await expect(page.getByText(/^Restored \d+ items?\./)).toBeVisible();
    await restored;
    expect(await storedTasks(page)).toEqual(before);
  });

  test('a JSON file that is not a Zephyr backup is refused and changes nothing', async ({ page }) => {
    await seed(page);
    await page.goto('/settings');
    // The user's data only: the app writes device keys of its own after load.
    const userData = () =>
      page.evaluate(() =>
        ['zephyr_tasks', 'zephyr_focus_sessions', 'focusTimerPresets', 'theme'].map((k) => localStorage.getItem(k)),
      );
    const before = await userData();
    await page.evaluate(() => { window.__notReloaded = true; });

    await page.getByLabel('Import a Zephyr backup file').setInputFiles({
      name: 'other.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ app: 'something-else', data: { zephyr_tasks: '{"tasks":[]}' } })),
    });
    await expect(page.getByText('That file is not a Zephyr backup.')).toBeVisible();
    // A real import reloads after 1.2 s; give it the time to prove it does not.
    await page.waitForTimeout(1600);
    expect(await page.evaluate(() => window.__notReloaded)).toBe(true);
    expect(await userData()).toEqual(before);
  });
});

test.describe('timer presets', () => {
  test('a new preset keeps its name through a reload and goes when deleted', async ({ page }) => {
    await seed(page);
    await page.goto('/focus');

    await page.getByRole('button', { name: 'New', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit timer preset' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Preset name').fill('Deep work');
    await dialog.getByRole('button', { name: 'Save preset' }).click();
    await expect(dialog).toBeHidden();

    await page.reload();
    const preset = page.getByRole('button', { name: 'Deep work', exact: true });
    await expect(preset).toBeVisible();

    await preset.hover();
    await page.getByRole('button', { name: 'Delete Deep work' }).click();
    await expect(preset).toHaveCount(0);
    const stored = await page.evaluate(() => localStorage.getItem('focusTimerPresets') || '');
    expect(stored).not.toContain('Deep work');

    await page.reload();
    await expect(page.getByRole('button', { name: 'Pomodoro', exact: true })).toBeVisible();
    await expect(preset).toHaveCount(0);
  });
});
