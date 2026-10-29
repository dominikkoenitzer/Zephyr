import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// jsdom applies no media queries, so these read the rules the browser would get.
const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.css'), 'utf8');

/** The body of every block that opens with this prelude, braces balanced. */
const blocks = (prelude) => {
  const found = [];
  for (let at = css.indexOf(prelude); at !== -1; at = css.indexOf(prelude, at + 1)) {
    const open = css.indexOf('{', at);
    let depth = 0;
    for (let i = open; i < css.length; i++) {
      if (css[i] === '{') depth++;
      if (css[i] === '}' && --depth === 0) {
        found.push(css.slice(open + 1, i));
        break;
      }
    }
  }
  return found;
};

describe('the stylesheet', () => {
  it('scrolls a focused control clear of the sticky top bar', () => {
    const html = blocks('html {').join('\n');
    expect(html).toMatch(/scroll-padding-top:\s*calc\(var\(--header-height\)/);
  });

  it('scrolls a focused control clear of the floating nav below the desktop width', () => {
    // The nav is 3.75rem tall and floats 0.75rem or the safe area above the bottom edge.
    const narrow = blocks('@media (width < 1024px)').join('\n');
    expect(narrow).toMatch(/scroll-padding-bottom:\s*calc\(\s*5\.25rem \+ env\(safe-area-inset-bottom\)/);
  });

  it('stops smooth scrolling when reduced motion is asked for', () => {
    const reduce = blocks('@media (prefers-reduced-motion: reduce)').join('\n');
    expect(reduce).toMatch(/scroll-behavior:\s*auto\s*!important/);
  });
});
