import * as React from "react"
import { Plus, Minus } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"

/**
 * Stepper field: a text input between a minus and a plus button.
 *
 * The field has no visible text of its own, so the caller names it twice over:
 * `id` for the visible `<label htmlFor>` to point at, and `label` for the two
 * icon buttons, which hold nothing but an SVG and would otherwise announce as
 * "button". Without both, four of these in one dialog are indistinguishable.
 */
const CustomNumberInput = React.forwardRef(({
  className,
  value,
  onChange,
  min = 1,
  max = 120,
  step = 1,
  id,
  label,
  ...props
}, ref) => {
  const [displayValue, setDisplayValue] = React.useState(value || min)

  React.useEffect(() => {
    setDisplayValue(value || min)
  }, [value, min])

  const handleIncrement = () => {
    const newValue = Math.min((displayValue || min) + step, max)
    setDisplayValue(newValue)
    onChange?.({ target: { value: newValue } })
  }

  const handleDecrement = () => {
    const newValue = Math.max((displayValue || min) - step, min)
    setDisplayValue(newValue)
    onChange?.({ target: { value: newValue } })
  }

  const handleInputChange = (e) => {
    const inputValue = e.target.value
    if (inputValue === '') {
      setDisplayValue('')
      return
    }
    const numValue = parseInt(inputValue)
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(numValue, max))
      setDisplayValue(clampedValue)
      onChange?.({ target: { value: clampedValue } })
    }
  }

  const handleBlur = () => {
    if (displayValue === '' || displayValue < min) {
      const clampedValue = min
      setDisplayValue(clampedValue)
      onChange?.({ target: { value: clampedValue } })
    } else if (displayValue > max) {
      const clampedValue = max
      setDisplayValue(clampedValue)
      onChange?.({ target: { value: clampedValue } })
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-md shrink-0"
        onClick={handleDecrement}
        disabled={displayValue <= min}
        aria-label={label ? `Decrease ${label}` : "Decrease value"}
      >
        <Minus className="h-4 w-4" />
      </Button>
      
      <div className="flex-1 min-w-0">
        <input
          type="text"
          id={id}
          ref={ref}
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-md shrink-0"
        onClick={handleIncrement}
        disabled={displayValue >= max}
        aria-label={label ? `Increase ${label}` : "Increase value"}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
})

CustomNumberInput.displayName = "CustomNumberInput"

export { CustomNumberInput }

