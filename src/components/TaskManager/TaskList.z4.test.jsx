import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
const { default: TaskList } = await import('./TaskList');
const { localStorageService } = await import('../../services/localStorage');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  localStorageService.saveTasks([
    { id: 't1', title: 'Open one', completed: false, createdAt: '2026-10-27T08:00:00.000Z' },
    { id: 't3', title: 'Done three', completed: true, completedAt: '2026-10-27T09:00:00.000Z', createdAt: '2026-10-27T08:10:00.000Z' },
    { id: 't4', title: 'Done four', completed: true, completedAt: '2026-10-27T09:05:00.000Z', createdAt: '2026-10-27T08:15:00.000Z' },
  ]);
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  act(() => { root.render(<MemoryRouter initialEntries={['/tasks']}><TaskList /></MemoryRouter>); });
});
afterEach(() => { vi.unstubAllGlobals(); act(() => root.unmount()); container.remove(); });

const byLabel = (label) => [...container.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === label);
const press = (el) => { act(() => el.focus()); act(() => el.click()); };

describe('the completed list by keyboard', () => {
  it('keeps focus in the list when a completed row goes', () => {
    const toggle = [...container.querySelectorAll('button[aria-expanded]')].find((b) => b.textContent.startsWith('Completed'));
    act(() => toggle.click());
    const first = byLabel('Mark "Done three" not complete') || byLabel('Mark "Done four" not complete');
    const other = first.getAttribute('aria-label').includes('three') ? 'Done four' : 'Done three';
    press(first);
    expect(document.activeElement.getAttribute('aria-label')).toBe(`Mark "${other}" not complete`);
    const last = byLabel(`Delete "${other}"`);
    press(last);
    expect(document.activeElement.tagName).toBe('INPUT');
    expect(container.contains(document.activeElement)).toBe(true);
  });
});
