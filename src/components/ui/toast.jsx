import { Toaster as SonnerToaster } from "sonner"

const Toaster = () => (
  <SonnerToaster
    richColors
    closeButton
    position="bottom-right"
    theme="system"
    toastOptions={{
      classNames: {
        toast: "!rounded-2xl !border-0 !bg-card !text-foreground !shadow-(--shadow-overlay)",
        title: "text-foreground",
        description: "text-muted-foreground",
        actionButton: "!rounded-full !bg-primary !px-3 !font-semibold !text-primary-foreground",
        cancelButton: "!rounded-full !bg-accent !text-foreground",
      },
    }}
  />
)

export { Toaster }
