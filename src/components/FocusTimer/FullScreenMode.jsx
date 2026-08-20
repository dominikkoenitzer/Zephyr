import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, SkipForward, X } from 'lucide-react';
import { Button } from '../ui/button';

/** The distraction-free view: just the ring, the clock and the three controls. */
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
    <div className="fixed inset-0 z-100 bg-background flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onExit}
          className="h-8 w-8 sm:h-9 sm:w-9"
          aria-label="Exit fullscreen"
          title="Exit fullscreen"
        >
          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>
      
      <div className="flex flex-col items-center justify-center space-y-6 sm:space-y-8 md:space-y-12 max-w-4xl w-full">
        <div className="text-center px-4">
          <h2 
            className="text-xl sm:text-2xl md:text-3xl font-semibold mb-1 sm:mb-2"
            style={{ color: preset.color }}
          >
            {sessionType.text}
          </h2>
          {preset.description && (
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              {preset.description}
            </p>
          )}
        </div>

        <div ref={fullScreenContainerRef} className="relative w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px]">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              className="text-muted-foreground/25"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              stroke="currentColor"
              strokeWidth="4"
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
            <div 
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-mono font-light mb-2 sm:mb-3 tracking-tight"
              style={{ color: preset.color }}
            >
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm sm:text-base text-muted-foreground">
              {Math.round(progress)}%
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onToggle}
            aria-label={isRunning ? "Pause timer" : "Start timer"}
            title={isRunning ? "Pause timer" : "Start timer"}
            className={`
              h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20 rounded-full transition-all duration-300
              flex items-center justify-center relative
              ${isRunning 
                ? 'bg-foreground/10 hover:bg-foreground/15' 
                : 'hover:scale-105 active:scale-95'
              }
            `}
            style={isRunning ? {} : { backgroundColor: preset.color }}
          >
            {isRunning ? (
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 z-10">
                <div className="h-4 w-1 sm:h-5 sm:w-1.5 bg-foreground rounded-full" />
                <div className="h-4 w-1 sm:h-5 sm:w-1.5 bg-foreground rounded-full" />
              </div>
            ) : (
              <Play className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white ml-0.5 sm:ml-1 z-10" strokeWidth={2.5} />
            )}
          </button>
          
          <Button
            onClick={onReset}
            aria-label="Reset timer"
            variant="ghost"
            size="sm"
            className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
            <span className="hidden sm:inline">Reset</span>
          </Button>

          <Button
            onClick={onSkip}
            aria-label="Skip session"
            variant="ghost"
            size="sm"
            className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm text-muted-foreground hover:text-foreground"
          >
            <SkipForward className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
            <span className="hidden sm:inline">Skip</span>
          </Button>
        </div>
      </div>
    </div>
  );
};


export default FullScreenMode;
