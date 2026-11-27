import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { toast } from 'sonner';
import FullScreenMode from './FullScreenMode';
import { Toaster } from '../ui/toast';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
afterEach(() => { act(() => root.unmount()); container.remove(); document.body.innerHTML = ''; });

describe('toasts in full screen', () => {
  it('stay usable while everything else behind the night is inert', async () => {
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    const noop = () => {};
    act(() => root.render(<>
      <Toaster />
      <FullScreenMode timeLeft={60} isRunning progress={10} sessionType="Focus" onToggle={noop} onReset={noop} onSkip={noop} onExit={noop}
        formatTime={(s) => String(s)} preset={{ name: 'P', color: 'bg-primary' }} />
    </>));
    await act(async () => { toast('Session complete', { action: { label: 'Mark done', onClick: noop } }); await new Promise((r) => setTimeout(r, 50)); });
    const button = [...document.querySelectorAll('button')].find((b) => b.textContent === 'Mark done');
    expect(button).toBeTruthy();
    expect(button.closest('[inert]')).toBeNull();
    expect(container.hasAttribute('inert')).toBe(true);
  });
});
