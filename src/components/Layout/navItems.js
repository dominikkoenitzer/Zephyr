import { CircleHelp, LayoutGrid, ListTodo, Settings, Timer } from 'lucide-react';

// The destinations, shared by the sidebar and its phone form.
export const MENU = [
  { name: 'Dashboard', href: '/', icon: LayoutGrid },
  { name: 'Tasks', href: '/tasks', icon: ListTodo },
  { name: 'Focus', href: '/focus', icon: Timer },
];

export const GENERAL = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: CircleHelp },
];
