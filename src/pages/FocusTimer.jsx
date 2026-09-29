import PomodoroTimer from '../components/FocusTimer/PomodoroTimer';
import PageContainer from '../components/Layout/PageContainer';
import PageHeader from '../components/Layout/PageHeader';
import { usePageMeta } from '../hooks/usePageMeta';
import { ROUTE_META } from '../routes/meta';

function FocusTimer() {
  usePageMeta(ROUTE_META['/focus']);

  return (
    <PageContainer>
      <PageHeader title="Focus" description="Pick a length, pick a task, and let the rest wait." />
      <PomodoroTimer />
    </PageContainer>
  );
}

export default FocusTimer;
