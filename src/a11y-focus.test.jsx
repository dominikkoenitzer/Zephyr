import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
const { default: Settings } = await import('./pages/Settings');
const { CustomNumberInput } = await import('./components/ui/custom-number-input');
const { CalendarPicker } = await import('./components/ui/calendar-picker');

let container; let root;
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); localStorage.clear(); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = (el) => act(() => root.render(el));
const press = (el, key) => act(() => { el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); });

describe('keyboard focus stays where the user is', () => {
  it('the theme radios are one tab stop and the arrows move the choice', () => {
    render(<MemoryRouter><Settings /></MemoryRouter>);
    const radios = [...container.querySelectorAll('[role="radiogroup"][aria-label="Theme"] [role="radio"]')];
    expect(radios.filter((r) => r.tabIndex === 0)).toHaveLength(1);
    const first = radios.find((r) => r.tabIndex === 0);
    act(() => first.focus());
    press(first, 'ArrowRight');
    const now = document.activeElement;
    expect(now).not.toBe(first);
    expect(now.getAttribute('role')).toBe('radio');
    expect(now.getAttribute('aria-checked')).toBe('true');
  });

  it('a stepper at its limit keeps focus instead of disabling under it', () => {
    render(<CustomNumberInput value={2} min={1} max={3} label="Rounds" onChange={() => {}} />);
    const down = container.querySelector('[aria-label="Decrease Rounds"]');
    act(() => down.focus());
    act(() => down.click());
    expect(down.getAttribute('aria-disabled')).toBe('true');
    expect(down.disabled).toBe(false);
    expect(document.activeElement).toBe(down);
  });

  it('a button that only says it is disabled shows no hover tint, only the not-allowed cursor', () => {
    render(<CustomNumberInput value={1} min={1} max={3} label="Rounds" onChange={() => {}} />);
    const down = container.querySelector('[aria-label="Decrease Rounds"]');
    const cls = down.className.split(/\s+/);
    expect(cls).toContain('aria-disabled:cursor-not-allowed');
    // the resting look of an outline button, put back for hover while aria-disabled
    expect(cls).toEqual(expect.arrayContaining(['aria-disabled:hover:bg-card', 'aria-disabled:hover:border-foreground/15']));
  });

  it('clearing a date leaves focus on the date field', () => {
    function Controlled() { const [v, setV] = React.useState('2026-12-01'); return <CalendarPicker value={v} onChange={(e) => setV(e.target.value)} />; }
    render(<Controlled />);
    const clear = container.querySelector('[aria-label="Clear selected date"]');
    act(() => clear.focus());
    act(() => clear.click());
    expect(container.querySelector('[aria-label="Clear selected date"]')).toBeNull();
    expect(container.contains(document.activeElement)).toBe(true);
    expect(document.activeElement.getAttribute('aria-haspopup')).toBe('dialog');
  });
});
