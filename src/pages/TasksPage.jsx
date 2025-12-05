import TaskList from '../components/TaskManager/TaskList';

function TasksPage() {
  return (
    <div className="w-full flex-1 panel-stack border border-border/60 rounded-2xl bg-card/80 p-responsive overflow-y-auto min-h-0">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">Tasks</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Organize your work and stay productive
        </p>
      </div>
      
      <TaskList />
    </div>
  );
}

export default TasksPage;
