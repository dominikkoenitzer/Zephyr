import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CalendarPicker } from './calendar-picker';

/**
 * The picker is controlled the way TaskList controls it: the parent owns the
 * value and only ever learns about a change through onChange. Anything that
 * goes wrong between clicking a day and the parent's value shows up here.
 */
function Controlled({ initial = '', seen }) {
  const [value, setValue] = React.useState(initial);
  return (
    <CalendarPicker
      value={value}
      onChange={(e) => {
        seen.push(e.target.value);
        setValue(e.target.value);
      }}
    />
  );
}

let container;
let root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = (ui) => act(() => root.render(ui));
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const press = (el, key) =>
  act(() => el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })));
const trigger = () => container.querySelector('[role="button"]');
const label = () => trigger().querySelector('span').textContent;
const panel = () => document.querySelector('.fixed.z-50');
const dayButton = (text) =>
  [...panel().querySelectorAll('button')].find((b) => b.textContent.trim() === String(text));
const nav = (ariaLabel) => panel().querySelector(`button[aria-label="${ariaLabel}"]`);
// The nav buttons carry `font-semibold` too and hold only an icon, so match
// the heading by its content rather than by class.
const monthHeading = () =>
  [...panel().querySelectorAll('div')]
    .map((d) => d.textContent.trim())
    .find((t) => /^[A-Z][a-z]+ [0-9]{4}$/.test(t));

describe('CalendarPicker', () => {
  it('reports the day that was clicked in the current month', () => {
    const seen = [];
    render(<Controlled initial="2026-08-10" seen={seen} />);
    click(trigger());
    click(dayButton(14));
    expect(seen).toEqual(['2026-08-14']);
    expect(label()).toBe('Aug 14');
  });

  it('reports the day that was clicked after paging to another month', () => {
    const seen = [];
    render(<Controlled initial="2026-08-10" seen={seen} />);
    click(trigger());
    click(nav('Next month'));
    expect(monthHeading()).toBe('September 2026');
    click(dayButton(15));
    expect(seen).toEqual(['2026-09-15']);
  });

  it('changes the day twice in a row without losing the second change', () => {
    const seen = [];
    render(<Controlled initial="2026-08-10" seen={seen} />);
    click(trigger());
    click(dayButton(14));
    click(trigger());
    click(dayButton(20));
    expect(seen).toEqual(['2026-08-14', '2026-08-20']);
    expect(label()).toBe('Aug 20');
  });

  it('reopens on the month of the value it is showing, not on today', () => {
    const seen = [];
    render(<Controlled initial="2026-12-03" seen={seen} />);
    click(trigger());
    expect(monthHeading()).toBe('December 2026');
  });

  it('reopens from the keyboard on the month of its value, with the focus on that day', () => {
    const seen = [];
    render(<Controlled initial="2026-12-03" seen={seen} />);
    press(trigger(), 'Enter');
    click(nav('Next month'));
    click(nav('Next month'));
    expect(monthHeading()).toBe('February 2027');
    press(document.activeElement, 'Escape');
    expect(panel()).toBeNull();

    press(trigger(), 'Enter');
    expect(monthHeading()).toBe('December 2026');
    expect(document.activeElement).toBe(dayButton(3));
  });

  it('reopens from the keyboard on this month, with the focus on today, when it has no value', () => {
    const seen = [];
    const today = new Date();
    render(<Controlled seen={seen} />);
    press(trigger(), ' ');
    click(nav('Previous month'));
    click(nav('Previous month'));
    press(document.activeElement, 'Escape');

    press(trigger(), ' ');
    expect(monthHeading()).toBe(`${today.toLocaleDateString('en-US', { month: 'long' })} ${today.getFullYear()}`);
    expect(document.activeElement.getAttribute('aria-current')).toBe('date');
  });

  it('starts empty and takes a first date', () => {
    const seen = [];
    render(<Controlled seen={seen} />);
    expect(label()).toBe('Select date');
    click(trigger());
    click(dayButton(1));
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatch(/^\d{4}-\d{2}-01$/);
  });
});
