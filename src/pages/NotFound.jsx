import { Link } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';

// A real 404 page instead of a silent redirect to Home. Redirecting made every
// junk URL answer 200 with the home page, which search engines classify as a
// soft 404 and hold against the real pages.
const NotFound = () => {
  usePageMeta({
    title: 'Page not found | Zephyr',
    description: 'This page does not exist.',
    robots: 'noindex',
  });

  return (
    <section className="w-full flex-1 min-h-0 overflow-y-auto">
      <div className="page-width py-2 sm:py-4">
        <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          404
        </p>
        <h1 className="mt-3 text-[2.5rem] font-semibold leading-[0.95] tracking-[-0.035em] text-foreground sm:text-6xl lg:text-7xl">
          Page not found
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          The link may be old, or the address may have a typo in it.{' '}
          <Link to="/" className="text-foreground underline underline-offset-4">
            Back to Home
          </Link>
        </p>
      </div>
    </section>
  );
};

export default NotFound;
