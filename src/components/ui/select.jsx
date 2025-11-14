import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

const Select = React.forwardRef(({ className, children, value, onChange, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        value={value}
        onChange={onChange}
        className={cn(
          "flex h-11 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-10 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "[&::-webkit-appearance]:none [&::-moz-appearance]:none",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
  )
})
Select.displayName = "Select"

export { Select }

