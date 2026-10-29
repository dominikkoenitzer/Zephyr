function ErrorFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg rounded-3xl bg-card p-6 text-center shadow-(--shadow-card) sm:p-8">
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-foreground">Something went wrong</h1>
        <p className="mt-5 text-[15px] text-muted-foreground">
          Reloading the page usually clears it. Your tasks and sessions are still in this browser.
        </p>
      </div>
    </div>
  );
}

export default ErrorFallback;
