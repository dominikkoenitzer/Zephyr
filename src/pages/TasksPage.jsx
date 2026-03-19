import TaskList from '../components/TaskManager/TaskList';
import PageHeader from '../components/Layout/PageHeader';

function TasksPage() {
  return (
    <div className="w-full flex-1 panel-stack border border-border/60 rounded-2xl bg-card/80 p-responsive overflow-y-auto min-h-0">
      <PageHeader
        title="Tasks"
        description="Organize your work and stay productive"
      />
      
      <TaskList />
    </div>
  );
}

export default TasksPage;
