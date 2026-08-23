import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import {
  m,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useReducedMotion,
} from "motion/react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "btn-glow inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background",
  {
    variants: {
      variant: {
        // Filled variants carry the sweep; it needs a solid surface to read against.
        default: "btn-shine bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        destructive: "btn-shine bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        secondary: "btn-shine bg-secondary/85 text-secondary-foreground shadow-sm hover:bg-secondary",
        // `outline` and `ghost` are 33 of the ~35 buttons in the app, so this is
        // the hover state that actually gets seen.
        outline:
          "border border-input/80 bg-background/70 backdrop-blur shadow-sm hover:border-primary/45 hover:bg-accent/60 hover:text-accent-foreground hover:shadow-md",
        ghost:
          "hover:bg-accent/70 hover:text-accent-foreground hover:shadow-sm",
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

// Loose enough to overshoot slightly on release, which is what makes it feel
// physical rather than like a CSS curve replaying.
const MAGNET_SPRING = { stiffness: 260, damping: 18, mass: 0.5 }
const PRESS_SPRING = { type: "spring", stiffness: 420, damping: 24, mass: 0.6 }

// Deliberately restrained: enough travel to feel responsive under the cursor,
// not enough to look like the button is dodging the pointer.
const PULL = 0.14
const MAX_PULL = 3

const clamp = (v, limit) => Math.max(-limit, Math.min(limit, v))

/**
 * Buttons here do three things on pointer input:
 *  - lean toward the cursor (magnetic), sprung so they drift back on exit
 *  - carry a highlight that tracks the pointer across the surface
 *  - compress hard on press
 *
 * Pointer position is held in motion values, not React state, so none of this
 * re-renders the tree — a button in a list can be swept over without cost.
 * All of it is skipped under `prefers-reduced-motion`.
 */
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }))

    const reduced = useReducedMotion()

    const pullX = useSpring(useMotionValue(0), MAGNET_SPRING)
    const pullY = useSpring(useMotionValue(0), MAGNET_SPRING)
    // Parked off-surface so the highlight is invisible until the pointer lands.
    const glowX = useMotionValue(-300)
    const glowY = useMotionValue(-300)
    const glowLeft = useMotionTemplate`${glowX}px`
    const glowTop = useMotionTemplate`${glowY}px`

    const handlePointerMove = React.useCallback(
      (event) => {
        if (reduced) return
        const rect = event.currentTarget.getBoundingClientRect()
        const offsetX = event.clientX - rect.left
        const offsetY = event.clientY - rect.top
        glowX.set(offsetX)
        glowY.set(offsetY)
        pullX.set(clamp((offsetX - rect.width / 2) * PULL, MAX_PULL))
        pullY.set(clamp((offsetY - rect.height / 2) * PULL, MAX_PULL))
      },
      [reduced, glowX, glowY, pullX, pullY]
    )

    const handlePointerLeave = React.useCallback(() => {
      // Park the highlight off-surface and let the magnet spring back.
      glowX.set(-300)
      glowY.set(-300)
      pullX.set(0)
      pullY.set(0)
    }, [glowX, glowY, pullX, pullY])

    // `asChild` hands rendering to the child element (usually a Link), so there
    // is no element of our own to drive. The CSS sweep still runs.
    if (asChild) {
      return (
        <Slot className={classes} ref={ref} {...props}>
          {children}
        </Slot>
      )
    }

    // Nudging inline text sideways reads as a glitch, not as feedback.
    const flat = variant === "link" || reduced

    return (
      <m.button
        className={classes}
        ref={ref}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={
          flat
            ? undefined
            : { x: pullX, y: pullY, "--glow-x": glowLeft, "--glow-y": glowTop }
        }
        whileHover={flat ? undefined : { scale: 1.02 }}
        whileTap={flat ? undefined : { scale: 0.97 }}
        transition={PRESS_SPRING}
        {...props}
      >
        {children}
      </m.button>
    )
  }
)
Button.displayName = "Button"

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants }
