import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import NotificationItem from './NotificationItem';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = (read) => {
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  const n = { id: 'n1', type: 'task', title: 'Pay rent', message: 'm', read, createdAt: new Date().toISOString() };
  act(() => root.render(<NotificationItem notification={n} onRead={vi.fn()} onDelete={vi.fn()} onClick={vi.fn()} />));
  return [...container.querySelectorAll('button')].find((b) => b.textContent.includes('Pay rent'));
};

describe('unread, said in words', () => {
  it('an unread notification says so in its title button name', () => {
    expect(render(false).textContent).toMatch(/^Unread[:,]? .*Pay rent/);
  });
  it('a read one does not', () => {
    expect(render(true).textContent).toBe('Pay rent');
  });
});
