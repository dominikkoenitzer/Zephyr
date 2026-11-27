import { createPortal } from "react-dom"
import { Toaster as SonnerToaster } from "sonner"
import { useTheme } from "../../hooks/useTheme"

const Toaster = () => {
  const { colorMode } = useTheme()
  // Straight under <body> and marked, so the full-screen timer, which makes
  // everything else inert, leaves the toasts (and their actions) usable.
  return createPortal(
    <div data-toaster-host="">
    <SonnerToaster
      // No richColors: it paints success green and error red onto the icon and
      // the close button, and green is not a colour this app has.
      closeButton
      position="bottom-right"
      // On phones the nav floats at the bottom; toasts sit above it.
      mobileOffset={{ bottom: '6rem' }}
      // The app's own mode, not the system's: they differ whenever the user
      // picked light or dark, and sonner's light description colour on a dark
      // card is unreadable.
      theme={colorMode}
      toastOptions={{
        classNames: {
          toast: "!rounded-2xl !border-0 !bg-card !text-foreground !shadow-(--shadow-overlay)",
          title: "text-foreground",
          description: "!text-muted-foreground",
          actionButton: "!rounded-full !bg-primary !px-3 !font-semibold !text-primary-foreground",
          cancelButton: "!rounded-full !bg-accent !text-foreground",
          closeButton: "!border-0 !bg-accent !text-muted-foreground hover:!text-foreground",
          icon: "!text-primary-strong",
        },
      }}
    />
    </div>,
    document.body
  )
}

export { Toaster }
