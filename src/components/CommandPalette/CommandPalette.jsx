import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  ArrowRight, Calendar, CheckCheck, CircleHelp, Download, House,
  Keyboard, Monitor, Moon, Play, Plus, Search, Settings as SettingsIcon,
  SquareCheck, Sun, Timer, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogOverlay, DialogPortal } from '../ui/dialog';
import { cn } from '../../lib/utils';
import { downloadBackup } from '../../lib/backup';
import { clearCompletedWithUndo } from '../../lib/taskActions';
import { localStorageService } from '../../services/localStorage';
import { searchService } from '../../services/searchService';
import { useTheme } from '../../hooks/useTheme';

const RESULT_LIMIT = 5;

/** Every word of the query has to appear somewhere in the item's text. */
const matches = (item, tokens) => {
  if (tokens.length === 0) return true;
  const haystack = `${item.label} ${item.hint || ''} ${(item.keywords || []).join(' ')}`.toLowerCase();
  return tokens.every((t) => haystack.includes(t));
};

/**
 * Lower sorts first. What the label itself says beats what a keyword says —
 * without this, "dark theme" put *Light theme* first, because every theme
 * command lists the others' colour words as keywords.
 */
const rank = (item, tokens) => {
  const label = item.label.toLowerCase();
  const phrase = tokens.join(' ');
  if (label.startsWith(phrase)) return 0;
  if (label.includes(phrase)) return 1;
  if (tokens.every((t) => label.includes(t))) return 2;
  return 3;
};

const dueLabel = (dueDate) => {
  if (!dueDate) return null;
  const [y, m, d] = String(dueDate).split('T')[0].split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((date - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0) return `${Math.abs(diff)} days overdue`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * One field that reaches everything: the app's commands plus a live search
 * across your tasks. Opened with Cmd/Ctrl+K or `/` from anywhere — including
 * on a phone, where the bar has no room for a search box.
 *
 * Built on the Radix dialog primitive rather than our own `DialogContent`
 * because a palette wants no close button in the corner and no padding around
 * the input.
 */
function CommandPalette({ open, onOpenChange, onShowShortcuts, onNewTask }) {
  const navigate = useNavigate();
  const { preference, setPreference } = useTheme();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // Each opening starts clean. Adjusted during render rather than in an effect
  // so the palette's first paint already shows an empty field.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }

  const commands = useMemo(() => {
    const close = () => onOpenChange(false);
    const go = (path) => {
      close();
      navigate(path);
    };

    const themeCommand = (value, label, Icon, extraKeywords) => ({
      id: `theme-${value}`,
      group: 'Theme',
      label,
      hint: preference === value ? 'Current' : undefined,
      icon: Icon,
      keywords: ['theme', 'appearance', 'colour', 'color', ...extraKeywords],
      run: () => {
        setPreference(value);
        close();
      },
    });

    const list = [
      {
        id: 'new-task',
        group: 'Actions',
        label: 'New task',
        hint: 'N',
        icon: Plus,
        keywords: ['add', 'todo', 'create'],
        run: () => {
          close();
          onNewTask();
        },
      },
      {
        id: 'start-focus',
        group: 'Actions',
        label: 'Start a focus session',
        icon: Play,
        keywords: ['pomodoro', 'timer', 'work'],
        run: () => go('/focus?start=1'),
      },
    ];

    const last = localStorageService.getLastSession();
    if (last?.task?.title) {
      list.push({
        id: 'resume-focus',
        group: 'Actions',
        label: `Resume "${last.task.title}"`,
        icon: Timer,
        keywords: ['focus', 'continue', 'again', 'pomodoro'],
        run: () => go('/focus?resume=1&start=1'),
      });
    }

    const completed = localStorageService.getTasks().filter((t) => t.completed).length;
    if (completed > 0) {
      list.push({
        id: 'clear-completed',
        group: 'Actions',
        label: `Clear ${completed} completed task${completed === 1 ? '' : 's'}`,
        icon: Trash2,
        keywords: ['done', 'tidy', 'delete', 'archive'],
        run: () => {
          close();
          clearCompletedWithUndo();
        },
      });
    }

    list.push(
      { id: 'go-home', group: 'Go to', label: 'Home', icon: House, keywords: ['dashboard', 'today'], run: () => go('/') },
      { id: 'go-tasks', group: 'Go to', label: 'Tasks', icon: SquareCheck, keywords: ['todo', 'list'], run: () => go('/tasks') },
      { id: 'go-focus', group: 'Go to', label: 'Focus timer', icon: Timer, keywords: ['pomodoro', 'session'], run: () => go('/focus') },
      { id: 'go-settings', group: 'Go to', label: 'Settings', icon: SettingsIcon, keywords: ['preferences', 'notifications', 'data'], run: () => go('/settings') },
      { id: 'go-help', group: 'Go to', label: 'Help', icon: CircleHelp, keywords: ['faq', 'privacy', 'support'], run: () => go('/help') },
      themeCommand('light', 'Light theme', Sun, ['light', 'day', 'bright']),
      themeCommand('dark', 'Dark theme', Moon, ['dark', 'night']),
      themeCommand('system', 'Match system theme', Monitor, ['system', 'auto', 'os']),
      {
        id: 'shortcuts',
        group: 'App',
        label: 'Keyboard shortcuts',
        hint: '?',
        icon: Keyboard,
        keywords: ['keys', 'hotkeys', 'bindings'],
        run: () => {
          close();
          onShowShortcuts();
        },
      },
      {
        id: 'export',
        group: 'App',
        label: 'Export a backup',
        icon: Download,
        keywords: ['download', 'save', 'data', 'json'],
        run: () => {
          close();
          const { fileName } = downloadBackup();
          toast.success('Backup downloaded', { description: fileName });
        },
      }
    );

    return list;
  }, [preference, setPreference, navigate, onOpenChange, onNewTask, onShowShortcuts]);

  const trimmed = query.trim();

  const items = useMemo(() => {
    const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return commands;

    const commandHits = commands
      .filter((c) => matches(c, tokens))
      .map((c, index) => ({ c, index, rank: rank(c, tokens) }))
      // Sort on the rank, keeping the authored order inside each band.
      .sort((a, b) => a.rank - b.rank || a.index - b.index)
      .slice(0, 6)
      // Under a query the authored groups would interleave and repeat their
      // headings, so ranked commands sit under one heading instead.
      .map((entry) => ({ ...entry.c, group: 'Commands' }));

    const close = () => onOpenChange(false);
    const go = (path) => {
      close();
      navigate(path);
    };

    const found = searchService.searchAll(trimmed);
    const taskHits = (found.tasks || []).slice(0, RESULT_LIMIT).map((task) => ({
      id: `task-${task.id}`,
      group: 'Tasks',
      label: task.title,
      hint: task.completed ? 'Done' : dueLabel(task.dueDate),
      icon: task.completed ? CheckCheck : task.dueDate ? Calendar : SquareCheck,
      run: () => go(`/tasks?task=${encodeURIComponent(task.id)}`),
    }));

    return [...commandHits, ...taskHits];
  }, [commands, trimmed, navigate, onOpenChange]);

  // A shorter result list can leave the cursor past the end.
  const selected = items.length === 0 ? -1 : Math.min(activeIndex, items.length - 1);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [selected, items.length]);

  const onKeyDown = (event) => {
    if (items.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((selected + 1) % items.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((selected - 1 + items.length) % items.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(items.length - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      items[selected]?.run();
    }
  };

  // Render the flat list as its groups, keeping the flat index for selection.
  const groups = [];
  items.forEach((item, index) => {
    const previous = groups[groups.length - 1];
    if (previous && previous.title === item.group) previous.items.push({ item, index });
    else groups.push({ title: item.group, items: [{ item, index }] });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            // Focus the field, never the first option.
            event.preventDefault();
            inputRef.current?.focus();
          }}
          className="fixed left-1/2 top-4 z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border/65 bg-card p-0 shadow-(--shadow-overlay) duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:top-[12vh]"
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>

          <div className="flex items-center gap-3 border-b border-border/60 px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search or run a command…"
              aria-label="Search your tasks, or run a command"
              role="combobox"
              aria-expanded="true"
              aria-controls="command-palette-list"
              aria-autocomplete="list"
              aria-activedescendant={selected >= 0 ? `command-item-${selected}` : undefined}
              className="h-14 w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          <div
            id="command-palette-list"
            ref={listRef}
            role="listbox"
            aria-label="Results"
            className="max-h-[min(60vh,26rem)] overflow-y-auto scrollbar-thin p-2"
          >
            {items.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Nothing matches “{trimmed}”.
              </p>
            ) : (
              groups.map((group) => (
                <div key={group.title} role="group" aria-label={group.title} className="mb-1 last:mb-0">
                  <p className="px-3 pb-1 pt-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {group.title}
                  </p>
                  {group.items.map(({ item, index }) => {
                    const Icon = item.icon || ArrowRight;
                    const isActive = index === selected;
                    return (
                      <div
                        key={item.id}
                        id={`command-item-${index}`}
                        role="option"
                        aria-selected={isActive}
                        data-active={isActive}
                        onMouseMove={() => setActiveIndex(index)}
                        onClick={() => item.run()}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                          isActive ? 'bg-accent text-accent-foreground' : 'text-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.hint && (
                          <span className="max-w-[40%] shrink-0 truncate text-xs text-muted-foreground">
                            {item.hint}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <div className="hidden items-center gap-4 border-t border-border/60 px-4 py-2.5 text-[12px] text-muted-foreground sm:flex">
            <span className="flex items-center gap-1">
              <kbd className="kbd">↑</kbd>
              <kbd className="kbd">↓</kbd>
              move
            </span>
            <span className="flex items-center gap-1">
              <kbd className="kbd">↵</kbd>
              open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="kbd">esc</kbd>
              close
            </span>
            <span className="ml-auto">Type “shortcuts” for the full key map</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

export default CommandPalette;
