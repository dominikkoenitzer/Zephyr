import { cn } from '../../lib/utils';

/**
 * Standard page shell: a column the page header and its cards stack in.
 *
 * Deliberately not a scroll container (the window scrolls) and not a card:
 * the page's own cards are the surfaces. Width comes from `.page-width` on the
 * layout, so every route shares one column.
 */
function PageContainer({ children, className }) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col',
        className
      )}
    >
      {children}
    </div>
  );
}

export default PageContainer;
