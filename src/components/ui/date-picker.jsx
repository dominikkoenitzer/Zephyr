import * as React from "react"
import { Calendar } from "lucide-react"
import { cn } from "../../lib/utils"

const DatePicker = React.forwardRef(({ className, value, onChange, ...props }, ref) => {
  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Select date'
    const date = new Date(dateString + 'T00:00:00')
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  const [displayValue, setDisplayValue] = React.useState(formatDisplayDate(value))
  const [isFocused, setIsFocused] = React.useState(false)

  React.useEffect(() => {
    setDisplayValue(formatDisplayDate(value))
  }, [value])

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    setDisplayValue(formatDisplayDate(value))
  }

  const handleChange = (e) => {
    onChange?.(e)
    setDisplayValue(formatDisplayDate(e.target.value))
  }

  return (
    <div className="relative">
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
      <div className="relative">
        {/* Display value overlay when not focused */}
        {!isFocused && value && (
          <div className="absolute left-11 top-1/2 -translate-y-1/2 text-foreground pointer-events-none z-10 text-base">
            {displayValue}
          </div>
        )}
        <input
          type="date"
          ref={ref}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            "flex h-11 w-full rounded-md border border-input bg-background pl-11 pr-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            // Hide native calendar picker icon
            "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer",
            // Style the date input text
            "[&::-webkit-datetime-edit]:text-transparent [&::-webkit-datetime-edit-fields-wrapper]:text-transparent",
            "[&::-webkit-datetime-edit-month-field]:text-transparent [&::-webkit-datetime-edit-day-field]:text-transparent [&::-webkit-datetime-edit-year-field]:text-transparent",
            // Show text when focused
            "focus:[&::-webkit-datetime-edit]:text-foreground focus:[&::-webkit-datetime-edit-fields-wrapper]:text-foreground",
            "focus:[&::-webkit-datetime-edit-month-field]:text-foreground focus:[&::-webkit-datetime-edit-day-field]:text-foreground focus:[&::-webkit-datetime-edit-year-field]:text-foreground",
            // Placeholder styling
            value ? "text-transparent" : "text-muted-foreground",
            className
          )}
          {...props}
        />
      </div>
    </div>
  )
})
DatePicker.displayName = "DatePicker"

export { DatePicker }
