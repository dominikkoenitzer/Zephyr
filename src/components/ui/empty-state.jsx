import { cn } from "../../lib/utils"

/**
 * Consistent empty / zero-data state used across pages.
 *
 * @param {object} props
 * @param {import('lucide-react').LucideIcon} [props.icon]
 * @param {string} props.title
 * @param {React.ReactNode} [props.description]
 * @param {React.ReactNode} [props.action] Optional CTA rendered below the copy.
 */
function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center px-6 py-12 sm:py-16", className)}>
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-8 w-8" aria-hidden="true" />
        </div>
      )}
      <h2 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="mt-1.5 max-w-md text-sm text-muted-foreground leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export { EmptyState }
export default EmptyState
