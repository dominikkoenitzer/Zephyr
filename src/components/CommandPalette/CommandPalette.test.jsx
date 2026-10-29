import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import CommandPalette from './CommandPalette';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/**
 * While an input method composes, Enter picks a candidate and Escape drops the
 * composition. Neither may run a command or close the palette.
 */
const COMPOSING = [
  ['isComposing', { isComposing: true }],
  ['keyCode 229', { keyCode: 229 }],
];

let container;
let root;
let onNewTask;

function Palette() {
  const [open, setOpen] = React.useState(true);
  return <CommandPalette open={open} onOpenChange={setOpen} onShowShortcuts={() => {}} onNewTask={onNewTask} />;
}

const press = (el, key, init = {}) =>
  act(() => el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })));

const field = () => document.querySelector('input[role="combobox"]');

beforeEach(() => {
  localStorage.clear();
  onNewTask = vi.fn();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <Palette />
      </MemoryRouter>
    );
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('CommandPalette while an input method composes', () => {
  it.each(COMPOSING)('does not run the selected command on an Enter marked by %s', (_, init) => {
    press(field(), 'Enter', init);
    expect(onNewTask).not.toHaveBeenCalled();
    expect(field()).not.toBeNull();

    press(field(), 'Enter');
    expect(onNewTask).toHaveBeenCalledTimes(1);
  });

  it.each(COMPOSING)('stays open on an Escape marked by %s', (_, init) => {
    press(field(), 'Escape', init);
    expect(field()).not.toBeNull();

    press(field(), 'Escape');
    expect(field()).toBeNull();
  });
});
