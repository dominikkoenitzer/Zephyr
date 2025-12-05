import Journal from '../components/Journal/Journal';

function JournalPage() {
  return (
    <div className="w-full flex-1 flex flex-col border border-border/60 rounded-2xl p-responsive bg-card/80 overflow-y-auto scrollbar-thin gap-[var(--panel-gap)]">
      <Journal />
    </div>
  );
}

export default JournalPage;

