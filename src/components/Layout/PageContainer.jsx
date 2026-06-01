import { cn } from '../../lib/utils';

/**
 * Standard page shell — one consistent card surface, padding, and scroll
 * behavior for every route. Pages render a <PageHeader> plus their content
 * inside it. `panel-stack` lays children out as a vertical stack with the
 * shared panel gap, so content with `flex-1` still fills the height.
 */
function PageContainer({ children, className }) {
  return (
    <div
      className={cn(
        'w-full flex-1 min-h-0 panel-stack border border-border/60 rounded-2xl bg-card/80 p-responsive overflow-y-auto scrollbar-thin',
        className
      )}
    >
      {children}
    </div>
  );
}

export default PageContainer;
