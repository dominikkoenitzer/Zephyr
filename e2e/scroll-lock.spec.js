import { expect, test } from '@playwright/test';
import { seed } from './helpers';

// An open dialog holds the page behind it still. The wheel and touch were
// held already, the keyboard was not: with the root clipping overflow, the
// lock on <body> never reached the viewport, and arrows, Page Up and Home
// scrolled the page under the dim.

const backup = {
  name: 'zephyr-backup-other.json',
  mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify({
    app: 'zephyr',
    version: 1,
    data: { zephyr_tasks: JSON.stringify({ tasks: [], lastUpdated: Date.now() }), zephyr_focus_sessions: '[]', theme: 'light' },
  })),
};

const scrollTop = (page) => page.evaluate(() => Math.round(scrollY));
const toMiddle = (page) =>
  page.evaluate(() => {
    const y = Math.floor((document.documentElement.scrollHeight - innerHeight) / 2);
    scrollTo({ top: y, behavior: 'instant' });
    return Math.round(scrollY);
  });
const topBar = (page) =>
  page.evaluate(() => {
    const r = document.querySelector('header').getBoundingClientRect();
    return { top: Math.round(r.top), left: Math.round(r.left), width: Math.round(r.width) };
  });
const touchScroll = async (page, cdp, x, y) => {
  const at = (dy) => [{ x, y: y + dy }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(0) });
  for (let dy = 20; dy <= 240; dy += 20) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(dy) });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(300);
};

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test('the page behind an open dialog stays put for keys, wheel and touch', async ({ page }) => {
  await seed(page);
  await page.goto('/settings');
  await expect(page.getByRole('button', { name: 'Import', exact: true })).toBeVisible();
  const cdp = await page.context().newCDPSession(page);
  const x = 195;
  const y = 20;

  // The same inputs move the page while nothing is open, so a page that stays
  // put below is held by the lock and not by a page too short to move.
  const middle = await toMiddle(page);
  expect(middle).toBeGreaterThan(150);
  await page.mouse.move(x, y);
  await page.mouse.wheel(0, 120);
  await expect.poll(() => scrollTop(page)).not.toBe(middle);
  await toMiddle(page);
  await touchScroll(page, cdp, x, y);
  await expect.poll(() => scrollTop(page)).not.toBe(middle);
  await toMiddle(page);
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => scrollTop(page)).not.toBe(middle);
  // Chromium animates key scrolls; let the last one land before measuring.
  await page.waitForTimeout(500);

  await toMiddle(page);
  const before = await topBar(page);
  await page.getByLabel('Import a Zephyr backup file').setInputFiles(backup);
  const dialog = page.getByRole('dialog', { name: 'Import backup' });
  await expect(dialog).toBeVisible();
  expect(await page.evaluate(([px, py]) => Boolean(document.elementFromPoint(px, py)?.closest('[data-dim]')), [x, y])).toBe(true);
  expect(await topBar(page)).toEqual(before);

  // Each input starts from the middle and is measured from where it started,
  // so each one is measured on its own.
  const moved = {};
  const starts = {};
  const tries = [
    ...['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'End', 'Home'].map((key) => [key, () => page.keyboard.press(key)]),
    ['wheel', () => page.mouse.wheel(0, 120)],
    ['touch', () => touchScroll(page, cdp, x, y)],
  ];
  for (const [name, input] of tries) {
    const start = await toMiddle(page);
    await page.waitForTimeout(100);
    starts[name] = (await scrollTop(page)) - middle;
    await input();
    await page.waitForTimeout(250);
    const now = await scrollTop(page);
    if (now !== start) moved[name] = now - start;
  }

  await expect(dialog).toBeVisible();
  expect(moved, `start offsets ${JSON.stringify(starts)}`).toEqual({});
  expect(await topBar(page)).toEqual(before);
});
