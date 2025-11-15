import TaskList from '../components/TaskManager/TaskList';

function TasksPage() {
  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
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
