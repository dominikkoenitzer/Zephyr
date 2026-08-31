import PomodoroTimer from '../components/FocusTimer/PomodoroTimer';
import PageContainer from '../components/Layout/PageContainer';
import { usePageMeta } from '../hooks/usePageMeta';
import { ROUTE_META } from '../routes/meta';

function FocusTimer() {
  usePageMeta(ROUTE_META['/focus']);

  return (
    <PageContainer>
      {/* Titled by the top bar; see TasksPage. */}
      <h1 className="sr-only">Focus timer</h1>
      <PomodoroTimer />
    </PageContainer>
  );
}

export default FocusTimer;
