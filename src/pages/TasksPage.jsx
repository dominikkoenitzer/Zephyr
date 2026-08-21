import TaskList from '../components/TaskManager/TaskList';
import PageContainer from '../components/Layout/PageContainer';

function TasksPage() {
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
