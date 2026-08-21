import { useEffect } from 'react';
import { toast } from 'sonner';
import { registerSW } from 'virtual:pwa-register';

/**
 * Register the service worker and offer the update rather than taking it.
 *
 * Zephyr is installable, so a session can be days old. Under the previous
 * `autoUpdate` the new worker claimed the page as soon as it was built, which
 * swaps the precache beneath a running app — a lazily-loaded route requested
 * after that points at a filename the new manifest no longer has. Here the new
 * worker waits, and a toast hands the choice to the person using it.
 *
 * `registerSW` resolves to a no-op outside a service-worker context (dev
 * without `devOptions`, or a browser that has none), so this is safe to call
 * unconditionally.
 */
export function usePwaUpdate() {
  useEffect(() => {
    let updateSW;

    const showUpdate = () => {
      toast('A new version of Zephyr is ready', {
        description: 'Reload to pick it up. Your data is untouched either way.',
        duration: Infinity,
        action: {
          label: 'Reload',
          // `true` tells the waiting worker to take over, then reloads.
          onClick: () => updateSW?.(true),
        },
        cancel: { label: 'Later', onClick: () => {} },
      });
    };

    try {
      updateSW = registerSW({ immediate: true, onNeedRefresh: showUpdate });
    } catch (error) {
      // A failed registration must never take the app down with it.
      console.error('Service worker registration failed:', error);
    }
  }, []);
}

export default usePwaUpdate;
