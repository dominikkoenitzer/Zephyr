import { lazy } from 'react';

// The lazy page components live apart from the route table so that each file
// has a single kind of export: components here, plain data there. React Fast
// Refresh can only reload a module whose exports are all components, which is
// what eslint-plugin-react-refresh enforces.
export const TasksPage = lazy(() => import('../pages/TasksPage'));
export const Home = lazy(() => import('../pages/Home'));
export const FocusTimer = lazy(() => import('../pages/FocusTimer'));
export const Notes = lazy(() => import('../pages/Notes'));
export const Settings = lazy(() => import('../pages/Settings'));
export const Help = lazy(() => import('../pages/Help'));
