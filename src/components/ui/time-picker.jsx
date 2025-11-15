import * as React from "react"
import { Clock, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"

const TimePicker = React.forwardRef(({ className, value, onChange, ...props }, ref) => {
  const [hours, setHours] = React.useState(null)
  const [minutes, setMinutes] = React.useState(null)
  const [period, setPeriod] = React.useState('PM')
  const [isOpen, setIsOpen] = React.useState(false)

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
    if (h === null || m === null) return ''
    let hour24 = h
    if (p === 'PM' && h !== 12) {
      hour24 = h + 12
    } else if (p === 'AM' && h === 12) {
      hour24 = 0
    }
    return `${String(hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const handleHoursChange = (newHours) => {
    const h = Math.max(1, Math.min(12, parseInt(newHours) || 1))
    setHours(h)
    const newValue = formatTime24(h, minutes ?? 0, period)
    onChange?.({ target: { value: newValue } })
  }

  const handleMinutesChange = (newMinutes) => {
    const m = Math.max(0, Math.min(59, parseInt(newMinutes) || 0))
    setMinutes(m)
    const newValue = formatTime24(hours ?? 12, m, period)
    onChange?.({ target: { value: newValue } })
  }

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod)
    const newValue = formatTime24(hours ?? 12, minutes ?? 0, newPeriod)
    onChange?.({ target: { value: newValue } })
  }

  const incrementHours = () => {
    const newHours = (hours ?? 12) >= 12 ? 1 : (hours ?? 12) + 1
    handleHoursChange(newHours)
  }

  const decrementHours = () => {
    const newHours = (hours ?? 12) <= 1 ? 12 : (hours ?? 12) - 1
    handleHoursChange(newHours)
  }

  const incrementMinutes = () => {
    const newMinutes = (minutes ?? 0) >= 59 ? 0 : (minutes ?? 0) + 1
    handleMinutesChange(newMinutes)
  }

  const decrementMinutes = () => {
    const newMinutes = (minutes ?? 0) <= 0 ? 59 : (minutes ?? 0) - 1
    handleMinutesChange(newMinutes)
  }

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref?.current && !ref.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, ref])

  const displayTime = value && hours !== null && minutes !== null 
    ? `${hours}:${String(minutes).padStart(2, '0')} ${period}`
    : 'Select time'

  return (
    <div className="relative" ref={ref}>
      {/* Hidden native input for form compatibility */}
      <input
        type="time"
        value={value}
        onChange={onChange}
        className="sr-only"
        {...props}
      />
      
      {/* Custom time picker button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-lg border-2 border-input bg-background px-4 py-2.5 text-base font-medium text-foreground transition-all duration-200",
          "hover:border-primary/60 hover:bg-accent/30",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {displayTime}
          </span>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown picker */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border-2 border-border bg-background shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="p-4">
            <div className="flex items-center justify-center gap-4">
              {/* Hours */}
              <div className="flex flex-col items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hour</label>
                <div className="flex flex-col items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-12 rounded-md hover:bg-accent"
                    onClick={incrementHours}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center justify-center h-12 w-16 rounded-lg border-2 border-input bg-background text-lg font-semibold text-foreground">
                    {hours ?? 12}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-12 rounded-md hover:bg-accent"
                    onClick={decrementHours}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <span className="text-2xl font-semibold text-foreground pt-6">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Min</label>
                <div className="flex flex-col items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-12 rounded-md hover:bg-accent"
                    onClick={incrementMinutes}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center justify-center h-12 w-16 rounded-lg border-2 border-input bg-background text-lg font-semibold text-foreground">
                    {String(minutes ?? 0).padStart(2, '0')}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-12 rounded-md hover:bg-accent"
                    onClick={decrementMinutes}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* AM/PM */}
              <div className="flex flex-col items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Period</label>
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant={period === 'AM' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-10 w-14 rounded-md font-medium"
                    onClick={() => handlePeriodChange('AM')}
                  >
                    AM
                  </Button>
                  <Button
                    type="button"
                    variant={period === 'PM' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-10 w-14 rounded-md font-medium"
                    onClick={() => handlePeriodChange('PM')}
                  >
                    PM
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
TimePicker.displayName = "TimePicker"

export { TimePicker }
