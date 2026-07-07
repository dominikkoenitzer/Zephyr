function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 sm:gap-4 mb-5 sm:mb-8">
      <div className="min-w-0">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-sm md:text-base text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
        )}
      </div>
      {actions ? <div className="w-full md:w-auto flex items-center gap-2 flex-wrap">{actions}</div> : null}
    </div>
  );
}

export default PageHeader;
