import PomodoroTimer from '../components/FocusTimer/PomodoroTimer';

function FocusTimer() {
  return (
    <div className="w-full border border-border rounded-lg p-4 sm:p-6 bg-card">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">Focus Timer</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Choose a timer preset that works best for you
        </p>
      </div>
      
      <PomodoroTimer />
    </div>
  );
}

export default FocusTimer;