import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { NightSurface } from '../components/ui/night-surface';
import usePageMeta from '../hooks/usePageMeta';
import { NOT_FOUND_META } from '../routes/meta';

// A real 404 page instead of a silent redirect to Home. Redirecting made every
// junk URL answer 200 with the home page, which search engines classify as a
// soft 404 and hold against the real pages. Vercel serves dist/404.html with a
// 404 status for unmatched paths; this renders into it.
const NotFound = () => {
  usePageMeta(NOT_FOUND_META);

  return (
    <section className="w-full flex-1 min-h-0 overflow-y-auto">
      <div className="page-width flex min-h-[60vh] items-center justify-center py-6 sm:py-10">
        <NightSurface className="w-full max-w-xl px-6 pb-24 pt-10 text-center sm:px-10 sm:pb-28 sm:pt-12">
          <p className="text-[5.5rem] font-semibold leading-none tracking-[-0.06em] tabular-nums sm:text-[7.5rem]">
            404
          </p>
          <h1 className="mt-4 text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[2.25rem]">
            Page not found
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[15px] text-hero-foreground/75">
            The link may be old, or the address may have a typo in it.
          </p>
          <Link
            to="/"
            className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-hero-to"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to the dashboard
          </Link>
        </NightSurface>
      </div>
    </section>
  );
};

export default NotFound;
