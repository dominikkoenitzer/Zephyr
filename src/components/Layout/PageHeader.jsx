/**
 * The head of every page: a large title with a line under it on the left, the
 * page's own actions as pills on the right.
 */
function PageHeader({ title, description, actions, as: Heading = 'h1' }) {
  return (
    <header className="mb-6 flex flex-col gap-5 pt-2 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <Heading className="text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground sm:text-[2.75rem]">
          {title}
        </Heading>
        {description && (
          <p className="mt-2 max-w-xl text-[15px] text-muted-foreground">{description}</p>
        )}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 md:shrink-0">{actions}</div>
      ) : null}
    </header>
  );
}

export default PageHeader;
