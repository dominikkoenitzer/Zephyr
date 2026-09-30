// What happens when a focus timer phase runs out, wherever the app is when it
// does. The Focus page counts down itself; every other page leaves the timer
// to the shell, which finishes the phase through the same function, so a
// session is logged, chimed and streaked whether or not Focus is open.
import { toast } from 'sonner';
import { localStorageService } from './localStorage';
import { notificationService } from './notificationService';
import { DEFAULT_PRESETS, normalizePresetColor } from '../components/FocusTimer/presets';
import { focusToday } from '../lib/dashboard';
import { mergeStoredPresets } from '../lib/presets';
import { longBreakDue, nextPhase } from '../lib/timer';

export const PRESETS_KEY = 'focusTimerPresets';
export const SELECTED_PRESET_KEY = 'selectedFocusPreset';

// Ends closer together than this are one session seen twice: a session is at
// least a minute long, so two real ones never end nearer than that.
const SAME_SESSION_MS = 60_000;

/** Saved presets: the built-ins with any stored edits, then the custom ones. */
export function readPresets() {
  const saved = localStorage.getItem(PRESETS_KEY);
  if (!saved) return [...DEFAULT_PRESETS];
  try {
    const parsed = JSON.parse(saved).map((p) => ({
      ...p,
      color: normalizePresetColor(p.color),
    }));
    return mergeStoredPresets(parsed, DEFAULT_PRESETS);
  } catch (error) {
    console.error('Failed to load presets:', error);
    return [...DEFAULT_PRESETS];
  }
}

/** Counts the day the session ended on, which is not always today. */
const updateStreak = (endedAt) => {
  const day = new Date(endedAt);
  const existing = localStorageService.getFocusStreak();
  const last = existing.lastDate ? new Date(existing.lastDate) : null;
  let count = 1;

  if (last) {
    // Calendar days between the two dates, from midnight to midnight and
    // rounded, so the 25-hour day in October does not count as two.
    const diff = Math.round(
      (new Date(day).setHours(0, 0, 0, 0) - new Date(last).setHours(0, 0, 0, 0)) / 86400000
    );
    if (diff <= 0) {
      // Never let a late-arriving earlier session move the streak backwards.
      if (diff < 0) return;
      count = existing.count || 1;
    } else if (diff === 1) {
      count = (existing.count || 0) + 1;
    }
  }

  localStorageService.saveFocusStreak({ count, lastDate: day.toDateString() });
};

/**
 * Finishes the phase that ran out at `endedAt` and saves where the timer goes
 * next, before anything renders, so a page change in between can never finish
 * the same phase twice. Returns the next phase for the Focus page to show.
 */
export function finishPhase({
  isBreak,
  completed,
  preset,
  selectedPreset,
  sessionTask,
  autoStartBreaks,
  autoStartFocus,
  endedAt = Date.now(),
}) {
  const { workTime, shortBreak: breakTime, longBreak: longBreakTime } = preset;
  const every = preset.sessionsUntilLongBreak || 4;
  const next = nextPhase({
    isBreak,
    completed,
    every,
    workTime,
    breakTime,
    longBreakTime,
    autoStartBreaks,
    autoStartFocus,
    endedAt,
    now: Date.now(),
  });

  localStorageService.saveTimerState({
    timeLeft: next.timeLeft,
    isRunning: next.isRunning,
    isBreak: next.isBreak,
    pomodorosCompleted: next.sessionsCompleted,
    workTime,
    breakTime,
    longBreakTime,
    sessionTotal: next.isBreak
      ? (longBreakDue(next.sessionsCompleted, every) ? longBreakTime : breakTime)
      : workTime,
    focusTask: sessionTask,
  });

  if (isBreak) {
    notificationService.showOsNotification('timer', 'Break over', next.isRunning ? 'The next session has started.' : 'The next session is ready when you are.');
    // The break end writes no notification record, so its chime has to be
    // asked for directly or the timer simply goes quiet.
    notificationService.playChime('timer');
    return next;
  }

  const endedIso = new Date(endedAt).toISOString();
  const sessions = localStorageService.getFocusSessions();
  // Two open tabs each see the same session run out, a moment apart. The
  // second finds it already logged and leaves the log, the streak and the
  // chime to the first.
  const alreadyLogged = sessions.some(
    (s) => s.type !== 'break' && Math.abs(new Date(s.date).getTime() - endedAt) < SAME_SESSION_MS
  );
  if (alreadyLogged) return next;
  sessions.push({ date: endedIso, duration: workTime, type: 'work', task: sessionTask });
  localStorageService.saveFocusSessions(sessions);
  localStorageService.saveOnboarding({ focusStarted: true });
  updateStreak(endedAt);
  localStorageService.saveLastSession({
    presetId: selectedPreset,
    duration: workTime,
    task: sessionTask,
    completedAt: endedIso,
  });

  // Only a break that is still ahead is worth announcing. One that already
  // ran out while no one was looking is over, and the next session waits.
  const doneToday = focusToday(sessions).sessions;
  const after = next.isBreak ? 'Time for a break.' : 'Ready for the next one.';
  const summary = `${doneToday} session${doneToday !== 1 ? 's' : ''} today. ${after}`;

  notificationService.createNotification(
    'timer',
    'Session complete',
    summary,
    { type: 'navigate', path: '/focus' },
    {},
    // Every finished session is its own event. Without a key these fell
    // into the 60s same-title duplicate guard, which swallowed the record
    // and with it the chime whenever two sessions landed close together.
    `timer:complete:${endedAt}`
  );
  notificationService.showOsNotification('timer', 'Session complete', summary);

  // An in-app toast as well as the OS notification, which the browser may
  // have denied. When the session was tied to a task, finishing it is one
  // click from here instead of a trip back to the task list.
  if (sessionTask?.id) {
    toast.success('Session complete', {
      description: sessionTask.title,
      duration: 8000,
      action: {
        label: 'Mark done',
        onClick: () => localStorageService.updateTask(sessionTask.id, { completed: true }),
      },
    });
  } else {
    toast.success('Session complete', { description: after });
  }

  return next;
}

/**
 * Finishes a phase that ran out while the Focus page was not open, from the
 * saved timer alone. Returns true when it finished one.
 */
export function finishExpiredPhase(now = Date.now()) {
  const state = localStorageService.getTimerState();
  if (!state?.isRunning || !state.lastSaved) return false;
  const endedAt = state.lastSaved + (Number(state.timeLeft) || 0) * 1000;
  if (endedAt > now) return false;

  const presets = readPresets();
  const selectedPreset = localStorage.getItem(SELECTED_PRESET_KEY) || 'pomodoro';
  const chosen = presets.find((p) => p.id === selectedPreset) || presets[0];
  // The lengths the running session was started with, which a preset edit
  // since then must not change.
  const preset = {
    ...chosen,
    workTime: state.workTime ?? chosen.workTime,
    shortBreak: state.breakTime ?? chosen.shortBreak,
    longBreak: state.longBreakTime ?? chosen.longBreak,
  };
  const settings = localStorageService.getSettings() || {};

  finishPhase({
    isBreak: Boolean(state.isBreak),
    completed: state.pomodorosCompleted || 0,
    preset,
    selectedPreset,
    sessionTask: state.focusTask || null,
    autoStartBreaks: Boolean(settings.autoStartBreaks),
    autoStartFocus: Boolean(settings.autoStartFocus),
    endedAt,
  });
  return true;
}
