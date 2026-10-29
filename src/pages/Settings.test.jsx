import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

const { toast } = await import('sonner');
const { default: Settings } = await import('./Settings');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

const open = () => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/settings']}>
        <Settings />
      </MemoryRouter>
    );
  });
};

const button = (name, scope = document.body) =>
  [...scope.querySelectorAll('button')].find((b) => b.textContent.trim() === name);

const T = (id) => ({ id, title: id, completed: false, createdAt: '2026-10-01T08:00:00.000Z' });
const backupText = (data) => JSON.stringify({ app: 'zephyr', version: 1, data });

/** Pick a file in the import field and wait for the dialog it opens. */
const pick = async (text) => {
  const input = container.querySelector('input[type="file"]');
  Object.defineProperty(input, 'files', { configurable: true, value: [new File([text], 'zephyr-backup.json', { type: 'application/json' })] });
  await act(async () => {
    input.dispatchEvent(new Event('change', { bubbles: true }));
    // FileReader reports on a later task.
    await new Promise((done) => setTimeout(done, 50));
  });
  expect(toast.error).not.toHaveBeenCalled();
  expect(document.querySelector('[role="dialog"]')).not.toBeNull();
};

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  act(() => root.unmount());
  container.remove();
});

describe('Settings, import', () => {
  it('names the tasks and sessions a Replace restored, not the stored keys', async () => {
    open();
    await pick(backupText({
      zephyr_tasks: JSON.stringify({ tasks: [T('a'), T('b')] }),
      zephyr_focus_sessions: JSON.stringify([{ id: 's1' }]),
      zephyr_settings: '{}',
      theme: 'dark',
    }));
    // The page reloads after the toast; jsdom cannot.
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    act(() => button('Replace', document.querySelector('[role="dialog"]')).click());
    expect(toast.success).toHaveBeenCalledWith('Restored', { description: '2 tasks, 1 session.' });
  });

  it('does not blame a good file when the browser refuses to store it', async () => {
    open();
    await pick(backupText({ zephyr_tasks: JSON.stringify({ tasks: [T('a')] }) }));
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    act(() => button('Merge', document.querySelector('[role="dialog"]')).click());
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Could not save that backup here, so nothing changed.');
  });
});

describe('Settings, delete all data', () => {
  it('says in plain words when the data could not be deleted', () => {
    localStorage.setItem('zephyr_tasks', JSON.stringify({ tasks: [T('a')] }));
    open();
    act(() => button('Delete', container).click());
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    act(() => button('Delete', document.querySelector('[role="dialog"]')).click());
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Could not delete all the data. Try again.');
  });
});
