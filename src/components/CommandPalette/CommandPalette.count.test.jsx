import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import CommandPalette from './CommandPalette';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
function Palette() { const [open, setOpen] = React.useState(true); return <CommandPalette open={open} onOpenChange={setOpen} onShowShortcuts={() => {}} onNewTask={vi.fn()} />; }
beforeEach(() => { Element.prototype.scrollIntoView ??= () => {}; localStorage.clear(); container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); act(() => root.render(<MemoryRouter><Palette /></MemoryRouter>)); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

const field = () => document.querySelector('input[role="combobox"]');
const type = (text) => act(() => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(field(), text);
  field().dispatchEvent(new Event('input', { bubbles: true }));
});
const status = () => [...document.querySelectorAll('[role="status"]')].find((s) => !s.closest('[role="listbox"]'));

describe('the palette says how many it found', () => {
  it('announces the count, and no results, politely and outside the list', () => {
    type('theme');
    expect(status()?.getAttribute('aria-live') ?? 'polite').toBe('polite');
    expect(status()?.textContent).toMatch(/^\d+ results?$/);
    type('zzqqxx-nothing');
    expect(status()?.textContent).toMatch(/^No results/);
    const listbox = document.querySelector('[role="listbox"]');
    expect([...listbox.querySelectorAll('p')].every((p) => p.getAttribute('aria-hidden') === 'true' || p.closest('[role="group"]'))).toBe(true);
  });
});
