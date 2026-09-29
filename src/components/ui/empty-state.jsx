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
    // Set left and quiet inside whatever card holds it: an icon in a soft
    // apricot circle, then the copy.
    <div className={cn("px-6 py-12 sm:px-8 sm:py-14", className)}>
      {Icon && (
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary-strong" aria-hidden="true">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
      )}
      <h2 className="text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-7">{action}</div>}
    </div>
  )
}

export { EmptyState }
export default EmptyState
