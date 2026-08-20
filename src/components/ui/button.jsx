import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { m } from "motion/react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background",
  {
    variants: {
      variant: {
        default: "btn-shine bg-brand text-white shadow-brand hover:brightness-110",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input/80 bg-background/70 backdrop-blur shadow-sm hover:bg-accent/55 hover:text-accent-foreground",
        secondary: "bg-secondary/85 text-secondary-foreground shadow-sm hover:bg-secondary",
        ghost: "hover:bg-accent/55 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// A spring rather than a duration, so a fast double-tap keeps its momentum
// instead of restarting a fixed curve. `link` opts out — nudging inline text
// sideways reads as a glitch, not as feedback.
const PRESS_SPRING = { type: "spring", stiffness: 420, damping: 26, mass: 0.6 }

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }))

    // `asChild` hands rendering to whatever child is passed (usually a Link),
    // so motion has no element of its own to drive. The CSS shine still runs.
    if (asChild) {
      return <Slot className={classes} ref={ref} {...props} />
    }

    const flat = variant === "link"

    return (
      <m.button
        className={classes}
        ref={ref}
        whileHover={flat ? undefined : { y: -2, scale: 1.02 }}
        whileTap={flat ? undefined : { y: 0, scale: 0.96 }}
        transition={PRESS_SPRING}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants }
