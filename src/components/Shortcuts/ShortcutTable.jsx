import { SHORTCUT_GROUPS, renderKeys } from '../../lib/shortcuts';

/**
 * The printed keyboard map. Rendered both in the `?` dialog and on the Help
 * page, from the single list in `lib/shortcuts`, so the two can't drift.
 */
function ShortcutTable() {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
      {SHORTCUT_GROUPS.map((group) => (
        <section key={group.title}>
          <h3 className="mb-1 text-[13px] font-semibold text-foreground">
            {group.title}
          </h3>
          <ul className="-mx-3">
            {group.items.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between gap-4 rounded-2xl px-3 py-2 transition-colors hover:bg-accent/60"
              >
                <span className="min-w-0 text-sm text-muted-foreground">{item.label}</span>
                <span className="flex shrink-0 items-center gap-1">
                  {renderKeys(item.keys).map((key, index) => (
                    <kbd key={`${key}-${index}`} className="kbd">
                      {key}
                    </kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default ShortcutTable;
