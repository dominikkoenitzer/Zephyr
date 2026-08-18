import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { CheckSquare, CheckCheck, Timer, FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useTasks, useNotes, useStoreValue } from '../hooks/useStore';
import { localStorageService } from '../services/localStorage';

// Stagger-in for the stat tiles and quick links.
const staggerGrid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
};
const riseIn = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
};

const pad = (n) => String(n).padStart(2, '0');
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayKey = (value) => (value || '').split('T')[0];

const weekStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // Monday
  return d;
};

const readSessions = () => localStorageService.getFocusSessions();

const QUICK_LINKS = [
  { to: '/tasks', icon: CheckSquare, label: 'Tasks', desc: 'Plan & track your work' },
  { to: '/focus', icon: Timer, label: 'Focus Timer', desc: 'Start a Pomodoro session' },
  { to: '/notes', icon: FileText, label: 'Notes', desc: 'Capture your ideas' },
];

function Home() {
  const [tasks] = useTasks();
  const [notes] = useNotes();
  const [sessions] = useStoreValue(readSessions);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const todayKey = toKey(now);

  const stats = useMemo(() => {
    const start = weekStart().getTime();
    const focusSeconds = sessions
      .filter((s) => new Date(s.date).getTime() >= start)
      .reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
    const doneThisWeek = tasks.filter(
      (t) => t.completed && t.completedAt && new Date(t.completedAt).getTime() >= start
    ).length;

    return {
      active: tasks.filter((t) => !t.completed).length,
      doneThisWeek,
      focusMin: Math.round(focusSeconds / 60),
      notes: notes.length,
    };
  }, [tasks, notes, sessions]);

  const dueToday = useMemo(
    () => tasks.filter((t) => !t.completed && dayKey(t.dueDate) === todayKey).slice(0, 5),
    [tasks, todayKey]
  );

  const statTiles = [
    { label: 'Active tasks', value: stats.active, icon: CheckSquare },
    { label: 'Done this week', value: stats.doneThisWeek, icon: CheckCheck },
    { label: 'Focus this week', value: `${stats.focusMin}m`, icon: Timer },
    { label: 'Notes', value: stats.notes, icon: FileText },
  ];

  return (
    <section className="w-full flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-5xl mx-auto py-2 sm:py-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">{dateLabel}</p>
        <h1 className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-bold text-shimmer">{greeting}</h1>
        <p className="mt-3 text-base text-muted-foreground">Here’s your day at a glance.</p>

        {/* Stats */}
        <m.div variants={staggerGrid} initial="hidden" animate="show" className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statTiles.map((s) => {
            const Icon = s.icon;
            return (
              <m.div
                key={s.label}
                variants={riseIn}
                className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-4 sm:p-5 shadow-(--shadow-card)"
              >
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white shadow-brand">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{s.label}</p>
                </div>
                <p className="mt-3 text-3xl sm:text-4xl font-bold text-foreground">{s.value}</p>
              </m.div>
            );
          })}
        </m.div>

        {/* Today */}
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              Due today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dueToday.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing due today — enjoy the breathing room.</p>
            ) : (
              <ul className="space-y-1.5">
                {dueToday.map((t) => (
                  <li key={t.id}>
                    <Link to="/tasks" className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-accent/40">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="truncate text-sm text-foreground">{t.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Quick links */}
        <h2 className="mt-8 mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Jump back in</h2>
        <m.div variants={staggerGrid} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_LINKS.map((l) => {
            const Icon = l.icon;
            return (
              <m.div key={l.to} variants={riseIn} whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to={l.to}
                  className="group block h-full rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5 shadow-(--shadow-card) transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-brand">
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                  <p className="mt-4 text-base font-semibold text-foreground">{l.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{l.desc}</p>
                </Link>
              </m.div>
            );
          })}
        </m.div>
      </div>
    </section>
  );
}

export default Home;
