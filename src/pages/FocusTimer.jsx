import PomodoroTimer from '../components/FocusTimer/PomodoroTimer';
import PageHeader from '../components/Layout/PageHeader';

function FocusTimer() {
  return (
    <div className="w-full flex-1 flex flex-col border border-border/60 rounded-2xl p-responsive bg-card/80 overflow-y-auto scrollbar-thin gap-[var(--panel-gap)]">
      <PageHeader
        title="Focus Timer"
        description="Choose a timer preset that works best for you"
      />
      
      <PomodoroTimer />
    </div>
  );
}

export default FocusTimer;