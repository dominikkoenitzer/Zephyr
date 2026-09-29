import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { ArrowUpRight, Pause, Play, Plus, Timer } from 'lucide-react';
import { useTasks, useStoreValue } from '../hooks/useStore';
import { useTimerSnapshot } from '../hooks/useTimerSnapshot';
import { localStorageService } from '../services/localStorage';
import { usePageMeta } from '../hooks/usePageMeta';
import { ROUTE_META } from '../routes/meta';
import { cn } from '../lib/utils';
import {
  dashboardStats,
  dueLabel,
  dueSoon,
  focusByDay,
  formatMinutes,
  recentSessions,
  upNext,
} from '../lib/dashboard';
import { formatTime } from '../components/FocusTimer/usePomodoro';
import SunDial from '../components/FocusTimer/SunDial';
import PageHeader from '../components/Layout/PageHeader';
import { Button } from '../components/ui/button';
import { NightSurface } from '../components/ui/night-surface';

const readSessions = () => localStorageService.getFocusSessions();

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};
const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
};

const panel = 'rounded-3xl bg-card p-6 shadow-(--shadow-card)';
const panelTitle = 'text-[17px] font-semibold tracking-[-0.015em]';

function Chip({ className, children }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold', className)}>
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- stats */

function StatCard({ to, label, value, note, lead = false }) {
  const Surface = lead ? NightSurface : 'div';
  return (
    <m.div variants={rise}>
      <Link
        to={to}
        className="group block h-full rounded-3xl transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Surface className={cn('h-full p-5 sm:p-6', !lead && panel)}>
          <div className="flex items-start justify-between gap-3">
            <p className={cn('text-[14px] font-semibold leading-tight sm:text-[17px]', lead ? 'text-hero-foreground' : 'text-foreground')}>
              {label}
            </p>
            <span
              aria-hidden="true"
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-transform duration-300 group-hover:rotate-45',
                lead ? 'border-hero-foreground/30 bg-hero-foreground text-hero-to' : 'border-foreground/15 text-foreground'
              )}
            >
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-5 whitespace-nowrap text-[2rem] font-semibold leading-none tracking-[-0.04em] tabular-nums sm:text-[3.25rem]">
            {value}
          </p>
          <p className={cn('mt-4 text-[13px]', lead ? 'text-hero-foreground/75' : 'text-muted-foreground')}>{note}</p>
        </Surface>
      </Link>
    </m.div>
  );
}

/* ---------------------------------------------------------- week chart */

function WeekChart({ days }) {
  const max = Math.max(60, ...days.map((d) => d.minutes));
  return (
    <m.section variants={rise} className={cn(panel, 'flex flex-col')} aria-labelledby="week-title">
      <h2 id="week-title" className={panelTitle}>Focus this week</h2>

      <ol className="mt-6 grid flex-1 grid-cols-7 items-end gap-2 sm:gap-4" aria-label="Minutes focused per day">
        {days.map((d) => {
          const empty = d.minutes === 0;
          const height = empty ? (d.isFuture ? 34 : 46) : Math.max(22, Math.round((d.minutes / max) * 100));
          return (
            <li key={d.key} className="flex h-full min-h-44 flex-col items-center justify-end gap-3">
              <span className="sr-only">{`${d.name}: ${d.minutes} minutes`}</span>
              <div aria-hidden="true" className="relative flex w-full flex-1 items-end justify-center pt-9">
                <m.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                  className={cn(
                    'relative w-full max-w-12 rounded-full',
                    empty
                      ? cn('border-2 border-dashed', d.isToday ? 'border-primary/60' : 'border-border')
                      : d.isToday
                        ? 'bg-linear-to-t from-primary to-sun'
                        : 'bg-night'
                  )}
                >
                  {d.isToday && !empty && (
                    <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full bg-foreground px-2 py-0.5 text-[11px] font-semibold tabular-nums text-background">
                      {formatMinutes(d.minutes)}
                    </span>
                  )}
                </m.div>
              </div>
              <span
                aria-hidden="true"
                className={cn('text-[13px]', d.isToday ? 'font-bold text-foreground' : 'font-medium text-muted-foreground')}
              >
                {d.letter}
              </span>
            </li>
          );
        })}
      </ol>
    </m.section>
  );
}

/* -------------------------------------------------------------- up next */

const focusHref = (task) =>
  `/focus?${new URLSearchParams({ taskId: task.id, title: task.title, start: '1' }).toString()}`;

function UpNext({ task }) {
  const late = task && dueLabel(task.dueDate).includes('late');
  return (
    <m.section variants={rise} className={cn(panel, 'flex flex-col')} aria-labelledby="next-title">
      <h2 id="next-title" className={panelTitle}>Up next</h2>
      {task ? (
        <>
          <Link
            to={`/tasks?task=${encodeURIComponent(task.id)}`}
            className="mt-5 line-clamp-3 text-[1.625rem] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground transition-colors hover:text-primary-strong"
          >
            {task.title}
          </Link>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip className={late ? 'bg-destructive/10 text-destructive-strong' : 'bg-accent text-foreground'}>
              {dueLabel(task.dueDate)}
            </Chip>
            {task.priority === 'high' && <Chip className="bg-primary/10 text-primary-strong">High priority</Chip>}
            {(task.tags || []).slice(0, 2).map((tag) => (
              <Chip key={tag} className="bg-accent text-muted-foreground">#{tag}</Chip>
            ))}
          </div>
          <div className="mt-auto pt-6">
            <Link
              to={focusHref(task)}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-linear-to-br from-hero-from to-hero-to text-[15px] font-semibold text-hero-foreground transition-transform dark:ring-1 dark:ring-inset dark:ring-white/12 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Timer className="h-[18px] w-[18px]" />
              Focus on this
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="mt-5 text-[1.625rem] font-semibold leading-[1.15] tracking-[-0.025em]">Nothing waiting</p>
          <Link
            to="/tasks?new=1"
            className="mt-6 flex h-12 items-center justify-center gap-2 rounded-full border border-foreground/15 text-[15px] font-semibold transition-colors hover:bg-accent"
          >
            <Plus className="h-4 w-4" />
            Add a task
          </Link>
        </>
      )}
    </m.section>
  );
}

/* ------------------------------------------------------------- due soon */

function DayTile({ dueDate, late }) {
  const [y, mo, d] = String(dueDate).split('T')[0].split('-').map(Number);
  const date = new Date(y, mo - 1, d);
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl leading-none',
        late ? 'bg-destructive/10 text-destructive-strong' : 'bg-accent text-foreground'
      )}
    >
      <span className="text-[15px] font-bold tabular-nums">{date.getDate()}</span>
      <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider">
        {date.toLocaleDateString('en-GB', { month: 'short' })}
      </span>
    </span>
  );
}

function DueSoon({ tasks }) {
  return (
    <m.section variants={rise} className={panel} aria-labelledby="due-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="due-title" className={panelTitle}>Due soon</h2>
        <Link
          to="/tasks?new=1"
          className="flex h-8 items-center gap-1 rounded-full border border-foreground/15 px-3 text-[13px] font-semibold transition-colors hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </Link>
      </div>
      {tasks.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">Nothing due</p>
      ) : (
        <ul className="mt-4 space-y-1">
          {tasks.map((t) => {
            const label = dueLabel(t.dueDate);
            const late = label.includes('late');
            return (
              <li key={t.id}>
                <Link
                  to={`/tasks?task=${encodeURIComponent(t.id)}`}
                  className="-mx-2 flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-accent/70"
                >
                  <DayTile dueDate={t.dueDate} late={late} />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold">{t.title}</span>
                    <span className={cn('block text-[12px]', late ? 'text-destructive-strong' : 'text-muted-foreground')}>
                      {label}
                      {t.tags?.[0] ? ` · #${t.tags[0]}` : ''}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </m.section>
  );
}

/* ------------------------------------------------------ recent sessions */

function sessionWhen(iso) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const today = new Date().toDateString() === d.toDateString();
  return today ? `Today, ${time}` : `${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}, ${time}`;
}

function RecentSessions({ sessions }) {
  return (
    <m.section variants={rise} className={panel} aria-labelledby="sessions-title">
      <h2 id="sessions-title" className={panelTitle}>Recent sessions</h2>
      {sessions.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">No sessions yet</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {sessions.map((s, i) => (
            <li key={s.id || `${s.date}-${i}`} className="flex items-center gap-3 py-3">
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
                <Timer className="h-[18px] w-[18px] text-primary-strong" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{s.task?.title || 'Open session'}</span>
                <span className="block text-[12px] text-muted-foreground">{sessionWhen(s.date)}</span>
              </span>
              <Chip className="bg-accent tabular-nums text-foreground">{formatMinutes((Number(s.duration) || 0) / 60)}</Chip>
            </li>
          ))}
        </ul>
      )}
    </m.section>
  );
}

/* ------------------------------------------------------------- progress */

const polar = (deg, r = 80) => {
  const a = (deg * Math.PI) / 180;
  return [100 + r * Math.cos(a), 100 + r * Math.sin(a)];
};
const arc = (from, to) => {
  const [x0, y0] = polar(from);
  const [x1, y1] = polar(to);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A 80 80 0 ${to - from > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};

function Progress({ done, open, overdue }) {
  const total = done + open;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const parts = [
    { key: 'done', label: 'Done', value: done, stroke: 'hsl(var(--primary))', dot: 'bg-primary' },
    { key: 'open', label: 'Open', value: open - overdue, stroke: 'hsl(var(--night))', dot: 'bg-night' },
    { key: 'late', label: 'Overdue', value: overdue, stroke: 'hsl(var(--destructive))', dot: 'bg-destructive' },
  ];
  const GAP = 5;
  let cursor = 180;
  const segments = total
    ? parts
        .filter((p) => p.value > 0)
        .map((p) => {
          const span = (p.value / total) * 180;
          const seg = { ...p, from: cursor, to: cursor + span };
          cursor += span;
          return seg;
        })
    : [];

  return (
    <m.section variants={rise} className={cn(panel, 'flex flex-col')} aria-labelledby="progress-title">
      <h2 id="progress-title" className={panelTitle}>Progress</h2>
      <div className="relative mx-auto mt-4 w-full max-w-64">
        <svg viewBox="0 0 200 112" className="w-full" aria-hidden="true">
          <path d={arc(180, 360)} stroke="hsl(var(--accent))" strokeWidth="22" fill="none" strokeLinecap="round" />
          {segments.map((s, i) => {
            const from = s.from + (i === 0 ? 0 : GAP / 2);
            const to = s.to - (i === segments.length - 1 ? 0 : GAP / 2);
            return to > from ? (
              <m.path
                key={s.key}
                d={arc(from, to)}
                stroke={s.stroke}
                strokeWidth="22"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7, delay: 0.1 + i * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              />
            ) : null;
          })}
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <p className="text-[2.5rem] font-semibold leading-none tracking-[-0.04em] tabular-nums">{pct}%</p>
          <p className="mt-1 text-[13px] text-muted-foreground">done</p>
        </div>
      </div>
      <ul className="mt-auto flex flex-wrap justify-center gap-x-5 gap-y-2 pt-6 text-[13px]">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-2">
            <span aria-hidden="true" className={cn('h-2.5 w-2.5 rounded-full', p.dot)} />
            <span className="text-muted-foreground">{p.label}</span>
            <span className="font-semibold tabular-nums">{p.value}</span>
          </li>
        ))}
      </ul>
    </m.section>
  );
}

/* ---------------------------------------------------------------- timer */

function TimerCard({ timer, defaultMinutes }) {
  const running = Boolean(timer?.running && timer.timeLeft > 0);
  const paused = Boolean(timer && !timer.running && timer.total && timer.timeLeft > 0 && timer.timeLeft < timer.total);
  const seconds = timer?.timeLeft || defaultMinutes * 60;
  const progress = timer?.total ? ((timer.total - timer.timeLeft) / timer.total) * 100 : 0;
  const state = running ? (timer.isBreak ? 'On a break' : 'Running') : paused ? 'Paused' : 'Ready';

  return (
    <m.section variants={rise} aria-labelledby="timer-title" className="h-full">
      <NightSurface className="flex h-full min-h-60 flex-col p-6">
        <div className="flex items-center justify-between">
          <h2 id="timer-title" className="text-[17px] font-semibold">Focus timer</h2>
          <span className="rounded-full bg-hero-foreground/12 px-2.5 py-0.5 text-[12px] font-semibold text-hero-foreground/85">
            {state}
          </span>
        </div>
        <div className="mt-auto pt-4">
          <SunDial progress={progress} isBreak={Boolean(timer?.isBreak)} running={running}>
            <p className="text-[2.25rem] font-semibold leading-none tracking-[-0.03em] tabular-nums">{formatTime(seconds)}</p>
          </SunDial>
        </div>
        {timer?.focusTask?.title && (
          <p className="mt-3 truncate text-sm text-hero-foreground/70">{timer.focusTask.title}</p>
        )}
        <div className="mt-5 flex items-center gap-3">
          <Link
            to={running || paused ? '/focus' : '/focus?start=1'}
            aria-label={running ? 'Open the running timer' : paused ? 'Open the paused timer' : 'Start the timer'}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-hero-foreground text-hero-to transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun"
          >
            {running ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
          </Link>
          <Link to="/focus" className="text-sm font-semibold text-hero-foreground/80 transition-colors hover:text-hero-foreground">
            Open Focus
          </Link>
        </div>
      </NightSurface>
    </m.section>
  );
}

/* ----------------------------------------------------------------- page */

function Home() {
  usePageMeta(ROUTE_META['/']);

  const [tasks] = useTasks();
  const [sessions] = useStoreValue(readSessions);
  const timer = useTimerSnapshot();

  const now = new Date();
  const weekday = now.toLocaleDateString('en-GB', { weekday: 'long' });
  const date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

  const stats = useMemo(() => dashboardStats(tasks, sessions), [tasks, sessions]);
  const week = useMemo(() => focusByDay(sessions), [sessions]);
  const next = useMemo(() => upNext(tasks), [tasks]);
  const soon = useMemo(() => dueSoon(tasks, 4), [tasks]);
  const recent = useMemo(() => recentSessions(sessions, 3), [sessions]);
  // A brand-new visitor: no task written, no session finished.
  const fresh = tasks.length === 0 && sessions.length === 0;
  const defaultMinutes = Math.round((timer?.workTime || 1500) / 60);

  const due =
    stats.dueToday || stats.overdue
      ? [stats.dueToday && `${stats.dueToday} due today`, stats.overdue && `${stats.overdue} overdue`]
          .filter(Boolean)
          .join(', ')
      : 'nothing due today';
  const summary = `${date}, ${due}.`;

  return (
    <div className="pb-4">
      {/* The h1 Google indexes says what the app is; the day keeps the
          title's type as a paragraph. */}
      <h1 className="sr-only">Zephyr, a to-do list and Pomodoro focus timer</h1>
      <PageHeader
        as="p"
        title={weekday}
        description={summary}
        actions={
          <>
            <Button asChild>
              <Link to="/tasks?new=1">
                <Plus className="h-4 w-4" />
                New task
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/focus?start=1">
                <Timer className="h-4 w-4" />
                Start focus
              </Link>
            </Button>
          </>
        }
      />

      <m.div variants={stagger} initial="hidden" animate="show" className="space-y-(--panel-gap)">
        {!fresh && (
        <m.div variants={stagger} className="grid grid-cols-2 gap-(--panel-gap) xl:grid-cols-4">
          <StatCard
            lead
            to="/tasks"
            label="Open tasks"
            value={stats.open}
            note={`${stats.dueToday} due today`}
          />
          <StatCard
            to="/tasks"
            label="Overdue"
            value={stats.overdue}
            note={stats.overdue ? 'Late' : 'On time'}
          />
          <StatCard
            to="/focus"
            label="Focus time"
            value={formatMinutes(stats.focusMinutes)}
            note={`${stats.sessions} ${stats.sessions === 1 ? 'session' : 'sessions'}`}
          />
          <StatCard
            to="/tasks"
            label="Done"
            value={stats.done}
            note={`${stats.doneThisWeek} this week`}
          />
        </m.div>
        )}

        {fresh ? (
          /* Nothing written and nothing focused yet: show only what can be
             acted on. The figures, the chart and the gauge arrive with the
             first task or session instead of greeting a new visitor with zeros. */
          <m.div variants={stagger} className="grid grid-cols-1 gap-(--panel-gap) md:grid-cols-2">
            <div className="[&>*]:h-full">
              <UpNext task={next} />
            </div>
            <div>
              <TimerCard timer={timer} defaultMinutes={defaultMinutes} />
            </div>
          </m.div>
        ) : (
        <>
        <m.div variants={stagger} className="grid grid-cols-1 gap-(--panel-gap) md:grid-cols-2 xl:grid-cols-12">
          <div className="md:col-span-2 xl:col-span-6 [&>*]:h-full">
            <WeekChart days={week} />
          </div>
          <div className="xl:col-span-3 [&>*]:h-full">
            <UpNext task={next} />
          </div>
          <div className="xl:col-span-3 [&>*]:h-full">
            <DueSoon tasks={soon} />
          </div>
        </m.div>

        <m.div variants={stagger} className="grid grid-cols-1 gap-(--panel-gap) md:grid-cols-2 xl:grid-cols-12">
          <div className="md:col-span-2 xl:col-span-5 [&>*]:h-full">
            <RecentSessions sessions={recent} />
          </div>
          <div className="xl:col-span-4 [&>*]:h-full">
            <Progress done={stats.done} open={stats.open} overdue={stats.overdue} />
          </div>
          <div className="xl:col-span-3">
            <TimerCard timer={timer} defaultMinutes={defaultMinutes} />
          </div>
        </m.div>
        </>
        )}
      </m.div>
    </div>
  );
}

export default Home;
