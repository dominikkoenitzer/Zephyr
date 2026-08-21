import PomodoroTimer from '../components/FocusTimer/PomodoroTimer';
import PageContainer from '../components/Layout/PageContainer';

function FocusTimer() {
  return (
    <PageContainer>
      {/* Titled by the top bar — see TasksPage. */}
      <h1 className="sr-only">Focus timer</h1>
      <PomodoroTimer />
    </PageContainer>
  );
}

export default FocusTimer;
