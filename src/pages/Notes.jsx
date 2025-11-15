import NotesJournal from '../components/NotesJournal/NotesJournal';

function NotesPage() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <NotesJournal />
      </div>
    </div>
  );
}

export default NotesPage;

