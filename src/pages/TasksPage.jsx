import TaskList from '../components/TaskManager/TaskList';

function TasksPage() {
  return (
    <div className="w-full h-full lg:h-[calc(100vh-4rem)] border-2 border-border rounded-xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 bg-card lg:overflow-hidden overflow-y-auto lg:overflow-y-hidden flex flex-col">
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
