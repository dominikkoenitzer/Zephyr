import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "../../lib/utils"

const Select = React.forwardRef(({ className, children, value, onChange, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef(null)
  const selectRef = React.useRef(null)
  const [selectedLabel, setSelectedLabel] = React.useState('')

  // Get selected option label from children
  React.useEffect(() => {
    let found = false
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === 'option' && child.props.value === value) {
        setSelectedLabel(child.props.children || String(child.props.value) || '')
        found = true
      }
    })
    if (!found) {
      setSelectedLabel('Select...')
    }
  }, [value, children])

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (optionValue) => {
    if (onChange) {
      onChange({ target: { value: optionValue } })
    }
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Hidden native select for form compatibility */}
      <select
        ref={(node) => {
          selectRef.current = node
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        }}
        value={value}
        onChange={onChange}
        className="sr-only"
        {...props}
      >
        {children}
      </select>

      {/* Custom dropdown button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-lg border-2 border-input bg-background px-4 py-2.5 text-base font-medium text-foreground",
          "transition-all duration-200",
          "hover:border-primary/60 hover:bg-accent/30",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <span className="truncate">{selectedLabel || 'Select...'}</span>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-[9999] mt-2 w-full rounded-lg border-2 border-border bg-background shadow-2xl animate-in fade-in-0 zoom-in-95">
          <div className="p-1 max-h-60 overflow-auto">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child) && child.type === 'option') {
                const optionValue = child.props.value
                const isSelected = value === optionValue
                return (
                  <button
                    key={optionValue}
                    type="button"
                    onClick={() => handleSelect(optionValue)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-base font-medium transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-primary/10 text-primary"
                    )}
                  >
                    <span>{child.props.children}</span>
                    {isSelected && <Check className="h-4 w-4" />}
                  </button>
                )
              }
              return null
            })}
          </div>
        </div>
      )}
    </div>
  )
})
Select.displayName = "Select"

export { Select }
