import * as React from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"

const NumberInput = React.forwardRef(({ 
  className, 
  value, 
  onChange, 
  min, 
  max, 
  step = 1,
  ...props 
}, ref) => {
  const handleIncrement = () => {
    const newValue = Math.min((value || 0) + step, max || Infinity)
    onChange?.({ target: { value: newValue } })
  }

  const handleDecrement = () => {
    const newValue = Math.max((value || 0) - step, min || -Infinity)
    onChange?.({ target: { value: newValue } })
  }

  return (
    <div className="relative flex items-center">
      <input
        type="number"
        ref={ref}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 pr-20 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
          "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          className
        )}
        {...props}
      />
      <div className="absolute right-1 flex flex-col">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-5 w-7 rounded-b-none rounded-t-md border-b border-input"
          onClick={handleIncrement}
          disabled={max !== undefined && value >= max}
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-5 w-7 rounded-t-none rounded-b-md"
          onClick={handleDecrement}
          disabled={min !== undefined && value <= min}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
})
NumberInput.displayName = "NumberInput"

export { NumberInput }

