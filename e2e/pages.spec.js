import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { elementsPastTheEdge, greenPaint, seed, settle, watchErrors } from './helpers';

const ROUTES = ['/', '/tasks', '/focus', '/settings', '/help', '/privacy', '/terms'];
const SIZES = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
];

// Words that belong to the old app or to the explainer copy that was taken out.
const BANNED = [
  'Data Management',
  'Clear All Local Storage',
  'Good morning',
  'Good afternoon',
  'Good evening',
  'Cleared 0',
  'e.g.',
  'Email Sam',
  'Call mum',
];

for (const theme of ['light', 'dark']) {
  for (const size of SIZES) {
    test.describe(`${theme}, ${size.name}`, () => {
      test.use({ viewport: { width: size.width, height: size.height }, colorScheme: theme });

      for (const route of ROUTES) {
        test(`${route} renders clean`, async ({ page }) => {
          const errors = watchErrors(page);
          await seed(page, { theme });
          await page.goto(route);
          await expect(page.locator('main h1, main p.text-\\[2\\.25rem\\]').first()).toBeVisible();
          await settle(page);

          expect(errors, 'page or console errors').toEqual([]);
          expect(await elementsPastTheEdge(page), 'elements past the right edge').toEqual([]);
          expect(await greenPaint(page), 'green that is not the app palette').toEqual([]);

          const text = await page.locator('body').innerText();
          for (const phrase of BANNED) expect(text, `"${phrase}" on ${route}`).not.toContain(phrase);

          const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
          expect(
            axe.violations.map((v) => `${v.id}: ${v.nodes[0]?.target} ${JSON.stringify(v.nodes[0]?.any?.[0]?.data ?? '')}`),
            'accessibility',
          ).toEqual([]);
        });
      }
    });
  }
}

test('an unknown address shows the 404 with a way back', async ({ page }) => {
  await page.goto('/no-such-page');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: /back to the dashboard/i })).toBeVisible();
});

test('a first visit shows only what can be acted on', async ({ page }) => {
  await seed(page, { tasks: null, sessions: null });
  await page.goto('/');
  await expect(page.getByText('Nothing waiting')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Focus timer', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Progress' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Recent sessions' })).toHaveCount(0);
});
