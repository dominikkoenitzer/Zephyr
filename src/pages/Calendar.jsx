import CalendarView from '../components/Planner/CalendarView';
import PageHeader from '../components/Layout/PageHeader';
import PageContainer from '../components/Layout/PageContainer';

function Calendar() {
  return (
    <PageContainer>
      <PageHeader
        title="Calendar"
        description="Plan your schedule and organize your time"
      />
      <CalendarView />
    </PageContainer>
  );
}

export default Calendar;
