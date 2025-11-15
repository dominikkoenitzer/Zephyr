import PomodoroTimer from '../components/FocusTimer/PomodoroTimer';

function FocusTimer() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Focus Timer</h1>
          <p className="text-muted-foreground text-lg">
            Choose a timer preset that works best for you
          </p>
        </div>
        
        <PomodoroTimer />
      </div>
    </div>
  );
}

export default FocusTimer;