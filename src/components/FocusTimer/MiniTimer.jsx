import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pause, Play } from 'lucide-react';
import { localStorageService } from '../../services/localStorage';
import { useStoreValue } from '../../hooks/useStore';
import { timerSnapshot } from '../../lib/timer';
import { formatTime } from '../../lib/time';
import { WindLines } from '../ui/night-surface';
import { PipContext, pipSupported } from './pip';

const readTimer = () => localStorageService.getTimerState();

/** The opener's styles and theme, so the little window looks like the app. */
function mirrorDocument(pip) {
  for (const node of document.head.querySelectorAll('style, link[rel="stylesheet"]')) {
    pip.document.head.appendChild(node.cloneNode(true));
  }
  const sync = () => {
    pip.document.documentElement.className = document.documentElement.className;
    pip.document.documentElement.style.cssText = document.documentElement.style.cssText;
  };
  sync();
  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
  pip.addEventListener('pagehide', () => observer.disconnect());
}

/**
 * A floating mini timer in a picture-in-picture window, which stays on top of
 * whatever app you are working in. It lives in the shell, so it keeps
 * counting while you move between pages. Chromium browsers only; elsewhere
 * the button to open it never shows.
 *
 * Its clock ticks in the little window, which the browser does not throttle,
 * and nudges the app every second (`zephyr:tick`) so a session ends on time
 * even while the Zephyr tab sits in the background.
 */
export function PipProvider({ children }) {
  const [pipWindow, setPipWindow] = useState(null);
  const [controller, setController] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [state] = useStoreValue(readTimer);

  const close = useCallback(() => pipWindow?.close(), [pipWindow]);

  const open = useCallback(async () => {
    if (!pipSupported() || pipWindow) return;
    const pip = await window.documentPictureInPicture.requestWindow({ width: 300, height: 180 });
    mirrorDocument(pip);
    pip.document.title = 'Zephyr';
    pip.addEventListener('pagehide', () => setPipWindow(null));
    setPipWindow(pip);
  }, [pipWindow]);

  useEffect(() => {
    if (!pipWindow) return undefined;
    const id = pipWindow.setInterval(() => {
      setNow(Date.now());
      window.dispatchEvent(new Event('zephyr:tick'));
    }, 1000);
    return () => pipWindow.clearInterval(id);
  }, [pipWindow]);

  const value = useMemo(
    () => ({ supported: pipSupported(), isOpen: Boolean(pipWindow), open, close, setController }),
    [pipWindow, open, close]
  );

  return (
    <PipContext.Provider value={value}>
      {children}
      {pipWindow &&
        createPortal(
          <MiniTimer snapshot={timerSnapshot(state, now)} onToggle={controller?.toggle} />,
          pipWindow.document.body
        )}
    </PipContext.Provider>
  );
}

function MiniTimer({ snapshot, onToggle }) {
  const isBreak = Boolean(snapshot?.isBreak);
  const running = Boolean(snapshot?.running);
  const progress = snapshot?.progress || 0;
  const timeLeft = snapshot ? snapshot.timeLeft : 0;

  return (
    <div className="relative isolate flex h-dvh flex-col justify-center overflow-hidden bg-linear-to-br from-hero-from to-hero-to px-6 text-hero-foreground">
      <WindLines className="-z-10 max-h-24 opacity-70" />
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-hero-foreground/70">{isBreak ? 'Break' : 'Focus'}</p>
          <p className="mt-1 text-[2.75rem] font-semibold leading-none tracking-[-0.03em] tabular-nums">
            {formatTime(timeLeft)}
          </p>
        </div>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={running ? 'Pause timer' : 'Start timer'}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-hero-foreground text-hero-to transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun"
          >
            {running ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
          </button>
        )}
      </div>

      {/* The horizon, with the sun (or the moon on a break) on its way across */}
      <div className="relative mt-5 h-3" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-hero-foreground/25" />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_12px_hsl(var(--sun)/0.7)]"
          style={{ left: `${progress}%`, backgroundColor: isBreak ? 'hsl(var(--hero-foreground))' : 'hsl(var(--sun))' }}
        />
      </div>
    </div>
  );
}

export default PipProvider;
