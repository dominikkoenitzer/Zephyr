import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { localStorageService } from '../../services/localStorage';
import PomodoroTimer from './PomodoroTimer';

let container;
let root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  localStorageService.saveTasks([{ id: 't1', title: 'Water the plants', completed: false, createdAt: '2026-10-27T08:00:00.000Z' }]);
  localStorage.setItem(
    'focusTimerPresets',
    JSON.stringify([{ id: 'reading', name: 'Reading', color: 'hsl(var(--preset-blue))', workTime: 1200, shortBreak: 300, longBreak: 900 }])
  );
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <MemoryRouter initialEntries={['/focus']}>
        <PomodoroTimer />
      </MemoryRouter>
    )
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  localStorage.clear();
});

const focusRing = (el) => {
  const classes = el.className.split(/\s+/);
  const width = classes.find((c) => /^focus-visible:ring-[2-9]$/.test(c));
  const colour = classes.filter((c) => /^focus-visible:ring-(?!inset$|offset|[0-9]$)/.test(c)).pop();
  return width && colour ? colour.slice('focus-visible:ring-'.length) : null;
};

describe('the timer card by keyboard', () => {
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
