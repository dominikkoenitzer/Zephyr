import { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import PageLoader from '../components/ui/PageLoader';
import AppLayout from '../app/AppLayout';
import ErrorFallback from '../components/ErrorBoundary/ErrorFallback';
import { FocusTimer, Help, Home, NotFound, Privacy, Settings, TasksPage, Terms } from './pages';

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
        path: 'tasks',
        element: withPageLoader(TasksPage),
      },
      {
        path: 'focus',
        element: withPageLoader(FocusTimer),
      },
      {
        // Notes was removed; these keep old links and bookmarks alive.
        path: 'notes',
        element: <Navigate to="/tasks" replace />,
      },
      {
        path: 'journal',
        element: <Navigate to="/tasks" replace />,
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
        path: 'privacy',
        element: withPageLoader(Privacy),
      },
      {
        path: 'terms',
        element: withPageLoader(Terms),
      },
      {
        path: '*',
        element: withPageLoader(NotFound),
      },
    ],
  },
];

