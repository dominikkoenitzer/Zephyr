// Ensure React loads first by importing it at the very top
import React from 'react';
import ReactDOM from 'react-dom/client';
// Import React Router after React
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
// Import Analytics after React
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import { routes } from './routes/routes';
import './index.css';
import { themeService } from './services/themeService';

// Paint the stored theme before React renders, so there is no flash of the
// wrong scheme. This also starts following the OS while the preference is
// "system".
themeService.initialize();

// v7_startTransition was a v6 opt-in; it is the behaviour in v7 and passing
// the flag now only earns a deprecation warning.
const router = createBrowserRouter(routes);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <VercelAnalytics />
  </React.StrictMode>
);