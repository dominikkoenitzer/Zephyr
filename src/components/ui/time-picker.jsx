import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "../../lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"

const TimePicker = React.forwardRef(({ className, value = "", onChange, ...props }, ref) => {
  const parsedValue = React.useMemo(() => {
    if (!value || !value.includes(":")) {
      return { hour12: "", minute: "", period: "AM" }
    }

    const [hourStr = "", minuteStr = ""] = value.split(":")
    const hour24 = Number.parseInt(hourStr, 10)
    const minute = Number.parseInt(minuteStr, 10)

    if (Number.isNaN(hour24) || Number.isNaN(minute)) {
      return { hour12: "", minute: "", period: "AM" }
    }

    const period = hour24 >= 12 ? "PM" : "AM"
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12

    return {
      hour12: String(hour12).padStart(2, "0"),
      minute: String(minute).padStart(2, "0"),
      period,
    }
  }, [value])

  const [hour12, setHour12] = React.useState(parsedValue.hour12)
  const [minute, setMinute] = React.useState(parsedValue.minute)
  const [period, setPeriod] = React.useState(parsedValue.period)

  React.useEffect(() => {
    setHour12(parsedValue.hour12)
    setMinute(parsedValue.minute)
    setPeriod(parsedValue.period)
  }, [parsedValue])

  const hours = React.useMemo(
    () => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")),
    []
  )
  const minutes = React.useMemo(
    () => Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0")),
    []
  )

  const emitChange = React.useCallback(
    (nextHour12, nextMinute, nextPeriod) => {
      if (!nextHour12 || !nextMinute) {
        onChange?.({ target: { value: "" } })
        return
      }

      const parsedHour12 = Number.parseInt(nextHour12, 10)
      let hour24 = parsedHour12 % 12
      if (nextPeriod === "PM") {
        hour24 += 12
      }

      const nextValue = `${String(hour24).padStart(2, "0")}:${nextMinute}`
      onChange?.({ target: { value: nextValue } })
    },
    [onChange]
  )

  const handleHourChange = (nextHour) => {
    setHour12(nextHour)
    emitChange(nextHour, minute, period)
  }

  const handleMinuteChange = (nextMinute) => {
    setMinute(nextMinute)
    emitChange(hour12, nextMinute, period)
  }

  const handlePeriodChange = (nextPeriod) => {
    setPeriod(nextPeriod)
    emitChange(hour12, minute, nextPeriod)
  }

  const getSafeParts = React.useCallback(() => {
    const safeHour = hour12 || "12"
    const safeMinute = minute || "00"
    const safePeriod = period || "AM"
    return { safeHour, safeMinute, safePeriod }
  }, [hour12, minute, period])

  const adjustHour = (delta) => {
    const { safeHour, safeMinute, safePeriod } = getSafeParts()
    const hourNum = Number.parseInt(safeHour, 10)
    const nextHour = ((hourNum - 1 + delta + 12 * 10) % 12) + 1
    const nextHourStr = String(nextHour).padStart(2, "0")
    setHour12(nextHourStr)
    emitChange(nextHourStr, safeMinute, safePeriod)
  }

  const adjustMinuteByStep = (deltaSteps) => {
    const { safeHour, safeMinute, safePeriod } = getSafeParts()
    const minuteNum = Number.parseInt(safeMinute, 10)
    const totalMinutes = minuteNum + deltaSteps * 5

    let carryHours = 0
    let normalizedMinutes = totalMinutes

    while (normalizedMinutes < 0) {
      normalizedMinutes += 60
      carryHours -= 1
    }

    while (normalizedMinutes >= 60) {
      normalizedMinutes -= 60
      carryHours += 1
    }

    const hourNum = Number.parseInt(safeHour, 10)
    const nextHour = ((hourNum - 1 + carryHours + 12 * 10) % 12) + 1
    const nextHourStr = String(nextHour).padStart(2, "0")
    const nextMinuteStr = String(normalizedMinutes).padStart(2, "0")

    setHour12(nextHourStr)
    setMinute(nextMinuteStr)
    emitChange(nextHourStr, nextMinuteStr, safePeriod)
  }

  const togglePeriod = () => {
    const { safeHour, safeMinute, safePeriod } = getSafeParts()
    const nextPeriod = safePeriod === "AM" ? "PM" : "AM"
    setPeriod(nextPeriod)
    emitChange(safeHour, safeMinute, nextPeriod)
  }

  const { disabled } = props

  return (
    <div className={cn("relative", className)} ref={ref}>
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Clock className="h-4 w-4" />
      </div>

      <div
        className={cn(
          "flex h-11 w-full items-center gap-2 rounded-xl border border-border/70 bg-background/80 pl-10 pr-2 text-sm font-medium text-foreground shadow-sm",
          "hover:border-primary/60"
        )}
      >
        <Select value={hour12 || undefined} onValueChange={handleHourChange} disabled={disabled}>
          <SelectTrigger
            className="h-8 rounded-md border-border/60 bg-background/90 px-2 text-xs sm:text-sm"
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                e.preventDefault()
                adjustHour(1)
              }
              if (e.key === "ArrowDown") {
                e.preventDefault()
                adjustHour(-1)
              }
            }}
          >
            <SelectValue placeholder="--" />
          </SelectTrigger>
          <SelectContent>
            {hours.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-muted-foreground/80">:</span>

        <Select value={minute || undefined} onValueChange={handleMinuteChange} disabled={disabled}>
          <SelectTrigger
            className="h-8 rounded-md border-border/60 bg-background/90 px-2 text-xs sm:text-sm"
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                e.preventDefault()
                adjustMinuteByStep(1)
              }
              if (e.key === "ArrowDown") {
                e.preventDefault()
                adjustMinuteByStep(-1)
              }
            }}
          >
            <SelectValue placeholder="--" />
          </SelectTrigger>
          <SelectContent>
            {minutes.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={handlePeriodChange} disabled={disabled}>
          <SelectTrigger
            className="h-8 rounded-md border-border/60 bg-background/90 px-2 text-xs sm:text-sm"
            onKeyDown={(e) => {
              if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault()
                togglePeriod()
              }
            }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
})
TimePicker.displayName = "TimePicker"

export { TimePicker }
