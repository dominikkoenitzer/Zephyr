import TaskList from '../components/TaskManager/TaskList';
import PageContainer from '../components/Layout/PageContainer';
import { usePageMeta } from '../hooks/usePageMeta';
import { ROUTE_META } from '../routes/meta';

function TasksPage() {
  usePageMeta(ROUTE_META['/tasks']);

  return (
    <PageContainer>
      {/* The top bar sets "TASKS" in the only large type the shell has, so
          repeating it here would be the same word twice. The heading stays in
          the document for screen readers and the outline. */}
      <h1 className="sr-only">Tasks</h1>
      <TaskList />
    </PageContainer>
  );
}

export default TasksPage;
