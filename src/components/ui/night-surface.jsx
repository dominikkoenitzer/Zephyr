import { cn } from '../../lib/utils';

/**
 * The indigo night surface: the lead stat, the timer card and the sidebar card.
 *
 * Wind lines run through the lower half. They are the app's one ornament, drawn
 * as a few long curves that stretch with the card, faint white with a single
 * apricot line among them. Decoration only, so hidden from assistive tech.
 */
function WindLines({ className }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 200"
      preserveAspectRatio="none"
      className={cn('pointer-events-none absolute inset-x-0 bottom-0 h-3/4 w-full', className)}
      fill="none"
    >
      <path d="M-20 150 C 70 110, 150 185, 250 140 S 380 95, 430 120" stroke="white" strokeOpacity="0.10" strokeWidth="1.25" />
      <path d="M-20 172 C 90 135, 170 205, 270 160 S 390 120, 430 142" stroke="white" strokeOpacity="0.07" strokeWidth="1.25" />
      <path d="M-20 128 C 60 92, 140 160, 235 118 S 370 70, 430 96" stroke="hsl(var(--primary-soft))" strokeOpacity="0.55" strokeWidth="1.5" />
      <path d="M-20 106 C 80 76, 160 132, 250 98 S 380 52, 430 72" stroke="white" strokeOpacity="0.06" strokeWidth="1.25" />
      <path d="M-20 194 C 100 160, 190 222, 290 182 S 400 146, 430 164" stroke="white" strokeOpacity="0.05" strokeWidth="1.25" />
    </svg>
  );
}

function NightSurface({ as: Tag = 'div', className, children, ...props }) {
  return (
    <Tag
      className={cn(
        'relative isolate overflow-hidden rounded-3xl bg-linear-to-br from-hero-from to-hero-to text-hero-foreground',
        className
      )}
      {...props}
    >
      <WindLines className="-z-10" />
      {children}
    </Tag>
  );
}

export { NightSurface, WindLines };
