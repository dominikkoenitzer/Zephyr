import { Toaster as SonnerToaster } from "sonner"

const Toaster = () => (
  <SonnerToaster
    richColors
    closeButton
    position="bottom-right"
    theme="system"
    toastOptions={{
      classNames: {
        toast: "bg-background text-foreground border border-border shadow-lg",
        title: "text-foreground",
        description: "text-muted-foreground",
        actionButton: "bg-primary text-primary-foreground",
        cancelButton: "bg-muted text-foreground",
      },
    }}
  />
)

export { Toaster }
