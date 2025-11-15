import CalendarView from '../components/Planner/CalendarView';

function Calendar() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <CalendarView />
      </div>
    </div>
  );
}

export default Calendar;