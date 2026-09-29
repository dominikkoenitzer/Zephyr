import { useId } from 'react';
import { cn } from '../../lib/utils';

/**
 * The timer as a day passing: a sun rises at the left end of the horizon,
 * arcs over and sets at the right as the session runs out. Breaks get a moon.
 *
 * The body rides a group that rotates around the horizon's centre, so moving
 * it is one CSS transform and the one-second ticks glide instead of jumping.
 * Children (the clock) sit inside the dome.
 */
function SunDial({ progress = 0, isBreak = false, className, children }) {
  const id = useId();
  const p = Math.min(100, Math.max(0, progress));
  const angle = (p / 100) * 180;
  const body = isBreak ? 'hsl(var(--hero-foreground))' : 'hsl(var(--sun))';

  return (
    <div className={cn('relative w-full', className)}>
      <svg viewBox="0 0 400 226" className="block w-full overflow-visible" aria-hidden="true">
        <defs>
          <mask id={`${id}-crescent`}>
            <rect x="0" y="0" width="400" height="226" fill="white" />
            <circle cx="37" cy="194" r="11" fill="black" />
          </mask>
          <radialGradient id={`${id}-glow`}>
            <stop offset="0" stopColor={body} stopOpacity="0.55" />
            <stop offset="1" stopColor={body} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* The path the sun will take, and the part it has already travelled */}
        <path
          d="M 30 200 A 170 170 0 0 1 370 200"
          fill="none"
          stroke="hsl(var(--hero-foreground))"
          strokeOpacity="0.16"
          strokeWidth="2"
          strokeDasharray="2 9"
          strokeLinecap="round"
        />
        <path
          d="M 30 200 A 170 170 0 0 1 370 200"
          fill="none"
          stroke={body}
          strokeWidth="3"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={`${p} 100`}
          style={{ transition: 'stroke-dasharray 1s linear' }}
        />

        {/* The horizon */}
        <path d="M 8 200 H 392" stroke="hsl(var(--hero-foreground))" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
        <path d="M 120 216 H 280" stroke="hsl(var(--hero-foreground))" strokeOpacity="0.18" strokeWidth="2" strokeLinecap="round" />

        {/* The sun, or the moon on a break */}
        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: '200px 200px',
            transformBox: 'view-box',
            transition: 'transform 1s linear',
          }}
        >
          <circle cx="30" cy="200" r="34" fill={`url(#${id}-glow)`} />
          <circle cx="30" cy="200" r="13" fill={body} mask={isBreak ? `url(#${id}-crescent)` : undefined} />
        </g>
      </svg>

      {children && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[16%] flex flex-col items-center">{children}</div>
      )}
    </div>
  );
}

export default SunDial;
