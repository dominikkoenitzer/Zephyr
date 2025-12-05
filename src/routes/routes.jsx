import { Suspense, lazy } from 'react';
import PageLoader from '../components/ui/PageLoader';
import AppLayout from '../app/AppLayout';
import ErrorFallback from '../components/ErrorBoundary/ErrorFallback';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const TasksPage = lazy(() => import('../pages/TasksPage'));
const FocusTimer = lazy(() => import('../pages/FocusTimer'));
const Calendar = lazy(() => import('../pages/Calendar'));
const Notes = lazy(() => import('../pages/Notes'));
const Journal = lazy(() => import('../pages/Journal'));
const Settings = lazy(() => import('../pages/Settings'));
const Help = lazy(() => import('../pages/Help'));

const withPageLoader = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const routes = [
  {
    element: <AppLayout />,
    errorElement: <ErrorFallback error={{ message: 'Page not found or an unexpected error occurred.' }} />,
    children: [
      {
        index: true,
        element: withPageLoader(Dashboard),
      },
      {
        path: 'tasks',
        element: withPageLoader(TasksPage),
      },
      {
        path: 'focus',
        element: withPageLoader(FocusTimer),
      },
      {
        path: 'calendar',
        element: withPageLoader(Calendar),
      },
      {
        path: 'notes',
        element: withPageLoader(Notes),
      },
      {
        path: 'journal',
        element: withPageLoader(Journal),
      },
      {
        path: 'settings',
        element: withPageLoader(Settings),
      },
      {
        path: 'help',
        element: withPageLoader(Help),
      },
    ],
  },
];

