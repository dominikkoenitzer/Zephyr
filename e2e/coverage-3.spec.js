import { expect, test } from '@playwright/test';
import { SESSIONS, TASKS, seed } from './helpers';

const palette = (page) => page.getByRole('dialog', { name: 'Command palette' });
const shortcutsSheet = (page) => page.getByRole('dialog', { name: 'Keyboard shortcuts' });
const editor = (page) => page.getByRole('dialog', { name: 'Edit task' });
const quickAdd = (page) => page.getByRole('textbox', { name: 'Add a task' });
const html = (page) => page.locator('html');

/** The painted colour mode, the stored preference, and that the two agree after a reload. */
async function expectTheme(page, mode, preference = mode) {
  await expect(html(page)).toHaveClass(new RegExp(`\\b${mode}\\b`));
  await expect(html(page)).not.toHaveClass(new RegExp(`\\b${mode === 'dark' ? 'light' : 'dark'}\\b`));
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe(preference);
}

async function openPalette(page) {
  await page.keyboard.press('Control+K');
  await expect(palette(page)).toBeVisible();
}

test.describe('palette commands', () => {
  test('"New task" puts the cursor in the quick add', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await openPalette(page);
    await palette(page).getByRole('option', { name: /^New task/ }).click();
    await expect(page).toHaveURL(/\/tasks$/);
    await expect(palette(page)).toHaveCount(0);
    await expect(quickAdd(page)).toBeFocused();
  });

  test('"Start a focus session" lands on a running timer', async ({ page }) => {
    await seed(page);
    await page.goto('/tasks');
    await openPalette(page);
    await page.keyboard.type('start a focus');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/focus$/);
    await expect(page.getByRole('button', { name: 'Pause timer' }).first()).toBeVisible();
  });

  test('"Settings" goes to Settings', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await openPalette(page);
    await palette(page).getByRole('option', { name: /^Settings/ }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(palette(page)).toHaveCount(0);
    await expect(page.getByRole('radiogroup', { name: 'Theme' })).toBeVisible();
  });

  test('a task result opens that task in the editor', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await openPalette(page);
    await page.keyboard.type('dentist');
    await palette(page).getByRole('option', { name: /^Book the dentist/ }).click();
    await expect(page).toHaveURL(/\/tasks$/);
    await expect(editor(page)).toBeVisible();
    await expect(editor(page).getByLabel('Title')).toHaveValue('Book the dentist');
  });
});

test.describe('theme', () => {
  test('the Settings buttons switch the theme and a reload keeps it', async ({ page }) => {
    await seed(page, { theme: 'light' });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/settings');
    const group = page.getByRole('radiogroup', { name: 'Theme' });

    await group.getByRole('radio', { name: 'Dark' }).click();
    await expectTheme(page, 'dark');
    await expect(group.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
    await page.reload();
    await expectTheme(page, 'dark');
    await expect(group.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');

    await group.getByRole('radio', { name: 'Light' }).click();
    await expectTheme(page, 'light');
    await page.reload();
    await expectTheme(page, 'light');

    await page.emulateMedia({ colorScheme: 'dark' });
    await group.getByRole('radio', { name: 'System' }).click();
    await expectTheme(page, 'dark', 'system');
    await page.reload();
    await expectTheme(page, 'dark', 'system');
    await expect(group.getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'true');
  });

  test('T cycles light, dark, system and each step survives a reload', async ({ page }) => {
    await seed(page, { theme: 'light' });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/tasks');
    await expectTheme(page, 'light');

    await page.keyboard.press('t');
    await expectTheme(page, 'dark');
    await page.reload();
    await expectTheme(page, 'dark');

    // System resolves to the emulated dark scheme.
    await page.keyboard.press('t');
    await expectTheme(page, 'dark', 'system');
    await page.reload();
    await expectTheme(page, 'dark', 'system');

    await page.keyboard.press('t');
    await expectTheme(page, 'light');
    await page.reload();
    await expectTheme(page, 'light');
  });

  test('the palette theme commands switch the theme and a reload keeps it', async ({ page }) => {
    await seed(page, { theme: 'light' });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    await openPalette(page);
    await page.keyboard.type('dark theme');
    await palette(page).getByRole('option', { name: /^Dark theme/ }).click();
    await expect(palette(page)).toHaveCount(0);
    await expectTheme(page, 'dark');
    await page.reload();
    await expectTheme(page, 'dark');

    await openPalette(page);
    await expect(palette(page).getByRole('option', { name: /^Dark theme/ })).toContainText('Current');
    await palette(page).getByRole('option', { name: /^Match system theme/ }).click();
    await expectTheme(page, 'light', 'system');
    await page.reload();
    await expectTheme(page, 'light', 'system');

    await openPalette(page);
    await palette(page).getByRole('option', { name: /^Light theme/ }).click();
    await expectTheme(page, 'light');
    await page.reload();
    await expectTheme(page, 'light');
  });

  test('System follows the OS colour scheme live', async ({ page }) => {
    await seed(page, { theme: 'system' });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expectTheme(page, 'light', 'system');

    await page.emulateMedia({ colorScheme: 'dark' });
    await expectTheme(page, 'dark', 'system');
    await page.emulateMedia({ colorScheme: 'light' });
    await expectTheme(page, 'light', 'system');

    // A fixed choice stops following it.
    await page.keyboard.press('t');
    await page.keyboard.press('t');
    await page.keyboard.press('t');
    await page.keyboard.press('t');
    await expectTheme(page, 'light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expectTheme(page, 'light');
  });
});

test.describe('notification settings', () => {
  test('the switches and "Remind me" are saved across a reload', async ({ page }) => {
    await seed(page);
    await page.goto('/settings');
    const box = (name) => page.getByRole('checkbox', { name });
    const reminder = page.getByRole('combobox', { name: 'Due date reminder' });

    for (const name of ['Enable notifications', 'Notification sound', 'Task notifications', 'Overdue tasks', 'Timer notifications']) {
      await expect(box(name)).toBeChecked();
    }
    await expect(reminder).toHaveText('1 day before');

    await reminder.click();
    await page.getByRole('option', { name: '1 week before' }).click();
    await expect(reminder).toHaveText('1 week before');
    await box('Notification sound').click();
    await box('Overdue tasks').click();
    await box('Timer notifications').click();
    await box('Enable notifications').click();

    await page.reload();
    await expect(box('Enable notifications')).not.toBeChecked();
    await expect(box('Notification sound')).not.toBeChecked();
    await expect(box('Task notifications')).toBeChecked();
    await expect(box('Overdue tasks')).not.toBeChecked();
    await expect(box('Timer notifications')).not.toBeChecked();
    await expect(reminder).toHaveText('1 week before');

    // Hiding the task rows and bringing them back keeps the chosen reminder.
    await box('Task notifications').click();
    await expect(reminder).toHaveCount(0);
    await page.reload();
    await expect(box('Task notifications')).not.toBeChecked();
    await expect(reminder).toHaveCount(0);
    await box('Task notifications').click();
    await expect(reminder).toHaveText('1 week before');
    await expect(box('Overdue tasks')).not.toBeChecked();
    await page.reload();
    await expect(box('Task notifications')).toBeChecked();
    await expect(reminder).toHaveText('1 week before');
  });
});

test.describe('single-key shortcuts', () => {
  test('N opens the quick add', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await page.keyboard.press('n');
    await expect(page).toHaveURL(/\/tasks$/);
    await expect(quickAdd(page)).toBeFocused();
  });

  test('T switches the theme', async ({ page }) => {
    await seed(page, { theme: 'light' });
    await page.goto('/');
    await page.keyboard.press('t');
    await expectTheme(page, 'dark');
  });

  for (const [key, path] of [['h', /\/$/], ['t', /\/tasks$/], ['f', /\/focus$/], ['s', /\/settings$/]]) {
    test(`G then ${key.toUpperCase()} navigates`, async ({ page }) => {
      await seed(page);
      await page.goto(key === 'h' ? '/help' : '/');
      await page.keyboard.press('g');
      await page.keyboard.press(key);
      await expect(page).toHaveURL(path);
      // The second key went to the chord, not to its own shortcut.
      await expectTheme(page, 'light');
    });
  }

  test('/ opens the palette and ? the shortcut sheet', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await page.keyboard.press('/');
    await expect(palette(page)).toBeVisible();
    await expect(palette(page).getByRole('combobox')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(palette(page)).toHaveCount(0);

    await page.keyboard.press('Shift+Slash');
    await expect(shortcutsSheet(page)).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test('none of them fire while typing in the quick add', async ({ page }) => {
    await seed(page, { theme: 'light' });
    await page.goto('/tasks');
    await quickAdd(page).click();
    await page.keyboard.type('ntgf/?gs');
    await expect(quickAdd(page)).toHaveValue('ntgf/?gs');
    await expect(page).toHaveURL(/\/tasks$/);
    await expectTheme(page, 'light');
    await expect(palette(page)).toHaveCount(0);
    await expect(shortcutsSheet(page)).toHaveCount(0);
  });

  test('none of them fire inside an open dialog', async ({ page }) => {
    await seed(page, { theme: 'light' });
    await page.goto('/tasks');
    // The row's actions only show on hover or focus, so reach it by keyboard.
    await page.getByRole('button', { name: 'Edit "Book the dentist"' }).focus();
    await page.keyboard.press('Enter');
    await expect(editor(page)).toBeVisible();
    await editor(page).getByRole('button', { name: 'Delete', exact: true }).focus();

    for (const key of ['n', 't', 'g', 'f', 'g', 's', '/', 'Shift+Slash']) await page.keyboard.press(key);

    await expect(page).toHaveURL(/\/tasks$/);
    await expectTheme(page, 'light');
    await expect(editor(page)).toBeVisible();
    await expect(palette(page)).toHaveCount(0);
    await expect(shortcutsSheet(page)).toHaveCount(0);

    // The same inside the shortcut sheet.
    await page.keyboard.press('Escape');
    await expect(editor(page)).toHaveCount(0);
    await page.keyboard.press('Shift+Slash');
    await expect(shortcutsSheet(page)).toBeVisible();
    for (const key of ['n', 't', 'g', 'h', '/']) await page.keyboard.press(key);
    await expect(page).toHaveURL(/\/tasks$/);
    await expectTheme(page, 'light');
    await expect(shortcutsSheet(page)).toBeVisible();
    await expect(palette(page)).toHaveCount(0);
  });
});

test.describe('dashboard figures', () => {
  test('match the seeded tasks and sessions', async ({ page }) => {
    // Pin "now" to noon of the day the seed was built for, so a run across
    // midnight cannot move a task between buckets.
    const noon = new Date();
    noon.setHours(12, 0, 0, 0);
    await page.clock.setFixedTime(noon);

    const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const today = key(noon);
    const monday = new Date(noon);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

    const open = TASKS.filter((t) => !t.completed);
    const overdue = open.filter((t) => t.dueDate && t.dueDate < today).length;
    const dueToday = open.filter((t) => t.dueDate === today).length;
    const done = TASKS.length - open.length;
    const doneThisWeek = TASKS.filter((t) => t.completed && new Date(t.completedAt) >= monday).length;
    const week = SESSIONS.filter((s) => s.type !== 'break' && new Date(s.date) >= monday);
    const minutes = Math.round(week.reduce((sum, s) => sum + s.duration, 0) / 60);
    const focus = minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`;
    const priority = { high: 0, medium: 1, low: 2 };
    const soon = open
      .filter((t) => t.dueDate)
      .sort((a, b) => (a.dueDate === b.dueDate ? priority[a.priority] - priority[b.priority] : a.dueDate < b.dueDate ? -1 : 1))
      .slice(0, 4)
      .map((t) => t.title);

    // Sanity check on the seed itself, so a change to helpers.js shows here.
    expect([open.length, overdue, dueToday, done, doneThisWeek]).toEqual([5, 1, 2, 1, 1]);
    expect(soon).toEqual([
      'Fix the flaky login test',
      'Draft the quarterly review',
      'Reply to the landlord about the heating',
      'Book the dentist',
    ]);

    await seed(page);
    await page.goto('/');

    const card = (label) => page.getByRole('link').filter({ has: page.getByText(label, { exact: true }) });
    await expect(card('Open tasks')).toContainText(String(open.length));
    await expect(card('Open tasks')).toContainText(`${dueToday} due today`);
    await expect(card('Overdue')).toContainText(`${overdue}`);
    await expect(card('Overdue')).toContainText('Late');
    await expect(card('Focus time')).toContainText(focus);
    await expect(card('Focus time')).toContainText(`${week.length} ${week.length === 1 ? 'session' : 'sessions'}`);
    await expect(card('Done')).toContainText(String(done));
    await expect(card('Done')).toContainText(`${doneThisWeek} this week`);

    const values = await Promise.all(
      ['Open tasks', 'Overdue', 'Focus time', 'Done'].map((l) => card(l).locator('p').nth(1).textContent())
    );
    expect(values.map((v) => v.trim())).toEqual([String(open.length), String(overdue), focus, String(done)]);

    await expect(page.getByText(`${dueToday} due today, ${overdue} overdue.`)).toBeVisible();

    const dueSoon = page.getByRole('region', { name: 'Due soon' }).getByRole('listitem');
    await expect(dueSoon).toHaveCount(soon.length);
    for (const [i, title] of soon.entries()) await expect(dueSoon.nth(i)).toContainText(title);
    await expect(dueSoon.nth(0)).toContainText('1 day late');
    await expect(dueSoon.nth(1)).toContainText('Today');
    await expect(dueSoon.nth(3)).toContainText('Tomorrow');
  });
});
