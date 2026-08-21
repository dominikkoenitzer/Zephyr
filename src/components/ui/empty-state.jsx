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
    // Set left and quiet: no coloured chip, no centred box. It reads as a line
    // of copy on the page rather than as a placeholder panel.
    <div className={cn("py-12 sm:py-16", className)}>
      {Icon && (
        <Icon className="mb-5 h-6 w-6 text-muted-foreground" aria-hidden="true" strokeWidth={1.5} />
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
