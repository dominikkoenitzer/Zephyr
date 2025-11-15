import Notes from '../components/Notes/Notes';

function NotesPage() {
  return (
    <div className="w-full h-full border-2 border-border rounded-xl p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 2xl:p-16 bg-card min-h-[calc(100vh-8rem)]">
      <Notes />
    </div>
  );
}

export default NotesPage;
