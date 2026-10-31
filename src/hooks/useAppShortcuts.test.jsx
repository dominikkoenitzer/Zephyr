import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useAppShortcuts } from './useAppShortcuts';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
let handlers;

const Harness = () => {
  useAppShortcuts(handlers);
  return null;
};

const press = (target, key) =>
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });

describe('useAppShortcuts', () => {
  beforeEach(() => {
    handlers = {
      onOpenPalette: vi.fn(),
      onOpenShortcuts: vi.fn(),
      onNewTask: vi.fn(),
      onToggleTheme: vi.fn(),
      onNavigate: vi.fn(),
    };
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<Harness />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('leaves letters to a closed select that has focus', () => {
    const trigger = document.createElement('button');
    trigger.setAttribute('role', 'combobox');
    container.appendChild(trigger);
    trigger.focus();

    press(trigger, 't');
    press(trigger, 'n');
    press(trigger, 'g');
    press(trigger, 's');

    expect(handlers.onToggleTheme).not.toHaveBeenCalled();
    expect(handlers.onNewTask).not.toHaveBeenCalled();
    expect(handlers.onNavigate).not.toHaveBeenCalled();
  });

  it('still acts on letters pressed on the page', () => {
    press(document.body, 't');
    press(document.body, 'n');

    expect(handlers.onToggleTheme).toHaveBeenCalledTimes(1);
    expect(handlers.onNewTask).toHaveBeenCalledTimes(1);
  });
});
