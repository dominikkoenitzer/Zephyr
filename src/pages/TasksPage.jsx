import TaskList from '../components/TaskManager/TaskList';
import PageContainer from '../components/Layout/PageContainer';
import { usePageMeta } from '../hooks/usePageMeta';

function TasksPage() {
  usePageMeta({
    title: 'Tasks — Zephyr',
    description:
      'A to-do list with due dates, priorities and #tags. Natural-language quick add understands plain English, and the list groups itself into Overdue, Today, Tomorrow and Later.',
    path: '/tasks',
  });

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
