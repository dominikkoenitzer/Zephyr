import { useId } from 'react';

/**
 * The mark: a square of dusk with three lines of west wind through it, the
 * middle one in apricot. The same drawing is rendered into every icon size
 * under public/, so this and the favicon never drift apart.
 */
function ZephyrMark({ size = 32, className }) {
  const id = useId();
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
    >
      <defs>
        <linearGradient id={`${id}-dusk`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#332E62" />
          <stop offset="1" stopColor="#110E24" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#${id}-dusk)`} />
      <g fill="none" strokeLinecap="round" strokeWidth="5">
        <path d="M15 23 C 24 17, 33 29, 45 22" stroke="#F6F1E9" />
        <path d="M15 35 C 26 28, 37 42, 50 33" stroke="#F8A66C" />
        <path d="M15 47 C 22 43, 29 50, 38 46" stroke="#F6F1E9" strokeOpacity="0.55" />
      </g>
    </svg>
  );
}

export default ZephyrMark;
