import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Analytics as VercelAnalytics } from '@vercel/analytics/react'
import App from './App'
import Dashboard from './pages/Dashboard'
import TasksPage from './pages/TasksPage'
import FocusTimer from './pages/FocusTimer'
import Calendar from './pages/Calendar'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Help from './pages/Help'
import ErrorFallback from './components/ErrorBoundary/ErrorFallback'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorFallback error={{ message: 'Page not found or an unexpected error occurred.' }} />,
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: '/tasks',
        element: <TasksPage />,
      },
      {
        path: '/focus',
        element: <FocusTimer />,
      },
      {
        path: '/calendar',
        element: <Calendar />,
      },
      {
        path: '/analytics',
        element: <Analytics />,
      },
      {
        path: '/settings',
        element: <Settings />,
      },
      {
        path: '/help',
        element: <Help />,
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