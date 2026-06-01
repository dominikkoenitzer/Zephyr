import PomodoroTimer from '../components/FocusTimer/PomodoroTimer';
import PageHeader from '../components/Layout/PageHeader';
import PageContainer from '../components/Layout/PageContainer';

function FocusTimer() {
  return (
    <PageContainer>
      <PageHeader
        title="Focus Timer"
        description="Choose a timer preset that works best for you"
      />

      <PomodoroTimer />
    </PageContainer>
  );
}

export default FocusTimer;
