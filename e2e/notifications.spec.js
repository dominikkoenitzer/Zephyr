import { expect, test } from '@playwright/test';
import { seed } from './helpers';

const bell = (page) => page.getByRole('button', { name: /^Notifications/ });
const panel = (page) => page.locator('header').getByRole('heading', { name: 'Notifications' });

test.describe('the notification panel', () => {
  test('Escape closes it and hands focus back to the bell', async ({ page }) => {
    await seed(page);
    await page.goto('/tasks');
    await bell(page).click();
    await expect(panel(page)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(panel(page)).toHaveCount(0);
    await expect(bell(page)).toBeFocused();
  });

  test('the single-key shortcuts stand down while it is open', async ({ page }) => {
    await seed(page);
    await page.goto('/tasks');
    await bell(page).click();
    await expect(panel(page)).toBeVisible();

    await page.keyboard.press('t');
    await page.keyboard.press('n');
    await page.keyboard.press('g');
    await page.keyboard.press('f');

    await expect(page).toHaveURL(/\/tasks$/);
    await expect(page.locator('html')).toHaveClass(/\blight\b/);
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
    await expect(panel(page)).toBeVisible();
  });

  test('it closes when the route changes under it', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await page.keyboard.press('g');
    await page.keyboard.press('t');
    await expect(page).toHaveURL(/\/tasks$/);

    await bell(page).click();
    await expect(panel(page)).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(panel(page)).toHaveCount(0);
  });

  test("the timer's own keys stand down too while it is open", async ({ page }) => {
    await seed(page);
    await page.goto('/focus');
    await bell(page).click();
    await expect(panel(page)).toBeVisible();
    await page.keyboard.press('f');
    await expect(page.getByRole('dialog', { name: 'Full screen timer' })).toHaveCount(0);
  });

  test('the bell says whether the panel is open and which element it controls', async ({ page }) => {
    await seed(page);
    await page.goto('/tasks');
    await expect(bell(page)).toHaveAttribute('aria-expanded', 'false');

    await bell(page).click();
    await expect(bell(page)).toHaveAttribute('aria-expanded', 'true');
    const id = await bell(page).getAttribute('aria-controls');
    expect(id).toBeTruthy();
    await expect(page.locator(`[id="${id}"]`)).toContainText('Notifications');

    await bell(page).click();
    await expect(bell(page)).toHaveAttribute('aria-expanded', 'false');
  });
});
