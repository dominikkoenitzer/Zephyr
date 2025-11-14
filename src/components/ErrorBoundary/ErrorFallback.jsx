function ErrorFallback({ error }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-foreground mb-4">Something went wrong 😢</h1>
        <pre className="text-destructive text-sm bg-card p-4 rounded-md mb-4 max-w-lg overflow-auto">
          {error?.message || 'An unexpected error occurred'}
        </pre>
        <p className="text-muted-foreground">
          Please try refreshing the page or contact support if the problem persists.
        </p>
      </div>
    </div>
  );
}

export default ErrorFallback;

