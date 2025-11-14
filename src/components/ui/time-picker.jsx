import * as React from "react"
import { Clock, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"

const TimePicker = React.forwardRef(({ className, value, onChange, ...props }, ref) => {
  const [hours, setHours] = React.useState(12)
  const [minutes, setMinutes] = React.useState(0)
  const [period, setPeriod] = React.useState('PM')
  const [isFocused, setIsFocused] = React.useState(false)

  // Parse time value (HH:MM format) and convert to 12-hour
  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(':')
      const hour24 = parseInt(h) || 12
      const min = parseInt(m) || 0
      
      if (hour24 === 0) {
        setHours(12)
        setPeriod('AM')
      } else if (hour24 === 12) {
        setHours(12)
        setPeriod('PM')
      } else if (hour24 > 12) {
        setHours(hour24 - 12)
        setPeriod('PM')
      } else {
        setHours(hour24)
        setPeriod('AM')
      }
      setMinutes(min)
    } else {
      setHours(12)
      setMinutes(0)
      setPeriod('PM')
    }
  }, [value])

  const formatTime24 = (h, m, p) => {
    let hour24 = h
    if (p === 'PM' && h !== 12) {
      hour24 = h + 12
    } else if (p === 'AM' && h === 12) {
      hour24 = 0
    }
    return `${String(hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const handleHoursChange = (newHours) => {
    const h = Math.max(1, Math.min(12, newHours))
    setHours(h)
    const newValue = formatTime24(h, minutes, period)
    onChange?.({ target: { value: newValue } })
  }

  const handleMinutesChange = (newMinutes) => {
    const m = Math.max(0, Math.min(59, newMinutes))
    setMinutes(m)
    const newValue = formatTime24(hours, m, period)
    onChange?.({ target: { value: newValue } })
  }

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod)
    const newValue = formatTime24(hours, minutes, newPeriod)
    onChange?.({ target: { value: newValue } })
  }

  const formatDisplayTime = () => {
    if (!value) return 'Select time'
    return `${hours}:${String(minutes).padStart(2, '0')} ${period}`
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
        <div 
          className="absolute left-11 top-1/2 -translate-y-1/2 text-foreground pointer-events-none z-10 text-base font-medium"
        >
          {formatDisplayTime()}
        </div>
      )}
      
      {/* Custom time picker */}
      <div 
        className={cn(
          "flex items-center gap-3 w-full rounded-lg border-2 border-input bg-background pl-11 pr-4 py-2.5 h-12 text-base transition-all duration-200",
          "hover:border-primary/60 hover:bg-accent/30",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary",
          value && !isFocused ? "text-transparent" : "",
          className
        )}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsFocused(false)
          }
        }}
        tabIndex={0}
      >
        {isFocused || !value ? (
          <div className="flex items-center gap-2 flex-1">
            {/* Hours */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={hours}
                onChange={(e) => handleHoursChange(parseInt(e.target.value) || 1)}
                min={1}
                max={12}
                className="w-10 text-center bg-transparent border-none outline-none focus:outline-none font-medium text-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                onFocus={() => setIsFocused(true)}
              />
              <div className="flex flex-col">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-3 w-4 rounded-b-none rounded-t border-b border-input/50 hover:bg-accent"
                  onClick={() => handleHoursChange(hours + 1)}
                  disabled={hours >= 12}
                >
                  <ChevronUp className="h-2.5 w-2.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-3 w-4 rounded-t-none rounded-b hover:bg-accent"
                  onClick={() => handleHoursChange(hours - 1)}
                  disabled={hours <= 1}
                >
                  <ChevronDown className="h-2.5 w-2.5" />
                </Button>
              </div>
            </div>
            
            <span className="text-muted-foreground text-lg font-medium">:</span>
            
            {/* Minutes */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={minutes}
                onChange={(e) => handleMinutesChange(parseInt(e.target.value) || 0)}
                min={0}
                max={59}
                className="w-10 text-center bg-transparent border-none outline-none focus:outline-none font-medium text-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                onFocus={() => setIsFocused(true)}
              />
              <div className="flex flex-col">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-3 w-4 rounded-b-none rounded-t border-b border-input/50 hover:bg-accent"
                  onClick={() => handleMinutesChange(minutes + 1)}
                  disabled={minutes >= 59}
                >
                  <ChevronUp className="h-2.5 w-2.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-3 w-4 rounded-t-none rounded-b hover:bg-accent"
                  onClick={() => handleMinutesChange(minutes - 1)}
                  disabled={minutes <= 0}
                >
                  <ChevronDown className="h-2.5 w-2.5" />
                </Button>
              </div>
            </div>
            
            {/* AM/PM */}
            <div className="flex items-center gap-1 ml-1">
              <button
                type="button"
                onClick={() => handlePeriodChange('AM')}
                className={cn(
                  "px-2 py-1 rounded text-sm font-medium transition-colors",
                  period === 'AM' 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange('PM')}
                className={cn(
                  "px-2 py-1 rounded text-sm font-medium transition-colors",
                  period === 'PM' 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                PM
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
})
TimePicker.displayName = "TimePicker"

export { TimePicker }
