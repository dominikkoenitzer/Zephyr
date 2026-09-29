import TaskList from '../components/TaskManager/TaskList';
import PageContainer from '../components/Layout/PageContainer';
import PageHeader from '../components/Layout/PageHeader';
import { usePageMeta } from '../hooks/usePageMeta';
import { ROUTE_META } from '../routes/meta';

function TasksPage() {
  usePageMeta(ROUTE_META['/tasks']);

  return (
    <PageContainer>
      <PageHeader title="Tasks" description="Write it the way you would say it. Dates, !priority and #tags are picked up as you type." />
      <TaskList />
    </PageContainer>
  );
}

export default TasksPage;
