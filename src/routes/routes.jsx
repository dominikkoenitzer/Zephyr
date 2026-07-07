import { Suspense, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import PageLoader from '../components/ui/PageLoader';
import AppLayout from '../app/AppLayout';
import ErrorFallback from '../components/ErrorBoundary/ErrorFallback';

const TasksPage = lazy(() => import('../pages/TasksPage'));
const Home = lazy(() => import('../pages/Home'));
const FocusTimer = lazy(() => import('../pages/FocusTimer'));
const Notes = lazy(() => import('../pages/Notes'));
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
        element: withPageLoader(Home),
      },
      {
        path: 'home',
        element: withPageLoader(Home),
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
        path: 'notes',
        element: withPageLoader(Notes),
      },
      {
        path: 'journal',
        element: <Navigate to="/notes" replace />,
      },
      {
        path: 'calendar',
        element: <Navigate to="/tasks" replace />,
      },
      {
        path: 'settings',
        element: withPageLoader(Settings),
      },
      {
        path: 'help',
        element: withPageLoader(Help),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
];

