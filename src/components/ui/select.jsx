import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

const Select = React.forwardRef(({ className, children, value, onChange, ...props }, ref) => {
  return (
    <div className="relative group">
      <select
        ref={ref}
        value={value}
        onChange={onChange}
        className={cn(
          "flex h-11 w-full rounded-lg border-2 border-input bg-background px-4 py-2.5 text-base font-medium text-foreground ring-offset-background transition-all",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          "hover:border-primary/50 hover:bg-accent/50",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input disabled:hover:bg-background",
          "appearance-none cursor-pointer",
          "[&::-webkit-appearance]:none [&::-moz-appearance]:none",
          "[&::-ms-expand]:hidden",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-hover:text-foreground" />
      </div>
    </div>
  )
})
Select.displayName = "Select"

export { Select }
