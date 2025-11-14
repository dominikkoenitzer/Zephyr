import * as React from "react"
import { Calendar } from "lucide-react"
import { cn } from "../../lib/utils"

const DatePicker = React.forwardRef(({ className, value, onChange, ...props }, ref) => {
  return (
    <div className="relative">
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
      <input
        type="date"
        ref={ref}
        value={value}
        onChange={onChange}
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-background pl-11 pr-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer",
          "[&::-webkit-datetime-edit]:text-foreground [&::-webkit-datetime-edit-fields-wrapper]:text-foreground",
          "[&::-webkit-datetime-edit-month-field]:text-foreground [&::-webkit-datetime-edit-day-field]:text-foreground [&::-webkit-datetime-edit-year-field]:text-foreground",
          className
        )}
        {...props}
      />
    </div>
  )
})
DatePicker.displayName = "DatePicker"

export { DatePicker }

