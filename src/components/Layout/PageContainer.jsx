import { cn } from '../../lib/utils';

/**
 * Standard page shell — a centered content column with consistent scroll
 * behavior. Deliberately NOT a card: content sits directly on the aurora
 * background and individual Cards provide the surfaces. `panel-stack` lays
 * children out as a vertical stack with the shared panel gap.
 */
function PageContainer({ children, className }) {
  return (
    <div
      className={cn(
        'w-full max-w-5xl mx-auto flex-1 min-h-0 panel-stack overflow-y-auto scrollbar-thin',
        className
      )}
    >
      {children}
    </div>
  );
}

export default PageContainer;
