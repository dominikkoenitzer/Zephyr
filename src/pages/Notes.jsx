import Notes from '../components/Notes/Notes';

function NotesPage() {
  return (
    <div className="w-full h-full border-2 border-border rounded-xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 bg-card overflow-hidden flex flex-col">
      <Notes />
    </div>
  );
}

export default NotesPage;
