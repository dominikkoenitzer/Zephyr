import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
const { default: Settings } = await import('./Settings');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe('voice control can say what it sees', () => {
  it('every labelled control in a titled row has a name that starts with the title', () => {
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    act(() => root.render(<MemoryRouter><Settings /></MemoryRouter>));
    const bad = [];
    for (const h3 of container.querySelectorAll('h3')) {
      const row = h3.closest('div')?.parentElement?.parentElement;
      const control = row?.querySelector('[aria-label][role="checkbox"], button[aria-label][role="combobox"], [role="combobox"][aria-label]');
      if (!control) continue;
      const name = control.getAttribute('aria-label');
      if (!name.toLowerCase().startsWith(h3.textContent.trim().toLowerCase())) bad.push(`${h3.textContent} -> ${name}`);
    }
    expect(bad).toEqual([]);
  });
});
