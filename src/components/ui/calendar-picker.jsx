import * as React from "react"
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const parseDateValue = (value) => {
  if (!value) return null
  const [year, month, day] = value.split("T")[0].split("-").map(Number)
  if (!year || !month || !day) return null
  const parsed = new Date(year, month - 1, day)
  return isNaN(parsed.getTime()) ? null : parsed
}

const formatDateForChange = (date) => {
  if (!date) return ""
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatDisplayDate = (date) => {
  if (!date) return "Select date"
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow"

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  })
}

const buildCalendarGrid = (monthDate) => {
  const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const startOffset = startOfMonth.getDay()
  const firstVisibleDate = new Date(startOfMonth)
  firstVisibleDate.setDate(firstVisibleDate.getDate() - startOffset)

  const days = []
  for (let i = 0; i < 42; i++) {
    const day = new Date(firstVisibleDate)
    day.setDate(firstVisibleDate.getDate() + i)
    days.push({
      date: day,
      inCurrentMonth: day.getMonth() === monthDate.getMonth(),
    })
  }
  return days
}

const CalendarPicker = React.forwardRef(({ className, value, onChange, ...props }, ref) => {
  const parsedInitial = parseDateValue(value)
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState(parsedInitial)
  const [currentMonth, setCurrentMonth] = React.useState(
    parsedInitial ? new Date(parsedInitial.getFullYear(), parsedInitial.getMonth(), 1) : new Date()
  )

  const days = React.useMemo(() => buildCalendarGrid(currentMonth), [currentMonth])

  const syncFromValue = React.useCallback(
    (newValue) => {
      const parsed = parseDateValue(newValue)
      setSelectedDate(parsed)
      setCurrentMonth(parsed ? new Date(parsed.getFullYear(), parsed.getMonth(), 1) : new Date())
    },
    []
  )

  React.useEffect(() => {
    syncFromValue(value)
  }, [value, syncFromValue])

  React.useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen])

  const handleDateSelect = (date) => {
    const nextValue = formatDateForChange(date)
    setSelectedDate(date)
    setIsOpen(false)
    onChange?.({ target: { value: nextValue } })
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setSelectedDate(null)
    setIsOpen(false)
    onChange?.({ target: { value: "" } })
  }

  const goToMonth = (delta) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1))
  }

  const goToToday = () => {
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    setCurrentMonth(startOfToday)
    handleDateSelect(startOfToday)
  }

  const isToday = (date) => {
    const now = new Date()
    return date.toDateString() === now.toDateString()
  }

  const isSelected = (date) => {
    if (!selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  const handleTriggerKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      setIsOpen((prev) => !prev)
    }
    if (event.key === "Escape") {
      setIsOpen(false)
    }
  }

  const openPicker = () => {
    if (!isOpen) {
      const base = selectedDate || new Date()
      setCurrentMonth(new Date(base.getFullYear(), base.getMonth(), 1))
    }
    setIsOpen((prev) => !prev)
  }

  return (
    <div className="relative" ref={ref}>
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "flex h-11 w-full items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-3 py-2",
          "shadow-sm transition-colors hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          className
        )}
        {...props}
      >
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <span
          className={cn(
            "flex-1 text-left text-sm font-medium",
            selectedDate ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {formatDisplayDate(selectedDate)}
        </span>
        {selectedDate && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear selected date"
            className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden="true"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 z-50 mt-2 w-[360px] rounded-2xl border border-border/60 bg-background shadow-2xl ring-1 ring-border/60">
            <div className="flex items-center justify-between px-4 pt-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => goToMonth(-1)}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-semibold text-foreground">
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => goToMonth(1)}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 px-4 pb-4">
              <div className="grid grid-cols-7 gap-1.5 text-[11px] font-medium text-muted-foreground/80">
                {DAYS.map((day) => (
                  <div key={day} className="text-center uppercase tracking-wide">
                    {day}
                  </div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-1.5">
                {days.map(({ date, inCurrentMonth }) => (
                  <button
                    type="button"
                    key={date.toISOString()}
                    onClick={() => handleDateSelect(date)}
                    className={cn(
                      "relative flex aspect-square items-center justify-center rounded-lg text-sm font-semibold transition-all",
                      inCurrentMonth ? "text-foreground" : "text-muted-foreground/50",
                      "hover:bg-accent hover:text-accent-foreground",
                      isToday(date) && !isSelected(date) && "ring-1 ring-primary/60 text-primary",
                      isSelected(date) && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                    )}
                  >
                    {date.getDate()}
                    {isToday(date) && !isSelected(date) && (
                      <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={goToToday}>
                  Today
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex h-2 w-2 rounded-full bg-primary/70" />
                  <span>Today</span>
                  {selectedDate && (
                    <>
                      <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
                      <span>Selected</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
})

CalendarPicker.displayName = "CalendarPicker"

export { CalendarPicker }

