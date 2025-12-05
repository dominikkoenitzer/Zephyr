import * as React from "react"
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react"
import { Button } from "./button"
import { cn } from "../../lib/utils"

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const weekDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const defaultCategories = [
  { id: "work", name: "Work", color: "hsl(var(--primary))" },
  { id: "personal", name: "Personal", color: "hsl(var(--accent))" },
  { id: "meeting", name: "Meeting", color: "hsl(var(--ring))" },
  { id: "reminder", name: "Reminder", color: "hsl(var(--destructive))" },
  { id: "task", name: "Task", color: "hsl(var(--secondary-foreground))" },
  { id: "other", name: "Other", color: "hsl(var(--muted-foreground))" },
]

const getDateKey = (value) => {
  if (!value) return ""
  const d = new Date(value)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

const buildMonthGrid = (monthDate, firstDayOfWeek = 0) => {
  const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const startOffset = (startOfMonth.getDay() - firstDayOfWeek + 7) % 7
  const firstVisibleDate = new Date(startOfMonth)
  firstVisibleDate.setDate(firstVisibleDate.getDate() - startOffset)

  const days = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(firstVisibleDate)
    date.setDate(firstVisibleDate.getDate() + i)
    days.push({
      date,
      inCurrentMonth: date.getMonth() === monthDate.getMonth(),
    })
  }
  return days
}

const EventCalendar = ({
  monthDate = new Date(),
  events = [],
  tasks = [],
  showTasks = false,
  firstDayOfWeek = 0,
  onDaySelect,
  onEventSelect,
  onEventDelete,
  onMonthChange,
  onToday,
  onCreate,
  eventCategories = defaultCategories,
  className,
}) => {
  const days = React.useMemo(() => buildMonthGrid(monthDate, firstDayOfWeek), [monthDate, firstDayOfWeek])

  const todayKey = getDateKey(new Date())

  const getCategory = (id, isTask = false) => {
    if (isTask) return eventCategories.find((c) => c.id === "task") || eventCategories[0]
    return eventCategories.find((c) => c.id === id) || eventCategories[0]
  }

  const renderItems = (dateKey) => {
    const dayEvents = events.filter((event) => getDateKey(event.date) === dateKey)
    const dayTasks = showTasks ? tasks.filter((task) => getDateKey(task.dueDate) === dateKey && !task.completed) : []

    const combined = [
      ...dayEvents.map((e) => ({ ...e, isTask: false })),
      ...dayTasks.map((t) => ({ ...t, isTask: true })),
    ].slice(0, 3)

    const moreCount = Math.max(0, dayEvents.length + dayTasks.length - combined.length)

    return (
      <>
        {combined.map((item) => {
          const category = getCategory(item.category, item.isTask)
          return (
            <div
              key={item.id}
              onClick={(e) => {
                e.stopPropagation()
                if (!item.isTask) onEventSelect?.(item, e)
              }}
              className="group relative flex items-center gap-2 rounded-lg px-2 py-1 text-[11px] font-medium leading-tight"
              style={{
                backgroundColor: `${category.color}20`,
                color: category.color,
              }}
            >
              <span className="truncate">{item.title}</span>
              {!item.isTask && onEventDelete && (
                <button
                  type="button"
                  aria-label="Delete event"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEventDelete(item.id, e)
                  }}
                  className="absolute right-1 top-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )
        })}
        {moreCount > 0 && (
          <div className="px-2 text-[11px] font-medium text-muted-foreground">+{moreCount} more</div>
        )}
      </>
    )
  }

  return (
    <div className={cn("rounded-2xl border border-border/60 bg-background/70 p-3 sm:p-4 shadow-sm", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            aria-label="Previous month"
            onClick={() => onMonthChange?.(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-semibold text-foreground">
            {monthNames[monthDate.getMonth()]} {monthDate.getFullYear()}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            aria-label="Next month"
            onClick={() => onMonthChange?.(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onToday?.()}>
            Today
          </Button>
          {onCreate && (
            <Button size="sm" onClick={onCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              New event
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
        {weekDayNames
          .slice(firstDayOfWeek)
          .concat(weekDayNames.slice(0, firstDayOfWeek))
          .map((day) => (
            <div key={day} className="text-center">
              {day}
            </div>
          ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {days.map(({ date, inCurrentMonth }) => {
          const dateKey = getDateKey(date)
          const isToday = dateKey === todayKey
          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onDaySelect?.(date)}
              className={cn(
                "flex min-h-[110px] flex-col gap-1 rounded-xl border px-2 py-2 text-left transition-all",
                "hover:border-primary/60 hover:shadow-sm",
                inCurrentMonth ? "border-border/70 bg-card/60" : "border-border/40 bg-muted/30 text-muted-foreground/80",
                isToday && "border-primary/80 bg-primary/10"
              )}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className={cn("text-foreground", !inCurrentMonth && "text-muted-foreground/70")}>{date.getDate()}</span>
                {isToday && <span className="text-[10px] font-semibold text-primary">Today</span>}
              </div>
              <div className="space-y-1">{renderItems(dateKey)}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

EventCalendar.displayName = "EventCalendar"

export { EventCalendar }

