import PomodoroTimer from '../components/FocusTimer/PomodoroTimer';

function FocusTimer() {
  return (
    <div className="w-full flex-1 flex flex-col border border-border/60 rounded-2xl p-responsive bg-card/80 overflow-y-auto scrollbar-thin gap-[var(--panel-gap)]">
      <div className="mb-4 sm:mb-6 flex-shrink-0">
        <h1 className="text-fluid-2xl sm:text-fluid-3xl font-bold mb-1 sm:mb-2">Focus Timer</h1>
        <p className="text-fluid-sm text-muted-foreground">
          Choose a timer preset that works best for you
        </p>
      </div>
      
      <PomodoroTimer />
    </div>
  );
}

export default FocusTimer;