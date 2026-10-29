import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import TopBar from './TopBar';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/**
 * The notification panel stays open when the focus tabs on past it. An
 * Escape that drops an input method's composition in a field further down
 * must not close it and pull the focus to the bell.
 */
const COMPOSING = [
  ['isComposing', { isComposing: true }],
  ['keyCode 229', { keyCode: 229 }],
];

let container;
let root;

const press = (el, key, init = {}) =>
  act(() => el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })));

const bell = () => container.querySelector('button[aria-controls]');
const field = () => container.querySelector('input');

beforeEach(() => {
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <TopBar onSearchClick={() => {}} />
        <input aria-label="Add a task" />
      </MemoryRouter>
    );
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('TopBar notification panel', () => {
  it.each(COMPOSING)('stays open on an Escape marked by %s', (_, init) => {
    act(() => bell().click());
    field().focus();

    press(field(), 'Escape', init);
    expect(bell().getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(field());

    press(field(), 'Escape');
    expect(bell().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(bell());
  });
});
