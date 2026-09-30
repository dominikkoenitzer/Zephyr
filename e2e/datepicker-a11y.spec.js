import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { seed, settle } from './helpers';

const fullDate = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString(undefined, { dateStyle: 'full' });
};

// Open the task editor on a task due tomorrow, then open its date picker.
async function openPicker(page) {
  await page.goto('/tasks');
  await page.getByRole('button', { name: 'Book the dentist', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Edit task' });
  await expect(editor).toBeVisible();
  const trigger = page.locator('#edit-due-trigger');
  await trigger.click();
  const previous = page.getByRole('button', { name: 'Previous month' });
  await expect(previous).toBeVisible();
  // Tag the panel by its structure, so the checks find it whatever roles it carries.
  await previous.evaluate((el) => el.parentElement.parentElement.setAttribute('data-e2e-panel', ''));
  await settle(page);
  return { editor, trigger, panel: page.locator('[data-e2e-panel]') };
}

const contrast = async (page, selector) => {
  const result = await new AxeBuilder({ page }).include(selector).withRules(['color-contrast']).analyze();
  return result.violations.flatMap((v) => v.nodes.map((n) => `${n.target} ${n.any?.[0]?.data?.contrastRatio ?? ''}`));
};

test.describe('date picker', () => {
  test('Tab stays inside the open panel', async ({ page }) => {
    await seed(page);
    const { panel } = await openPicker(page);
    const today = panel.getByRole('button', { name: 'Today', exact: true });
    const previous = panel.getByRole('button', { name: 'Previous month' });

    await today.focus();
    await page.keyboard.press('Tab');
    await expect(previous).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(today).toBeFocused();

    // Escape still closes only the panel, not the editor around it.
    await page.keyboard.press('Escape');
    await expect(previous).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: 'Edit task' })).toBeVisible();
  });

  test('the trigger, the panel and the days say what they are', async ({ page }) => {
    await seed(page);
    await page.goto('/tasks');
    await page.getByRole('button', { name: 'Book the dentist', exact: true }).click();
    const trigger = page.locator('#edit-due-trigger');
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const panel = page.getByRole('dialog', { name: 'Choose a date' });
    await expect(panel).toBeVisible();

    const today = panel.getByRole('button', { name: fullDate(0), exact: true });
    await expect(today).toHaveAttribute('aria-current', 'date');
    const tomorrow = panel.getByRole('button', { name: fullDate(1), exact: true });
    await expect(tomorrow).toHaveAttribute('aria-pressed', 'true');
    await expect(today).toHaveAttribute('aria-pressed', 'false');
    await expect(tomorrow).not.toHaveAttribute('aria-current', /.*/);
  });

  test('light theme: the weekday row and the neighbouring days pass contrast', async ({ page }) => {
    await seed(page, { theme: 'light' });
    await openPicker(page);
    expect(await contrast(page, '[data-e2e-panel]')).toEqual([]);
  });

  test('dark theme: days from the neighbouring months pass contrast', async ({ page }) => {
    await seed(page, { theme: 'dark' });
    await openPicker(page);
    expect(await contrast(page, '[data-e2e-panel]')).toEqual([]);
  });
});

test.describe('undo toast', () => {
  // The app is dark while the system is light: the toast must follow the app.
  test.use({ colorScheme: 'light' });

  test('the description passes contrast in the dark theme', async ({ page }) => {
    await seed(page, { theme: 'dark' });
    await page.goto('/tasks');
    await page.getByRole('button', { name: 'Buy oat milk', exact: true }).hover();
    await page.getByRole('button', { name: 'Delete "Buy oat milk"' }).click();
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast.getByRole('button', { name: 'Undo' })).toBeVisible();
    await expect(toast.locator('[data-description]')).toBeVisible();
    await settle(page);
    expect(await contrast(page, '[data-sonner-toast]')).toEqual([]);
  });
});
