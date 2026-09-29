import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, SkipForward, X } from 'lucide-react';
import { WindLines } from '../ui/night-surface';

const roundControl =
  'flex h-14 w-14 items-center justify-center rounded-full bg-hero-foreground/10 text-hero-foreground transition-colors hover:bg-hero-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft';

/**
 * The distraction-free view: the whole screen turns to night, with the ring,
 * the clock and the three controls, and the wind running along the bottom.
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
  preset
}) => {
  const fullScreenContainerRef = useRef(null);
  const [circumference, setCircumference] = useState(2 * Math.PI * 225);

  useEffect(() => {
    const updateCircumference = () => {
      if (fullScreenContainerRef.current) {
        const containerSize = fullScreenContainerRef.current.offsetWidth;
        // Radius is 45% of container
        const radius = containerSize * 0.45;
        setCircumference(2 * Math.PI * radius);
      }
    };

    updateCircumference();
    window.addEventListener('resize', updateCircumference);
    return () => window.removeEventListener('resize', updateCircumference);
  }, []);

  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-100 isolate flex flex-col items-center justify-center overflow-hidden bg-linear-to-br from-hero-from to-hero-to p-4 text-hero-foreground sm:p-8">
      <WindLines className="-z-10 max-h-72 opacity-80" />

      <button
        type="button"
        onClick={onExit}
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-hero-foreground/10 text-hero-foreground transition-colors hover:bg-hero-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft sm:right-6 sm:top-6"
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
          {preset.description && (
            <p className="mx-auto mt-4 max-w-xl text-sm text-hero-foreground/65">{preset.description}</p>
          )}
        </div>

        <div ref={fullScreenContainerRef} className="relative h-[280px] w-[280px] sm:h-[400px] sm:w-[400px] md:h-[480px] md:w-[480px]">
          <svg className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="12" fill="none" className="text-hero-foreground/10" />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              style={{
                color: preset.color,
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
                transition: 'stroke-dashoffset 1s ease-out'
              }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[4rem] font-semibold leading-none tracking-[-0.04em] tabular-nums sm:text-[6rem] md:text-[7.5rem]">
              {formatTime(timeLeft)}
            </div>
            <div className="mt-4 text-sm font-medium text-hero-foreground/65 sm:text-base">
              {Math.round(progress)}% through
            </div>
          </div>
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
            className="flex h-20 w-20 items-center justify-center rounded-full bg-hero-foreground text-hero-to shadow-lg transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-soft/60"
          >
            {isRunning ? <Pause className="h-8 w-8" strokeWidth={2.5} /> : <Play className="ml-1 h-8 w-8" strokeWidth={2.5} />}
          </button>
          <button type="button" onClick={onSkip} aria-label="Skip session" title="Skip (S)" className={roundControl}>
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};


export default FullScreenMode;
