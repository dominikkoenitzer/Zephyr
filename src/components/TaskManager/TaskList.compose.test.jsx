import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import TaskList from './TaskList';
import { localStorageService } from '../../services/localStorage';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/**
 * While an input method composes Japanese, Chinese or Korean text, Enter picks
 * a candidate and Escape drops the composition. Neither belongs to the page.
 * Browsers mark such keys with isComposing, or only with keyCode 229.
 */
const COMPOSING = [
  ['isComposing', { isComposing: true }],
  ['keyCode 229', { keyCode: 229 }],
];

let container;
let root;

const openList = (path = '/tasks') => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <TaskList />
      </MemoryRouter>
    );
  });
};

const type = (input, value) => {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  act(() => {
    setValue.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

const press = (el, key, init = {}) =>
  act(() => el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })));

const editTitle = () => document.getElementById('edit-task-title');

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});

afterEach(() => {
  vi.unstubAllGlobals();
  act(() => root.unmount());
  container.remove();
});

describe('TaskList while an input method composes', () => {
  it.each(COMPOSING)('does not save the edit on an Enter marked by %s', (_, init) => {
    const task = localStorageService.addTask({ title: 'Call the bank' });
    openList(`/tasks?task=${task.id}`);
    type(editTitle(), 'Call the bank at nine');

    press(editTitle(), 'Enter', init);
    expect(editTitle()?.value).toBe('Call the bank at nine');
    expect(localStorageService.getTasks()[0].title).toBe('Call the bank');

    press(editTitle(), 'Enter');
    expect(editTitle()).toBeNull();
    expect(localStorageService.getTasks()[0].title).toBe('Call the bank at nine');
  });

  it.each(COMPOSING)('keeps the edit dialog open on an Escape marked by %s', (_, init) => {
    const task = localStorageService.addTask({ title: 'Call the bank' });
    openList(`/tasks?task=${task.id}`);
    type(editTitle(), 'Call the bank at nine');

    press(editTitle(), 'Escape', init);
    expect(editTitle()?.value).toBe('Call the bank at nine');

    press(editTitle(), 'Escape');
    expect(editTitle()).toBeNull();
  });

  it.each(COMPOSING)('keeps the quick add text on an Escape marked by %s', (_, init) => {
    openList();
    const input = container.querySelector('input[aria-label="Add a task"]');
    type(input, 'Call the bank');

    press(input, 'Escape', init);
    expect(input.value).toBe('Call the bank');

    press(input, 'Escape');
    expect(input.value).toBe('');
  });
});
