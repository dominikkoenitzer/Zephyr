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
  await cdp.send('Input.synthesizeScrollGesture', { x, y, yDistance: -240, gestureSourceType: 'touch', speed: 1200 });
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

  await toMiddle(page);
  const before = await topBar(page);
  await page.getByLabel('Import a Zephyr backup file').setInputFiles(backup);
  const dialog = page.getByRole('dialog', { name: 'Import backup' });
  await expect(dialog).toBeVisible();
  expect(await page.evaluate(([px, py]) => Boolean(document.elementFromPoint(px, py)?.closest('[data-dim]')), [x, y])).toBe(true);
  expect(await topBar(page)).toEqual(before);

  const moved = {};
  for (const key of ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'End', 'Home']) {
    await page.keyboard.press(key);
    await page.waitForTimeout(250);
    const now = await scrollTop(page);
    if (now !== middle) moved[key] = now - middle;
  }
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(250);
  if ((await scrollTop(page)) !== middle) moved.wheel = (await scrollTop(page)) - middle;
  await touchScroll(page, cdp, x, y);
  if ((await scrollTop(page)) !== middle) moved.touch = (await scrollTop(page)) - middle;

  await expect(dialog).toBeVisible();
  expect(moved).toEqual({});
  expect(await topBar(page)).toEqual(before);
});
