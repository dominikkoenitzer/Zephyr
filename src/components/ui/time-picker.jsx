import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "../../lib/utils"

const TimePicker = React.forwardRef(({ className, value = "", onChange, ...props }, ref) => {
  const normalized = React.useMemo(() => {
    if (!value) return ""
    const [h = "00", m = "00"] = value.split(":")
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }, [value])

  return (
    <div className="relative" ref={ref}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
        <Clock className="h-4 w-4" />
      </div>
      <input
        type="time"
        value={normalized}
        onChange={(e) => onChange?.(e)}
        className={cn(
          "flex h-11 w-full rounded-xl border border-border/70 bg-background/80 px-3 pl-10 pr-3 text-sm font-medium text-foreground shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "hover:border-primary/60",
          className
        )}
        {...props}
      />
    </div>
  )
})
TimePicker.displayName = "TimePicker"

export { TimePicker }
