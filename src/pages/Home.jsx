import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useTasks, useStoreValue } from '../hooks/useStore';
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
  { to: '/tasks', label: 'Tasks', desc: 'Plan and track your work' },
  { to: '/focus', label: 'Focus', desc: 'Start a Pomodoro session' },
];

function Home() {
  const [tasks] = useTasks();
  const [sessions] = useStoreValue(readSessions);

  const now = new Date();
  // Before 5am still reads as "evening" — at 00:19 "Good morning" is just wrong.
  const hour = now.getHours();
  const greeting =
    hour < 5 ? 'Good evening' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
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
      sessions: sessions.filter((s) => new Date(s.date).getTime() >= start).length,
    };
  }, [tasks, sessions]);

  const dueToday = useMemo(
    () => tasks.filter((t) => !t.completed && dayKey(t.dueDate) === todayKey).slice(0, 5),
    [tasks, todayKey]
  );

  const statTiles = [
    { label: 'Active tasks', value: stats.active },
    { label: 'Done this week', value: stats.doneThisWeek },
    { label: 'Focus this week', value: `${stats.focusMin}m` },
    { label: 'Sessions this week', value: stats.sessions },
  ];

  return (
    <section className="w-full flex-1 min-h-0 overflow-y-auto">
      <div className="page-width py-2 sm:py-4">
        {/* The one deliberate move: the greeting is set larger and tighter than
            a dashboard would normally allow, and the date sits above it as a
            small tracked line. Everything below stays quiet so this reads as a
            decision rather than as decoration. */}
        <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          {dateLabel}
        </p>
        <h1 className="mt-3 text-[2.5rem] font-semibold leading-[0.95] tracking-[-0.035em] text-foreground sm:text-6xl lg:text-7xl">
          {greeting}
        </h1>
        <p className="mt-4 text-base text-muted-foreground">Here’s your day at a glance.</p>

        {/* Figures — no tiles, no icon chips, no gradient. A number and its
            label, separated by a hairline. */}
        <m.dl
          variants={staggerGrid}
          initial="hidden"
          animate="show"
          className="mt-14 grid grid-cols-2 gap-y-8 border-t border-border pt-8 sm:grid-cols-4 sm:gap-y-0"
        >
          {statTiles.map((s, i) => (
            <m.div
              key={s.label}
              variants={riseIn}
              className={i === 0 ? 'sm:pr-8' : 'sm:border-l sm:border-border sm:pl-8 sm:pr-8'}
            >
              <dd className="text-4xl font-semibold tabular-nums tracking-[-0.03em] text-foreground sm:text-[2.75rem]">
                {s.value}
              </dd>
              <dt className="mt-2.5 text-[12px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {s.label}
              </dt>
            </m.div>
          ))}
        </m.dl>

        {/* Today */}
        <section className="mt-14 border-t border-border pt-8">
          <h2 className="text-[12px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Due today
          </h2>
          {dueToday.length === 0 ? (
            <p className="mt-4 text-lg text-muted-foreground">
              Nothing due today — enjoy the breathing room.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {dueToday.map((t) => (
                <li key={t.id}>
                  <Link
                    to="/tasks"
                    className="flex items-center gap-3 py-3 text-foreground transition-colors hover:text-primary"
                  >
                    <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                    <span className="truncate text-[16px]">{t.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Quick links — rows on hairlines, no tiles and no icon chips */}
        <section className="mt-14 border-t border-border">
          <h2 className="sr-only">Jump back in</h2>
          <m.div variants={staggerGrid} initial="hidden" animate="show" className="divide-y divide-border">
            {QUICK_LINKS.map((l) => (
              <m.div key={l.to} variants={riseIn}>
                <Link
                  to={l.to}
                  className="group flex items-center justify-between gap-6 py-6 transition-colors hover:text-primary"
                >
                  <span className="min-w-0">
                    <span className="block text-xl font-medium tracking-[-0.015em] text-foreground transition-colors group-hover:text-primary">
                      {l.label}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">{l.desc}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </m.div>
            ))}
          </m.div>
        </section>
      </div>
    </section>
  );
}

export default Home;
