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

// Initialize theme before React renders
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme') || 'system';
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  
  if (savedTheme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.classList.add(systemTheme);
  } else {
    root.classList.add(savedTheme);
  }
};

// Apply theme immediately
initializeTheme();
// Clear any legacy garden theme and sync with current color mode
themeService.initialize();

const router = createBrowserRouter(routes, {
  future: {
    v7_startTransition: true,
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <VercelAnalytics />
  </React.StrictMode>
);