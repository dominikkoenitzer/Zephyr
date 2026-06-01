import Notes from '../components/Notes/Notes';
import PageHeader from '../components/Layout/PageHeader';

function NotesPage() {
  return (
    <div className="w-full flex-1 panel-stack border border-border/60 rounded-2xl bg-card/80 p-responsive overflow-y-auto min-h-0">
      <PageHeader
        title="Notes"
        description="Capture your ideas and keep them in one place."
      />

      <Notes />
    </div>
  );
}

export default NotesPage;
