import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import Help from './Help';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe('the FAQ by heading', () => {
  it('puts every question in a heading that holds its button, not the other way round', () => {
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    act(() => root.render(<MemoryRouter><Help /></MemoryRouter>));
    const triggers = [...container.querySelectorAll('button[aria-controls]')];
    expect(triggers.length).toBeGreaterThan(0);
    for (const button of triggers) {
      expect(button.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
      expect(button.parentElement.tagName).toBe('H3');
    }
  });
});
