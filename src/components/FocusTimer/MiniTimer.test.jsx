import { act, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PipProvider } from './MiniTimer';
import { usePip } from './pip';

let pip;
const Probe = () => {
  const value = usePip();
  useEffect(() => {
    pip = value;
  });
  return null;
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
  delete window.documentPictureInPicture;
});

/** A stand-in for the little window, closed the way the browser closes it. */
const fakeWindow = () => {
  const listeners = [];
  return {
    document: document.implementation.createHTMLDocument('pip'),
    addEventListener: (type, fn) => type === 'pagehide' && listeners.push(fn),
    setInterval: () => 0,
    clearInterval: () => {},
    close: () => listeners.forEach((fn) => fn()),
  };
};

/** requestWindow that answers only when the test says so. */
const lateRequest = () => {
  const pending = [];
  const requestWindow = vi.fn(
    () =>
      new Promise((resolve, reject) => {
        pending.push({ resolve, reject });
      })
  );
  return { requestWindow, pending };
};

const renderProvider = () =>
  act(() =>
    root.render(
      <PipProvider>
        <Probe />
      </PipProvider>
    )
  );

describe('PipProvider', () => {
  it('asks for one window when a second click comes before the first one opens', async () => {
    const { requestWindow, pending } = lateRequest();
    window.documentPictureInPicture = { requestWindow };
    renderProvider();

    let first;
    let second;
    act(() => {
      first = pip.open();
      second = pip.open();
    });
    expect(requestWindow).toHaveBeenCalledTimes(1);

    const opened = fakeWindow();
    await act(async () => {
      pending.forEach(({ resolve }) => resolve(opened));
      await Promise.all([first, second]);
    });
    expect(pip.isOpen).toBe(true);

    act(() => opened.close());
    expect(pip.isOpen).toBe(false);

    await act(async () => {
      const again = pip.open();
      pending.at(-1).resolve(fakeWindow());
      await again;
    });
    expect(requestWindow).toHaveBeenCalledTimes(2);
    expect(pip.isOpen).toBe(true);
  });

  it('can ask again after the browser refused the window', async () => {
    const { requestWindow, pending } = lateRequest();
    window.documentPictureInPicture = { requestWindow };
    renderProvider();

    await act(async () => {
      const refused = pip.open();
      pending[0].reject(new DOMException('No user activation', 'NotAllowedError'));
      await refused.catch(() => {});
    });
    expect(pip.isOpen).toBe(false);

    act(() => {
      pip.open();
    });
    expect(requestWindow).toHaveBeenCalledTimes(2);
  });
});
