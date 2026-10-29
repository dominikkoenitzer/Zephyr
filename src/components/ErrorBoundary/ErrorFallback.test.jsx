import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import ErrorFallback from './ErrorFallback';

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

describe('the error screen', () => {
  it('keeps the exception text off the screen', () => {
    const error = new TypeError("Cannot read properties of undefined (reading 'title')");
    act(() => root.render(<ErrorFallback error={error} />));

    expect(container.textContent).not.toContain('Cannot read properties');
    expect(container.querySelector('pre')).toBeNull();
  });

  it('shows only its heading and sentence when a page fails', () => {
    act(() => root.render(<ErrorFallback error={{ message: 'Page not found or an unexpected error occurred.' }} />));

    expect(container.querySelector('h1')?.textContent).toBe('Something went wrong');
    expect(container.querySelector('p')?.textContent).toBe(
      'Reloading the page usually clears it. Your tasks and sessions are still in this browser.',
    );
    expect(container.querySelector('pre')).toBeNull();
  });
});
