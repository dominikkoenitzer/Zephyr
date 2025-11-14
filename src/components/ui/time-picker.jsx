import * as React from "react"
import { Clock, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"

const TimePicker = React.forwardRef(({ className, value, onChange, ...props }, ref) => {
  const [hours, setHours] = React.useState(0)
  const [minutes, setMinutes] = React.useState(0)
  const [isFocused, setIsFocused] = React.useState(false)

  // Parse time value (HH:MM format)
  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(':')
      setHours(parseInt(h) || 0)
      setMinutes(parseInt(m) || 0)
    } else {
      setHours(0)
      setMinutes(0)
    }
  }, [value])

  const formatTime = (h, m) => {
    const hour = String(h).padStart(2, '0')
    const minute = String(m).padStart(2, '0')
    return `${hour}:${minute}`
  }

  const handleHoursChange = (newHours) => {
    const h = Math.max(0, Math.min(23, newHours))
    setHours(h)
    const newValue = formatTime(h, minutes)
    onChange?.({ target: { value: newValue } })
  }

  const handleMinutesChange = (newMinutes) => {
    const m = Math.max(0, Math.min(59, newMinutes))
    setMinutes(m)
    const newValue = formatTime(hours, m)
    onChange?.({ target: { value: newValue } })
  }

  const formatDisplayTime = (timeString) => {
    if (!timeString) return 'Select time'
    const [h, m] = timeString.split(':')
    const hour = parseInt(h)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${m.padStart(2, '0')} ${period}`
  }

  return (
    <div className="relative">
      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
      
      {/* Hidden native input for form compatibility */}
      <input
        type="time"
        ref={ref}
        value={value}
        onChange={onChange}
        className="sr-only"
        {...props}
      />
      
      {/* Custom time display when not focused */}
      {!isFocused && value && (
        <div className="absolute left-11 top-1/2 -translate-y-1/2 text-foreground pointer-events-none z-10 text-base">
          {formatDisplayTime(value)}
        </div>
      )}
      
      {/* Custom time inputs */}
      <div 
        className={cn(
          "flex items-center gap-2 w-full rounded-md border border-input bg-background pl-11 pr-3 py-2 h-11 text-base ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          value && !isFocused ? "text-transparent" : "",
          className
        )}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          // Don't blur if clicking inside
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsFocused(false)
          }
        }}
        tabIndex={0}
      >
        <div className="flex items-center gap-2 flex-1">
          {/* Hours */}
          <div className="relative flex items-center">
            <input
              type="number"
              value={hours}
              onChange={(e) => handleHoursChange(parseInt(e.target.value) || 0)}
              min={0}
              max={23}
              className="w-12 text-center bg-transparent border-none outline-none focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              onFocus={() => setIsFocused(true)}
            />
            <div className="absolute right-0 flex flex-col">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-5 rounded-b-none rounded-t-sm border-b border-input"
                onClick={() => handleHoursChange(hours + 1)}
                disabled={hours >= 23}
              >
                <ChevronUp className="h-2.5 w-2.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-5 rounded-t-none rounded-b-sm"
                onClick={() => handleHoursChange(hours - 1)}
                disabled={hours <= 0}
              >
                <ChevronDown className="h-2.5 w-2.5" />
              </Button>
            </div>
          </div>
          
          <span className="text-muted-foreground text-lg">:</span>
          
          {/* Minutes */}
          <div className="relative flex items-center">
            <input
              type="number"
              value={minutes}
              onChange={(e) => handleMinutesChange(parseInt(e.target.value) || 0)}
              min={0}
              max={59}
              className="w-12 text-center bg-transparent border-none outline-none focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              onFocus={() => setIsFocused(true)}
            />
            <div className="absolute right-0 flex flex-col">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-5 rounded-b-none rounded-t-sm border-b border-input"
                onClick={() => handleMinutesChange(minutes + 1)}
                disabled={minutes >= 59}
              >
                <ChevronUp className="h-2.5 w-2.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-5 rounded-t-none rounded-b-sm"
                onClick={() => handleMinutesChange(minutes - 1)}
                disabled={minutes <= 0}
              >
                <ChevronDown className="h-2.5 w-2.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
TimePicker.displayName = "TimePicker"

export { TimePicker }

