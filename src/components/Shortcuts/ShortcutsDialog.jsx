import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import ShortcutTable from './ShortcutTable';

/**
 * The keyboard map, opened with `?`, from the palette, or from Settings.
 * The Help page renders the same table without the dialog around it.
 */
function ShortcutsDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[95vw] overflow-y-auto scrollbar-thin sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Single keys work whenever you are not typing in a field.
          </DialogDescription>
        </DialogHeader>
        <ShortcutTable />
      </DialogContent>
    </Dialog>
  );
}

export default ShortcutsDialog;
