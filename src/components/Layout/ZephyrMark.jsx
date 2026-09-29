import { useId } from 'react';

/**
 * The mark: dusk. An apricot sun half under the horizon on a square of night,
 * the end of the working day. The same drawing is rendered into every icon
 * size under public/, so this and the favicon never drift apart.
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
      <rect width="64" height="64" rx="16" fill={`url(#${id}-dusk)`} />
      <path d="M17 40 A 15 15 0 0 1 47 40 Z" fill="#F8A66C" />
      <g fill="none" strokeLinecap="round" strokeWidth="4.5">
        <path d="M12 40 H52" stroke="#F6F1E9" />
        <path d="M22 49 H42" stroke="#F6F1E9" strokeOpacity="0.5" />
      </g>
    </svg>
  );
}

export default ZephyrMark;
