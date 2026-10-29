import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));
vi.mock('../../services/notificationService', () => ({
  notificationService: { createNotification: vi.fn(), playChime: vi.fn(), showOsNotification: vi.fn() },
}));

const { default: PomodoroTimer } = await import('./PomodoroTimer');
const { localStorageService } = await import('../../services/localStorage');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

const mount = () => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/focus']}>
        <PomodoroTimer />
      </MemoryRouter>
    );
  });
};

const figures = () => [...container.querySelectorAll('[aria-labelledby="today-title"] dd')].map((d) => d.textContent);
const atRisk = () => container.querySelector('[aria-labelledby="today-title"] p')?.textContent ?? null;

describe('PomodoroTimer', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30, 23, 59));
    localStorageService.saveFocusSessions([
      { date: new Date(2026, 8, 30, 22, 0).toISOString(), duration: 1500, type: 'work', task: null },
    ]);
    localStorageService.saveFocusStreak({ count: 3, lastDate: new Date(2026, 8, 30).toDateString() });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it("moves today's figures and the streak note to the new day at midnight on an idle page", () => {
    mount();
    expect(figures()).toEqual(['1', '25', '3']);
    expect(atRisk()).toBeNull();

    act(() => vi.advanceTimersByTime(2 * 60 * 1000));

    expect(figures()).toEqual(['0', '0', '3']);
    expect(atRisk()).toBe('Finish a session today to keep your 3-day streak.');
  });
});
