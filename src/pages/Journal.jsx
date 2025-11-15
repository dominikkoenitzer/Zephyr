import Journal from '../components/Journal/Journal';

function JournalPage() {
  return (
    <div className="w-full h-full border-2 border-border rounded-xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 bg-card overflow-hidden flex flex-col">
      <Journal />
    </div>
  );
}

export default JournalPage;

