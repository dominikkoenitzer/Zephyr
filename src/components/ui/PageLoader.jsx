// At least a screen tall, so the footer waits below the fold while a page
// loads instead of showing at the bottom and jumping down when it arrives.
const PageLoader = () => (
  <div
    className="flex min-h-[calc(100dvh-var(--header-height))] flex-1 items-center justify-center py-24"
    role="status"
    aria-live="polite"
  >
    <div className="flex flex-col items-center gap-3">
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-muted border-t-primary"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground">Loading…</p>
      <span className="sr-only">Loading page</span>
    </div>
  </div>
)

export default PageLoader
