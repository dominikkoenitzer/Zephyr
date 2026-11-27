import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));
vi.mock('../../services/notificationService', () => ({
  notificationService: { createNotification: vi.fn(), playChime: vi.fn(), showOsNotification: vi.fn() },
}));

const { default: PomodoroTimer } = await import('./PomodoroTimer');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

const button = (name) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === name);
const stored = () => JSON.parse(localStorage.getItem('focusTimerPresets') || '[]').map((p) => p.id);

describe('the preset dialog, closed any way', () => {
  beforeEach(() => {
    localStorage.clear();
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
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('Escape after New takes the unsaved preset back, as Cancel does', () => {
    act(() => button('New').click());
    expect(stored().some((id) => id.startsWith('custom-'))).toBe(true);
    const dialog = document.querySelector('[role="dialog"]');
    act(() => {
      dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(stored().some((id) => id.startsWith('custom-'))).toBe(false);
  });
});
