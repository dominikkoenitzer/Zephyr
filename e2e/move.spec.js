import { expect, test } from '@playwright/test';

const carried = (title) => {
  const data = {
    zephyr_tasks: JSON.stringify({ tasks: [{ id: 'carried', title, completed: false, subtasks: [], tags: [] }], lastUpdated: 1 }),
    theme: 'dark',
  };
  const text = JSON.stringify({ app: 'zephyr', version: 1, data });
  return `r${Buffer.from(text).toString('base64url')}`;
};

test.describe('data carried from the old host', () => {
  test('shows up in an empty browser, and the address is clean', async ({ page }) => {
    await page.goto(`/#move=${carried('Carried across')}`);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
    await page.waitForFunction(() => document.getElementById('root')?.childElementCount > 0);
    expect(page.url()).not.toContain('move=');

    await page.goto('/tasks');
    await expect(page.getByText('Carried across')).toBeVisible();
  });

  test('a link with no referrer adds nothing to a list that exists', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('theme', 'light'));
    await page.goto(`/help#move=${carried('Planted')}`);
    await page.waitForFunction(() => document.getElementById('root')?.childElementCount > 0);
    expect(page.url()).not.toContain('move=');
    expect(await page.evaluate(() => localStorage.getItem('zephyr_tasks'))).toBeNull();
  });
});

test.describe('the old host retiring its worker', () => {
  test('takes an open window to the new host with its data', async ({ context, page }) => {
    const newHome = /^https:\/\/zephyr\.[^/]+\//;
    await context.route(newHome, (route) => route.fulfill({ contentType: 'text/html', body: '' }));
    await page.goto('/');
    await page.evaluate(async () => {
      localStorage.setItem('theme', 'dark');
      await navigator.serviceWorker.ready;
      void navigator.serviceWorker.register('/sw.js');
    });
    await expect.poll(() => page.url(), { timeout: 19000 }).toMatch(newHome);
    expect(page.url()).toContain('#move=');
  });
});
