import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Input } from './input';
import { Select, SelectTrigger, SelectValue } from './select';
import { CustomNumberInput } from './custom-number-input';
import { CalendarPicker } from './calendar-picker';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';

// jsdom draws nothing, so the ring's 3:1 contrast is worked out from its classes and the theme tokens.
const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'index.css'), 'utf8');

const tokens = (selector) => {
  const start = css.indexOf(`${selector} {`);
  const body = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries(
    [...body.matchAll(/--([a-z0-9-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/g)].map((m) => [m[1], [+m[2], +m[3], +m[4]]])
  );
};
const THEMES = { light: tokens(':root'), dark: tokens('.dark') };

const rgb = ([h, s, l]) => {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
};
const luminance = (c) =>
  c.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const over = (fg, bg, alpha) => fg.map((v, i) => v * alpha + bg[i] * (1 - alpha));

/** The keyboard focus ring a control shows: its colour token and opacity, from focus-visible or focus-within. */
const ringOf = (el) => {
  const classes = el.className.baseVal ?? el.className;
  const width = /(?:^|\s)focus-(?:visible|within):ring-([2-9])(?:\s|$)/.test(classes);
  const colour = classes.match(/(?:^|\s)focus-(?:visible|within):ring-([a-z-]+?)(?:\/(\d+))?(?=\s|$)/g);
  const last = colour
    ?.map((c) => c.trim().match(/ring-([a-z-]+?)(?:\/(\d+))?$/))
    .filter((m) => m && !['inset', 'offset'].includes(m[1]) && !m[1].startsWith('offset-'))
    .pop();
  return width && last ? { token: last[1], alpha: last[2] ? +last[2] / 100 : 1 } : null;
};

const ringContrast = (el, surfaces) => {
  const ring = ringOf(el);
  if (!ring) return 'no focus ring';
  const worst = [];
  for (const [theme, t] of Object.entries(THEMES)) {
    for (const surface of surfaces) {
      const bg = rgb(t[surface]);
      const k = contrast(over(rgb(t[ring.token]), bg, ring.alpha), bg);
      if (k < 3) worst.push(`${theme} ${ring.token}/${ring.alpha * 100} on ${surface} ${k.toFixed(2)}`);
    }
  }
  return worst;
};

let container;
let root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = (ui) => act(() => root.render(ui));
const PAGE = ['background', 'card', 'popover'];

describe('the keyboard focus ring', () => {
  it('shows on a text field', () => {
    render(<Input aria-label="Name" />);
    expect(ringContrast(container.querySelector('input'), PAGE)).toEqual([]);
  });

  it('shows on a select', () => {
    render(
      <Select value="a">
        <SelectTrigger aria-label="Reminder">
          <SelectValue />
        </SelectTrigger>
      </Select>
    );
    expect(ringContrast(container.querySelector('button'), PAGE)).toEqual([]);
  });

  it('shows on a number field', () => {
    render(<CustomNumberInput value={5} onChange={() => {}} min={1} max={60} />);
    expect(ringContrast(container.querySelector('input'), PAGE)).toEqual([]);
  });

  it('shows on the date picker', () => {
    render(<CalendarPicker value="" onChange={() => {}} />);
    expect(ringContrast(container.querySelector('[role="button"]'), PAGE)).toEqual([]);
  });

  it('shows on a question of the accordion', () => {
    render(
      <Accordion>
        <AccordionItem value="a">
          <AccordionTrigger value="a">Question</AccordionTrigger>
          <AccordionContent value="a">Answer</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    const trigger = container.querySelector('button');
    expect(ringContrast(trigger, PAGE)).toEqual([]);
    // The item clips its corners, so a ring drawn outside the trigger would be cut away.
    expect(trigger.closest('.overflow-hidden')).not.toBeNull();
    expect(trigger.className).toMatch(/(?:^|\s)focus-visible:ring-inset(?:\s|$)/);
  });
});
