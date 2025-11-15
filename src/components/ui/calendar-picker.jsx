import * as React from "react"
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const CalendarPicker = React.forwardRef(({ className, value, onChange, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState(value ? new Date(value) : null)
  const [currentMonth, setCurrentMonth] = React.useState(new Date())

  React.useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value))
    } else {
      setSelectedDate(null)
    }
  }, [value])

  const formatDisplayDate = (date) => {
    if (!date) return 'Select date'
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

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  const handleDateSelect = (date) => {
    if (!date) return
    
    const dateString = date.toISOString().split('T')[0]
    setSelectedDate(date)
    setIsOpen(false)
    
    if (onChange) {
      const syntheticEvent = {
        target: { value: dateString }
      }
      onChange(syntheticEvent)
    }
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setSelectedDate(null)
    setIsOpen(false)
    if (onChange) {
      const syntheticEvent = {
        target: { value: '' }
      }
      onChange(syntheticEvent)
    }
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    handleDateSelect(today)
  }

  const days = getDaysInMonth(currentMonth)
  const today = new Date()
  const isToday = (date) => {
    if (!date) return false
    return date.toDateString() === today.toDateString()
  }
  
  const isSelected = (date) => {
    if (!date || !selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-11 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background",
          "cursor-pointer transition-colors hover:border-primary/50 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          className
        )}
        {...props}
      >
        <Calendar className="mr-2 h-5 w-5 text-muted-foreground flex-shrink-0" />
        <span className={cn(
          "flex-1 text-left",
          selectedDate ? "text-foreground" : "text-muted-foreground"
        )}>
          {formatDisplayDate(selectedDate)}
        </span>
        {selectedDate && (
          <X
            className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleClear}
          />
        )}
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 z-50 w-80 rounded-lg border border-border bg-background shadow-lg p-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={goToPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={goToNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Day Labels */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />
                }
                
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateSelect(date)}
                    className={cn(
                      "aspect-square rounded-md text-sm font-medium transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isToday(date) && "bg-primary/10 text-primary font-semibold",
                      isSelected(date) && "bg-primary text-primary-foreground hover:bg-primary/90",
                      !isToday(date) && !isSelected(date) && "text-foreground"
                    )}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={goToToday}
              >
                Select Today
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
})

CalendarPicker.displayName = "CalendarPicker"

export { CalendarPicker }

