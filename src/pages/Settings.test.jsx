import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

const { toast } = await import('sonner');
const { default: Settings } = await import('./Settings');
const { collectBackupData } = await import('../lib/backup');
const { localStorageService } = await import('../services/localStorage');

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

  it('leaves only the file on a Replace from a file of tasks, and counts what it brought', async () => {
    const own = {
      zephyr_tasks: JSON.stringify({ tasks: [T('old')] }),
      zephyr_focus_sessions: JSON.stringify([{ id: 's1' }, { id: 's2' }, { id: 's3' }]),
      zephyr_focus_streak: JSON.stringify({ count: 4, lastDate: '2026-10-20' }),
      zephyr_last_focus_session: JSON.stringify({ completedAt: '2026-10-20T09:00:00.000Z' }),
      zephyr_settings: JSON.stringify({ focusDuration: 50 }),
      zephyr_notes: '[]',
      focusTimerPresets: '[]',
      selectedFocusPreset: 'deep',
      theme: 'dark',
    };
    const device = {
      zephyr_last_backup: '2026-10-01T08:00:00.000Z',
      zephyr_storage_persist_asked: 'true',
      zephyr_timer_state: JSON.stringify({ isRunning: false }),
      gardenTheme: 'moss',
      'another-app': 'kept',
    };
    Object.entries({ ...own, ...device }).forEach(([key, value]) => localStorage.setItem(key, value));
    const tasks = JSON.stringify({ tasks: [T('a'), T('b')], cleared: [{ id: 'c', clearedAt: '2026-10-02T08:00:00.000Z' }] });

    open();
    await pick(backupText({ zephyr_tasks: tasks }));
    const fileColumn = [...document.querySelectorAll('[role="dialog"] tbody tr')].map((row) => row.lastElementChild.textContent);
    expect(fileColumn).toEqual(['2', '0']);
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    act(() => button('Replace', document.querySelector('[role="dialog"]')).click());

    expect(toast.success).toHaveBeenCalledWith('Restored', { description: '2 tasks.' });
    expect(collectBackupData()).toEqual({ zephyr_tasks: tasks });
    expect(localStorageService.getTasks().map((task) => task.id)).toEqual(['a', 'b']);
    expect(localStorageService.getFocusSessions()).toEqual([]);
    Object.entries(device).forEach(([key, value]) => expect(localStorage.getItem(key)).toBe(value));
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
