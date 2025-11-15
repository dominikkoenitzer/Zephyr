import CalendarView from '../components/Planner/CalendarView';

function Calendar() {
  return (
    <div className="w-full h-full lg:h-full border-2 border-border rounded-xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 bg-card lg:overflow-hidden overflow-y-auto lg:overflow-y-hidden flex flex-col">
      <CalendarView />
    </div>
  );
}

export default Calendar;