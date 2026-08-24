/**
 * The masthead every route shares. Same emphasis as the home page: the title
 * is set larger and tighter than a dashboard usually allows, and nothing around
 * it competes: no rule, no eyebrow, no panel.
 */
function PageHeader({ title, description, actions }) {
  return (
    <header className="mb-12 flex flex-col gap-6 sm:mb-14 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="text-[2.5rem] font-semibold leading-[0.95] tracking-[-0.035em] text-foreground sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-xl text-base text-muted-foreground">{description}</p>
        )}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:shrink-0">{actions}</div>
      ) : null}
    </header>
  );
}

export default PageHeader;
