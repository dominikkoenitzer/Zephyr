import { Link } from 'react-router-dom';

// One quiet row at the end of the scroll area. It gives every page a
// crawlable link surface (TopBar's utility links are display:none on mobile,
// where Googlebot crawls) and one line saying what the app is.
function Footer() {
  return (
    <footer className="shrink-0 px-responsive pb-responsive">
      <div className="page-width flex flex-col gap-2 border-t border-border pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Zephyr, a local-first to-do list and Pomodoro focus timer. No account; your data stays in your browser.</p>
        <nav aria-label="Footer" className="flex items-center gap-4">
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
