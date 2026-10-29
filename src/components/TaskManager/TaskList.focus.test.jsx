import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import TaskList from './TaskList';
import { localStorageService } from '../../services/localStorage';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  localStorageService.saveTasks([
    { id: 't1', title: 'Call the bank', completed: false, tags: ['home'], createdAt: '2026-10-27T08:00:00.000Z' },
    { id: 't2', title: 'Water the plants', completed: false, tags: [], createdAt: '2026-10-27T08:05:00.000Z' },
  ]);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/tasks']}>
        <TaskList />
      </MemoryRouter>
    );
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  act(() => root.unmount());
  container.remove();
});

const filterButtons = () => [...container.querySelectorAll('[role="group"] button[aria-pressed]')];

describe('TaskList by keyboard', () => {
  it('rings the quick add in the focus ring colour', () => {
    const pill = container.querySelector('input[aria-label="Add a task"]').parentElement;
    // The theme's ring token is the one measured to reach 3:1 on the page in both themes.
    expect(pill.className).toMatch(/(?:^|\s)focus-within:ring-ring(?:\s|$)/);
  });

  it('draws the filter focus ring inside the pill, where the scrolling row cannot clip it', () => {
    const buttons = filterButtons();
    expect(buttons.length).toBeGreaterThan(5);
    for (const button of buttons) {
      // A row that scrolls sideways clips anything drawn past its padding box.
      expect(button.className).not.toMatch(/(?:^|\s)focus-visible:ring-\d/);
      expect(button.className).toMatch(/(?:^|\s)focus-visible:outline-2(?:\s|$)/);
      expect(button.className).toMatch(/(?:^|\s)focus-visible:-outline-offset-2(?:\s|$)/);
      expect(button.className).toMatch(/(?:^|\s)focus-visible:outline-ring(?:\s|$)/);
    }
  });

  it('keeps the filter rows free of side padding, so Firefox scrolls a focused end pill into view', () => {
    const rows = [...new Set(filterButtons().map((button) => button.closest('.overflow-x-auto')))];
    expect(rows.length).toBe(2);
    for (const row of rows) expect(row.className).not.toMatch(/(?:^|\s)p[xlr]?-\d/);
  });

  it('keeps the counts on the filters that are not chosen at full strength', () => {
    const counts = filterButtons()
      .filter((button) => button.getAttribute('aria-pressed') === 'false')
      .flatMap((button) => [...button.querySelectorAll('span.tabular-nums')]);
    expect(counts.length).toBeGreaterThan(0);
    for (const count of counts) expect(count.className).not.toMatch(/(?:^|\s)opacity-/);
  });
});
