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

const focusRing = (el) => {
  const classes = el.className.split(/\s+/);
  const width = classes.find((c) => /^focus-visible:ring-[2-9]$/.test(c));
  const colour = classes.filter((c) => /^focus-visible:ring-(?!inset$|offset|[0-9]$)/.test(c)).pop();
  return width && colour ? colour.slice('focus-visible:ring-'.length) : null;
};

describe('the timer card by keyboard', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorageService.saveTasks([{ id: 't1', title: 'Water the plants', completed: false, createdAt: '2026-10-27T08:00:00.000Z' }]);
    localStorage.setItem(
      'focusTimerPresets',
      JSON.stringify([{ id: 'reading', name: 'Reading', color: 'hsl(var(--preset-blue))', workTime: 1200, shortBreak: 300, longBreak: 900 }])
    );
    mount();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    localStorage.clear();
  });

  it('rings every button it shows when focused', () => {
    const missing = [...container.querySelectorAll('button')]
      .filter((button) => !focusRing(button))
      .map((button) => button.getAttribute('aria-label') || button.textContent.trim());
    expect(missing).toEqual([]);
  });

  it('rings the session task in the sun colour of the night surface', () => {
    expect(focusRing(container.querySelector('[aria-label="Task for this session"]'))).toBe('sun');
  });
});

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
