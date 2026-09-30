import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';
import { notificationService } from '../../services/notificationService';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

const openPanel = () => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <NotificationCenter onClose={() => {}} />
      </MemoryRouter>
    );
  });
};

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(notificationService, 'playNotificationSound').mockImplementation(() => {});
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe('NotificationCenter', () => {
  it('shows a new notification while it is open, not half a minute later', () => {
    openPanel();
    expect(container.textContent).toContain('No notifications');

    act(() => {
      notificationService.createNotification('task', 'Task due today', 'Send the invoice is due today', null, {}, 'task:1:due-today:x');
    });

    expect(container.textContent).toContain('Send the invoice is due today');
  });

  it('follows a change made somewhere else in the app', () => {
    notificationService.createNotification('task', 'Task overdue', 'Book the dentist was due 1 day ago', null, {}, 'task:2:overdue:x');
    openPanel();
    expect(container.textContent).toContain('Mark all read');

    act(() => notificationService.markAllAsRead());
    expect(container.textContent).not.toContain('Mark all read');
  });
});
