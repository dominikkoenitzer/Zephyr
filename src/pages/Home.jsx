import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { localStorageService } from '../services/localStorage';

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentWeekMondayStart = () => {
  const days = [];
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffToMonday);

  for (let i = 0; i < 7; i += 1) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    days.push({
      key: toDateKey(date),
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
    });
  }

  return days;
};

function Home() {
  const [snapshot, setSnapshot] = useState({
    tasks: [],
    focusSessions: [],
    notes: [],
  });

  useEffect(() => {
    const loadSnapshot = () => {
      setSnapshot({
        tasks: localStorageService.getTasks(),
        focusSessions: localStorageService.getFocusSessions(),
        notes: localStorageService.getNotes(),
      });
    };

    loadSnapshot();
    window.addEventListener('focus', loadSnapshot);
    window.addEventListener('storage', loadSnapshot);

    return () => {
      window.removeEventListener('focus', loadSnapshot);
      window.removeEventListener('storage', loadSnapshot);
    };
  }, []);

  const lastSevenDays = useMemo(() => getCurrentWeekMondayStart(), []);

  const focusData = useMemo(() => {
    const totals = new Map(lastSevenDays.map(({ key }) => [key, 0]));

    snapshot.focusSessions.forEach((session) => {
      const sessionDate = new Date(session.date);
      if (Number.isNaN(sessionDate.getTime())) return;

      const key = toDateKey(sessionDate);
      if (!totals.has(key)) return;

      const seconds = Number(session.duration) || 0;
      totals.set(key, totals.get(key) + seconds / 60);
    });

    return lastSevenDays.map(({ key, day }) => ({
      day,
      minutes: Math.round(totals.get(key)),
    }));
  }, [lastSevenDays, snapshot.focusSessions]);

  const tasksData = useMemo(() => {
    const totals = new Map(lastSevenDays.map(({ key }) => [key, 0]));

    snapshot.tasks.forEach((task) => {
      if (!task.completed) return;

      const completedDate = new Date(task.completedAt || task.updatedAt || task.createdAt);
      if (Number.isNaN(completedDate.getTime())) return;

      const key = toDateKey(completedDate);
      if (!totals.has(key)) return;

      totals.set(key, totals.get(key) + 1);
    });

    return lastSevenDays.map(({ key, day }) => ({
      day,
      done: totals.get(key),
    }));
  }, [lastSevenDays, snapshot.tasks]);

  const totalFocusMinutes = useMemo(
    () => focusData.reduce((sum, item) => sum + item.minutes, 0),
    [focusData]
  );
  const totalTasksDone = useMemo(
    () => tasksData.reduce((sum, item) => sum + item.done, 0),
    [tasksData]
  );
  const totalNotes = snapshot.notes.length;
  const totalTasks = snapshot.tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((totalTasksDone / totalTasks) * 100) : 0;

  return (
    <section className="w-full flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-5xl py-4 sm:py-8 md:py-10">
        <p className="text-xs sm:text-sm uppercase tracking-[0.14em] text-muted-foreground">Zephyr</p>
        <h1 className="mt-2 text-4xl sm:text-5xl md:text-6xl font-bold leading-[0.98] text-foreground">HOME</h1>
        <p className="mt-4 max-w-2xl text-sm sm:text-base text-muted-foreground">
          A quick view of your current week (Monday to Sunday) across focus, tasks, and notes.
        </p>

        <div className="mt-8 space-y-8">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-border/70 bg-card/80 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Focus</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{totalFocusMinutes}m</p>
              <p className="mt-1 text-xs text-muted-foreground">This week</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/80 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Tasks</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{totalTasksDone}</p>
              <p className="mt-1 text-xs text-muted-foreground">Completed this week</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/80 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Completion</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{completionRate}%</p>
              <p className="mt-1 text-xs text-muted-foreground">Of all tasks</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/80 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Notes</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{totalNotes}</p>
              <p className="mt-1 text-xs text-muted-foreground">Saved notes</p>
            </div>
          </div>

          <div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.12em] text-muted-foreground">Weekly Activity</p>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-card/80 p-4">
                <p className="mb-3 text-sm font-semibold text-foreground">Focus Minutes</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={focusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} width={34} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                        }}
                      />
                      <Line type="monotone" dataKey="minutes" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-card/80 p-4">
                <p className="mb-3 text-sm font-semibold text-foreground">Tasks Completed</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tasksData}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                        }}
                      />
                      <Bar dataKey="done" radius={[8, 8, 0, 0]} fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Home;
