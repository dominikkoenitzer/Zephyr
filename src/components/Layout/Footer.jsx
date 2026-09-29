import { Link } from 'react-router-dom';

// One quiet row at the end of every page. It gives each route a crawlable link
// surface (the sidebar is hidden on phones, where Googlebot crawls) and one
// line saying what the app is. On phones it clears the floating nav.
function Footer() {
  return (
    <footer className="shrink-0 px-responsive pb-28 lg:pb-6 lg:pl-3">
      <div className="page-width flex flex-col gap-2 pt-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Zephyr, a local-first to-do list and focus timer. No account; your data stays in your browser.</p>
        <nav aria-label="Footer" className="flex items-center gap-4">
          <Link className="transition-colors hover:text-foreground" to="/help">
            Help
          </Link>
          <Link className="transition-colors hover:text-foreground" to="/privacy">
            Privacy
          </Link>
          <Link className="transition-colors hover:text-foreground" to="/terms">
            Terms
          </Link>
          <a
            className="transition-colors hover:text-foreground"
            href="https://github.com/dominikkoenitzer/Zephyr"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
