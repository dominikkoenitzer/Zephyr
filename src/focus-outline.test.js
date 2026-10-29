import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Forced colours drop box-shadow rings and authored backgrounds, so focus and the active option have to come with an outline.
const src = dirname(fileURLToPath(import.meta.url));

const sources = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return sources(path);
    return /\.jsx$/.test(e.name) && !/\.test\.jsx$/.test(e.name) ? [path] : [];
  });

/** Every class string in the components, with the file and line it starts on. */
const classStrings = sources(src).flatMap((path) => {
  const text = readFileSync(path, 'utf8');
  return [...text.matchAll(/(['"`])((?:(?!\1)[^\\\n]|\\.)*)\1/g)].map((m) => ({
    where: `${relative(src, path).replace(/\\/g, '/')}:${text.slice(0, m.index).split('\n').length}`,
    classes: m[2],
  }));
});

const has = (classes, utility) => new RegExp(`(?:^|\\s)${utility}(?:\\s|$)`).test(classes);

describe('focus in forced colours', () => {
  it('pairs every focus ring with an outline forced colours can paint', () => {
    const bare = [];
    for (const { where, classes } of classStrings) {
      for (const variant of ['focus-visible', 'focus-within']) {
        if (!new RegExp(`(?:^|\\s)${variant}:ring-\\d`).test(classes)) continue;
        if (has(classes, `${variant}:outline-hidden`) || has(classes, `${variant}:outline-\\d`)) continue;
        bare.push(`${where} ${variant}`);
      }
    }
    expect(bare).toEqual([]);
  });

  it('outlines a highlighted select option', () => {
    const item = classStrings.find((s) => s.where.startsWith('components/ui/select.jsx') && has(s.classes, 'focus:bg-accent'));
    expect(item.classes).toMatch(/(?:^|\s)focus:outline-hidden(?:\s|$)/);
    expect(item.classes).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
  });

  it('outlines the active option of the command palette', () => {
    const active = classStrings.find(
      (s) => s.where.startsWith('components/CommandPalette/CommandPalette.jsx') && s.classes.startsWith('bg-accent text-accent-foreground')
    );
    expect(active.classes).toMatch(/(?:^|\s)forced-colors:outline-2(?:\s|$)/);
  });
});
