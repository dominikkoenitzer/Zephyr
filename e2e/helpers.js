// Shared set-up for the browser tests: a believable week of data, and the
// checks that run on every page.

const day = (offset, hour = 12, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};
const ymd = (offset) => day(offset).slice(0, 10);

export const TASKS = [
  { title: 'Draft the quarterly review', priority: 'high', dueDate: ymd(0), tags: ['work'] },
  { title: 'Reply to the landlord about the heating', priority: 'medium', dueDate: ymd(0), tags: ['home'] },
  { title: 'Book the dentist', priority: 'low', dueDate: ymd(1), tags: [] },
  { title: 'Fix the flaky login test', priority: 'high', dueDate: ymd(-1), tags: ['work'] },
  { title: 'Buy oat milk', priority: 'low', dueDate: null, tags: [] },
  { title: 'Send the invoice', priority: 'high', dueDate: ymd(-2), tags: ['work'], completed: true, completedAt: day(0, 9) },
].map((t, i) => ({ id: `task-${i}`, createdAt: day(-5, 9), completed: false, subtasks: [], description: '', ...t }));

export const SESSIONS = [0, -1, -1, -2].map((d, i) => ({
  id: `session-${i}`,
  date: day(d, 9 + i),
  duration: 1500,
  type: 'work',
  task: i % 2 ? { id: 'task-0', title: 'Draft the quarterly review' } : null,
}));

/**
 * Seed storage once per test, before the app's first script runs. Guarded by
 * sessionStorage so a reload inside the test keeps what the test changed.
 */
export async function seed(page, { theme = 'light', tasks = TASKS, sessions = SESSIONS, extra = {} } = {}) {
  await page.addInitScript(
    ([t, s, th, more]) => {
      if (sessionStorage.getItem('e2e-seeded')) return;
      if (t) localStorage.setItem('zephyr_tasks', JSON.stringify({ tasks: t, lastUpdated: Date.now() }));
      if (s) localStorage.setItem('zephyr_focus_sessions', JSON.stringify(s));
      localStorage.setItem('theme', th);
      for (const [k, v] of Object.entries(more)) localStorage.setItem(k, v);
      sessionStorage.setItem('e2e-seeded', '1');
    },
    [tasks, sessions, theme, extra],
  );
}

/**
 * Wait until nothing on the page is still animating. A fixed pause was not
 * enough: axe once measured text half way through the page's fade-in and
 * reported a contrast failure that no one would ever see.
 */
export async function settle(page) {
  await page.evaluate(async () => {
    for (let i = 0; i < 5; i += 1) {
      const running = document.getAnimations().filter((a) => a.playState === 'running');
      if (!running.length) return;
      await Promise.all(running.map((a) => a.finished.catch(() => {})));
    }
  });
}

/** Collect page errors and console errors, minus the Vercel analytics a local preview cannot serve. */
export function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    if (/_vercel|Failed to load resource/.test(text)) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

/** Elements that stick out past the right edge, ignoring ones inside a sideways scroller. */
export function elementsPastTheEdge(page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const scrolls = (el) => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX;
        if (o === 'auto' || o === 'scroll' || o === 'hidden') return true;
      }
      return false;
    };
    return [...document.querySelectorAll('body *')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.right > vw + 1 && getComputedStyle(el).position !== 'fixed' && !scrolls(el);
      })
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)}`);
  });
}

/**
 * Painted colours that are green. The palette is stone, ink, apricot and
 * indigo; green only belongs to a timer preset the user picked, and those are
 * set through an inline style, so anything styled inline is left out.
 */
export function greenPaint(page) {
  return page.evaluate(() => {
    const parse = (value) => {
      const m = value.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
      return { r: r / 255, g: g / 255, b: b / 255, a };
    };
    const hsl = ({ r, g, b }) => {
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      const d = max - min;
      if (d === 0) return { h: 0, s: 0, l };
      const s = d / (1 - Math.abs(2 * l - 1));
      let h;
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      return { h: (h * 60 + 360) % 360, s, l };
    };
    const found = [];
    // Only an element that sets a colour in its own style attribute is left
    // out (a preset dot, the colour picker). Matching any ancestor with
    // "color" in its style skipped the whole page: <html> always carries
    // style="color-scheme: ...".
    const ownColour = (el) =>
      Boolean(el.style && (el.style.color || el.style.backgroundColor || el.style.borderColor || el.style.fill || el.style.stroke));
    for (const el of document.querySelectorAll('body *')) {
      if (ownColour(el)) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const cs = getComputedStyle(el);
      for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'fill', 'stroke']) {
        if (prop.startsWith('border') && cs.borderTopWidth === '0px') continue;
        const c = parse(cs[prop] || '');
        if (!c || c.a < 0.3) continue;
        const { h, s, l } = hsl(c);
        if (h >= 75 && h <= 165 && s > 0.25 && l > 0.12 && l < 0.92) {
          found.push(`${el.tagName.toLowerCase()}.${String(el.getAttribute("class") || "").slice(0, 40)} ${prop} ${cs[prop]}`);
        }
      }
      if (found.length >= 5) break;
    }
    return found;
  });
}
