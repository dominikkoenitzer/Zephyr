import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Pause, Play, RotateCcw, SkipForward, X } from 'lucide-react';
import { WindLines } from '../ui/night-surface';
import SunDial from './SunDial';

const roundControl =
  'flex h-14 w-14 items-center justify-center rounded-full bg-hero-foreground/10 text-hero-foreground transition-colors hover:bg-hero-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun';

/**
 * The distraction-free view: the whole screen turns to night, with the sun
 * crossing the sky, the clock and the three controls, and the wind below.
 */
const FullScreenMode = ({
  timeLeft,
  isRunning,
  progress,
  sessionType,
  onToggle,
  onReset,
  onSkip,
  onExit,
  formatTime,
  preset,
  isBreak = false
}) => {
  const rootRef = useRef(null);

  // Everything behind the night goes inert while it is up, so Tab stays on
  // the three controls and the exit button instead of walking the page.
  useEffect(() => {
    const self = rootRef.current;
    const others = [...document.body.children].filter((el) => el !== self && !el.hasAttribute('inert'));
    others.forEach((el) => el.setAttribute('inert', ''));
    return () => others.forEach((el) => el.removeAttribute('inert'));
  }, []);

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Full screen timer"
      className="fixed inset-0 z-100 isolate flex flex-col items-center justify-center overflow-hidden bg-linear-to-br from-hero-from to-hero-to p-4 text-hero-foreground sm:p-8">
      <WindLines className="-z-10 max-h-72 opacity-80" />

      <button
        type="button"
        onClick={onExit}
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-hero-foreground/10 text-hero-foreground transition-colors hover:bg-hero-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun sm:right-6 sm:top-6"
        aria-label="Exit fullscreen"
        title="Exit fullscreen (Esc)"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex w-full max-w-4xl flex-col items-center justify-center space-y-8 sm:space-y-10">
        <div className="px-4 text-center">
          <h2 className="inline-flex items-center gap-2.5 rounded-full bg-hero-foreground/10 px-4 py-1.5 text-[15px] font-semibold">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: preset.color }} aria-hidden="true" />
            {sessionType.text}
          </h2>
        </div>

        <div className="w-full max-w-3xl">
          <SunDial progress={progress} isBreak={isBreak} running={isRunning}>
            <div className="text-[4rem] font-semibold leading-none tracking-[-0.04em] tabular-nums sm:text-[6rem] md:text-[7.5rem]">
              {formatTime(timeLeft)}
            </div>
          </SunDial>
        </div>

        <div className="flex items-center justify-center gap-5">
          <button type="button" onClick={onReset} aria-label="Reset timer" title="Reset (R)" className={roundControl}>
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            aria-label={isRunning ? 'Pause timer' : 'Start timer'}
            title={isRunning ? 'Pause (Space)' : 'Start (Space)'}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-hero-foreground text-hero-to shadow-lg transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sun/60"
          >
            {isRunning ? <Pause className="h-8 w-8" strokeWidth={2.5} /> : <Play className="ml-1 h-8 w-8" strokeWidth={2.5} />}
          </button>
          <button type="button" onClick={onSkip} aria-label="Skip session" title="Skip (S)" className={roundControl}>
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};


export default FullScreenMode;
