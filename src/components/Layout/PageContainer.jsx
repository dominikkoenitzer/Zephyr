import { cn } from '../../lib/utils';

/**
 * Standard page shell — a centered content column with consistent scroll
 * behavior. Deliberately NOT a card: content sits directly on the page
 * background and individual Cards provide the surfaces. `panel-stack` lays
 * children out as a vertical stack with the shared panel gap.
 *
 * Width comes from `.page-width` so every route shares one column; do not
 * override it per page or the headings stop lining up.
 */
function PageContainer({ children, className }) {
  return (
    <div
      className={cn(
        'page-width flex-1 min-h-0 panel-stack overflow-y-auto scrollbar-thin',
        className
      )}
    >
      {children}
    </div>
  );
}

export default PageContainer;
