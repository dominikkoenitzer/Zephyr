import TaskList from '../components/TaskManager/TaskList';
import PageContainer from '../components/Layout/PageContainer';
import PageHeader from '../components/Layout/PageHeader';
import { usePageMeta } from '../hooks/usePageMeta';
import { ROUTE_META } from '../routes/meta';

function TasksPage() {
  usePageMeta(ROUTE_META['/tasks']);

  return (
    <PageContainer>
      <PageHeader title="Tasks" />
      <TaskList />
    </PageContainer>
  );
}

export default TasksPage;
