import CalendarView from '../components/Planner/CalendarView';

function Calendar() {
  return (
    <div className="w-full flex-1 flex flex-col border border-border/60 rounded-2xl p-responsive bg-card/80 overflow-y-auto scrollbar-thin gap-[var(--panel-gap)]">
      <CalendarView />
    </div>
  );
}

export default Calendar;