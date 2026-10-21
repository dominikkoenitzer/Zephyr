import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { TASKS, seed, settle, watchErrors } from './helpers';

const storedTasks = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('zephyr_tasks') || '{"tasks":[]}').tasks);

// A backup from another device: one task this device has, changed later
// there, one it does not have, and a different theme.
const otherDevice = () => {
  const later = new Date(Date.now() + 60_000).toISOString();
  const tasks = [
    { ...TASKS[2], title: 'Book the dentist for Tuesday', updatedAt: later },
    { id: 'task-other', title: 'Water the plants', priority: 'low', completed: false, createdAt: later, subtasks: [], tags: [] },
  ];
  return {
    name: 'zephyr-backup-other.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      app: 'zephyr',
      version: 1,
      data: { zephyr_tasks: JSON.stringify({ tasks, lastUpdated: Date.now() }), zephyr_focus_sessions: '[]', theme: 'dark' },
    })),
  };
};

const pick = (page, file) => page.getByLabel('Import a Zephyr backup file').setInputFiles(file);

test.describe('import', () => {
  test('the dialog shows both sides, and Merge adds and updates without touching the theme', async ({ page }) => {
    const errors = watchErrors(page);
    await seed(page);
    await page.goto('/settings');

    await pick(page, otherDevice());
    const dialog = page.getByRole('dialog', { name: 'Import backup' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('zephyr-backup-other.json');
    const row = (label) => dialog.getByRole('row').filter({ has: page.getByRole('rowheader', { name: label }) });
    await expect(row('Tasks').getByRole('cell')).toHaveText([String(TASKS.length), '2']);
    await expect(row('Sessions').getByRole('cell')).toHaveText(['4', '0']);
    await settle(page);
    const axe = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
    expect(axe.violations.map((v) => v.id)).toEqual([]);

    const reloaded = page.waitForEvent('load');
    // Twice, fast: one import, one toast.
    await dialog.getByRole('button', { name: 'Merge' }).dblclick({ force: true }).catch(() => {});
    await expect(page.getByText('Merged. Tasks: 1 new, 1 updated. Sessions: 0 new. Reloading…')).toBeVisible();
    await expect(page.getByText(/^Merged\./)).toHaveCount(1);
    await reloaded;

    const tasks = await storedTasks(page);
    expect(tasks.map((t) => t.id)).toEqual([...TASKS.map((t) => t.id), 'task-other']);
    expect(tasks.find((t) => t.id === 'task-2').title).toBe('Book the dentist for Tuesday');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('zephyr_focus_sessions')).length)).toBe(4);
    expect(errors).toEqual([]);
  });

  test('Replace puts the file in place of this device, and Cancel changes nothing', async ({ page }) => {
    await seed(page);
    await page.goto('/settings');
    const before = await storedTasks(page);

    await pick(page, otherDevice());
    const dialog = page.getByRole('dialog', { name: 'Import backup' });
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toHaveCount(0);
    expect(await storedTasks(page)).toEqual(before);

    await pick(page, otherDevice());
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    expect(await storedTasks(page)).toEqual(before);

    const reloaded = page.waitForEvent('load');
    await pick(page, otherDevice());
    await dialog.getByRole('button', { name: 'Replace' }).click();
    await expect(page.getByText(/^Restored \d+ items?\./)).toBeVisible();
    await reloaded;
    expect((await storedTasks(page)).map((t) => t.id)).toEqual(['task-2', 'task-other']);
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
  });

  test('a long file name is cut short and leaves the rest of the dialog in place', async ({ page }) => {
    await seed(page);
    await page.goto('/settings');
    const name = 'zephyr-backup-2026-10-20-from-the-old-laptop-before-the-reinstall-final-copy (2).json';
    await pick(page, { ...otherDevice(), name });

    const dialog = page.getByRole('dialog', { name: 'Import backup' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(name)).toHaveAttribute('title', name);
    // Nothing inside the card reaches past its right edge: the name is clipped, not the card.
    const past = await dialog.evaluate((el) => {
      const right = el.getBoundingClientRect().right;
      return [...el.querySelectorAll('*')]
        .filter((child) => child.getBoundingClientRect().right > right + 1)
        .map((child) => child.tagName.toLowerCase());
    });
    expect(past).toEqual([]);
    await expect(dialog.getByRole('button', { name: 'Merge' })).toBeInViewport({ ratio: 1 });
  });

  test('a damaged backup is refused before the dialog and changes nothing', async ({ page }) => {
    await seed(page);
    await page.goto('/settings');
    const before = await storedTasks(page);
    await page.evaluate(() => { window.__notReloaded = true; });

    await pick(page, {
      name: 'damaged.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ app: 'zephyr', version: 1, data: { zephyr_tasks: '{"tasks":[{"title":"no id"}]}' } })),
    });
    await expect(page.getByText('Could not read that backup file.')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.waitForTimeout(1600);
    expect(await page.evaluate(() => window.__notReloaded)).toBe(true);
    expect(await storedTasks(page)).toEqual(before);
  });

  test('the dialog works from the keyboard alone', async ({ page }) => {
    await seed(page);
    await page.goto('/settings');
    await pick(page, otherDevice());
    const dialog = page.getByRole('dialog', { name: 'Import backup' });
    await expect(dialog).toBeVisible();

    // Focus starts inside the dialog and Tab stays there.
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
    const reloaded = page.waitForEvent('load');
    await dialog.getByRole('button', { name: 'Merge' }).focus();
    await page.keyboard.press('Enter');
    await reloaded;
    expect((await storedTasks(page)).map((t) => t.id)).toContain('task-other');
  });
});

test.describe('the Done count', () => {
  test('holds through Clear completed and a reload', async ({ page }) => {
    await seed(page);
    const done = TASKS.filter((t) => t.completed).length;
    const card = () => page.getByRole('link').filter({ has: page.getByText('Done', { exact: true }) });

    await page.goto('/');
    await expect(card()).toContainText(String(done));

    await page.goto('/tasks');
    await page.getByRole('button', { name: 'Show', exact: true }).click();
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(page.getByRole('button', { name: /^Completed/ })).toHaveCount(0);
    expect((await storedTasks(page)).filter((t) => t.completed)).toEqual([]);

    await page.goto('/');
    await expect(card().locator('p').nth(1)).toHaveText(String(done));
    await page.reload();
    await expect(card().locator('p').nth(1)).toHaveText(String(done));
    await expect(card()).toContainText(`${done} this week`);
  });
});
