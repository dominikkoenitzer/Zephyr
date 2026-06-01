import TaskList from '../components/TaskManager/TaskList';
import PageHeader from '../components/Layout/PageHeader';
import PageContainer from '../components/Layout/PageContainer';

function TasksPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Tasks"
        description="Organize your work and stay productive"
      />

      <TaskList />
    </PageContainer>
  );
}

export default TasksPage;
