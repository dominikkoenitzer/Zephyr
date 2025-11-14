import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Analytics as VercelAnalytics } from '@vercel/analytics/react'
import App from './App'
import ErrorFallback from './components/ErrorBoundary/ErrorFallback'
import './index.css'

// Lazy load pages for code-splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const TasksPage = lazy(() => import('./pages/TasksPage'))
const FocusTimer = lazy(() => import('./pages/FocusTimer'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Settings = lazy(() => import('./pages/Settings'))
const Help = lazy(() => import('./pages/Help'))

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
)

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorFallback error={{ message: 'Page not found or an unexpected error occurred.' }} />,
    children: [
      {
        path: '/',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: '/tasks',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TasksPage />
          </Suspense>
        ),
      },
      {
        path: '/focus',
        element: (
          <Suspense fallback={<PageLoader />}>
            <FocusTimer />
          </Suspense>
        ),
      },
      {
        path: '/calendar',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Calendar />
          </Suspense>
        ),
      },
      {
        path: '/analytics',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Analytics />
          </Suspense>
        ),
      },
      {
        path: '/settings',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Settings />
          </Suspense>
        ),
      },
      {
        path: '/help',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Help />
          </Suspense>
        ),
      },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <VercelAnalytics />
  </React.StrictMode>
)