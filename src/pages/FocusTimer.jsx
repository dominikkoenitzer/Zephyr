import PomodoroTimer from '../components/FocusTimer/PomodoroTimer';

function FocusTimer() {
  return (
    <div className="w-full h-full border-2 border-border rounded-xl p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 2xl:p-16 bg-card min-h-[calc(100vh-8rem)]">
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