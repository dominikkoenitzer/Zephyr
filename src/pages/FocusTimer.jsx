import PomodoroTimer from '../components/FocusTimer/PomodoroTimer';
import PageContainer from '../components/Layout/PageContainer';
import { usePageMeta } from '../hooks/usePageMeta';

function FocusTimer() {
  usePageMeta({
    title: 'Focus Timer | Zephyr',
    description:
      'A Pomodoro focus timer with custom presets, session tracking and a daily streak. Runs accurately in a background tab and keeps working offline.',
    path: '/focus',
  });

  return (
    <PageContainer>
      {/* Titled by the top bar — see TasksPage. */}
      <h1 className="sr-only">Focus timer</h1>
      <PomodoroTimer />
    </PageContainer>
  );
}

export default FocusTimer;
