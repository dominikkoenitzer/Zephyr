import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Dialog, DialogContent, DialogTitle } from './dialog';

/**
 * Our dialogs open from state, the way Settings opens the import dialog once
 * the file has been read. Closing one hands focus back to whatever held it,
 * and that must not move the page: WebKit can leave a clicked button
 * unfocused, so what held focus may be <main>, and focusing it with scrolling
 * jumped the page.
 */
function FromState({ open }) {
  return (
    <>
      <main tabIndex={-1}>
        <button type="button">Import</button>
      </main>
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Import backup</DialogTitle>
          <button type="button">Cancel</button>
        </DialogContent>
      </Dialog>
    </>
  );
}

let container;
let root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<FromState open={false} />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

// Radix hands focus back a task after the content unmounts.
const close = async () => {
  act(() => root.render(<FromState open={false} />));
  await act(() => new Promise((done) => setTimeout(done, 0)));
};

describe('DialogContent', () => {
  it.each([
    ['the button that opened it', () => container.querySelector('button')],
    ['main, where WebKit leaves focus after a click', () => container.querySelector('main')],
  ])('returns focus to %s without scrolling', async (_, opener) => {
    const el = opener();
    el.focus();
    const focus = vi.spyOn(el, 'focus');
    act(() => root.render(<FromState open />));
    expect(document.activeElement).not.toBe(el);
    await close();
    expect(document.activeElement).toBe(el);
    expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });
  });
});
