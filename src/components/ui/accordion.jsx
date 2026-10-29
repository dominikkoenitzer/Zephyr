import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

const AccordionContext = React.createContext({
  openItems: [],
  setOpenItems: () => {},
  type: "single"
})

const Accordion = ({ children, type = "single", className, ...props }) => {
  const [openItems, setOpenItems] = React.useState([])

  return (
    <AccordionContext.Provider value={{ openItems, setOpenItems, type }}>
      <div className={cn("space-y-3", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

// Each item's id, so its trigger can name the panel it opens.
const AccordionItemContext = React.createContext(null)

const AccordionItem = ({ children, value, className, ...props }) => {
  const id = React.useId()
  return (
    <AccordionItemContext.Provider value={id}>
      <div className={cn("border border-border/50 rounded-lg bg-background/50 overflow-hidden shadow-sm", className)} {...props}>
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { value })
          }
          return child
        })}
      </div>
    </AccordionItemContext.Provider>
  )
}

const AccordionTrigger = React.forwardRef(({ className, children, value, ...props }, ref) => {
  const { openItems, setOpenItems, type } = React.useContext(AccordionContext)
  const itemId = React.useContext(AccordionItemContext)
  const isOpen = openItems.includes(value)

  const handleClick = () => {
    if (type === "single") {
      setOpenItems(isOpen ? [] : [value])
    } else {
      setOpenItems(prev => 
        isOpen ? prev.filter(item => item !== value) : [...prev, value]
      )
    }
  }

  return (
    <button
      ref={ref}
      type="button"
      aria-expanded={isOpen}
      aria-controls={itemId ? `${itemId}-panel` : undefined}
      onClick={handleClick}
      className={cn(
        "flex w-full items-center justify-between p-4 font-semibold text-foreground transition-all hover:bg-background/70 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring forced-colors:focus-visible:-outline-offset-2",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown 
        className={cn(
          "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} 
      />
    </button>
  )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef(({ className, children, value, ...props }, ref) => {
  const { openItems } = React.useContext(AccordionContext)
  const itemId = React.useContext(AccordionItemContext)
  const isOpen = openItems.includes(value)

  return (
    <div
      ref={ref}
      id={itemId ? `${itemId}-panel` : undefined}
      // Closed, the panel only shrinks to nothing; inert keeps screen readers and Tab out of it as well.
      inert={!isOpen}
      className={cn(
        "overflow-hidden text-sm text-muted-foreground transition-all duration-200",
        isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      )}
      {...props}
    >
      <div className={cn("px-4 pb-4 pt-0", className)}>
        {children}
      </div>
    </div>
  )
})
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }

