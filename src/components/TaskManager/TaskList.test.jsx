import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import TaskList from './TaskList';
import { localStorageService } from '../../services/localStorage';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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

const failWrites = () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('QuotaExceededError');
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
};

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  act(() => root.unmount());
  container.remove();
});

describe('TaskList when a save fails', () => {
  it('keeps the quick add text', () => {
    openList();
    const input = container.querySelector('input[aria-label="Add a task"]');
    type(input, 'Call the bank');
    failWrites();

    act(() => input.form.requestSubmit());

    expect(input.value).toBe('Call the bank');
    expect(localStorageService.getTasks()).toEqual([]);
  });

  it('keeps the editor open with the edited text', () => {
    const task = localStorageService.addTask({ title: 'Call the bank' });
    openList(`/tasks?task=${task.id}`);
    type(document.getElementById('edit-task-title'), 'Call the bank at nine');
    failWrites();

    const save = [...document.querySelectorAll('button')].find((b) => b.textContent === 'Save');
    act(() => save.click());

    expect(document.getElementById('edit-task-title')?.value).toBe('Call the bank at nine');
    expect(localStorageService.getTasks()[0].title).toBe('Call the bank');
  });
});
