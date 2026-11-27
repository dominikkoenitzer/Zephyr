import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';
import { notificationService } from '../../services/notificationService';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
beforeEach(() => {
  localStorage.clear();
  vi.spyOn(notificationService, 'playNotificationSound').mockImplementation(() => {});
  notificationService.createNotification('task', 'One', 'a', null, {}, 'k1');
  notificationService.createNotification('task', 'Two', 'b', null, {}, 'k2');
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  act(() => { root.render(<MemoryRouter><NotificationCenter onClose={() => {}} /></MemoryRouter>); });
});
afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });

const byLabel = (label) => [...container.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === label);
const press = (el) => { act(() => el.focus()); act(() => el.click()); };

describe('the bell panel by keyboard', () => {
  it('Mark all read leaves focus in the panel', () => {
    press(byLabel('Mark all read'));
    expect(byLabel('Mark all read')).toBeUndefined();
    expect(document.activeElement.getAttribute('aria-label')).toBe('Notification settings');
  });

  it('deleting a notification moves focus to the next one, then to settings', () => {
    const first = [...container.querySelectorAll('button')].find((b) => b.getAttribute('aria-label')?.startsWith('Delete notification'));
    press(first);
    expect(document.activeElement.getAttribute('aria-label')).toMatch(/^Delete notification: /);
    press(document.activeElement);
    expect(document.activeElement.getAttribute('aria-label')).toBe('Notification settings');
  });
});
