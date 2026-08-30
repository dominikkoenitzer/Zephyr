import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, Target, Timer as TimerIcon } from 'lucide-react';
import { toast } from 'sonner';
import { localStorageService } from '../../services/localStorage';
import { notificationService } from '../../services/notificationService';
import { DEFAULT_PRESETS, normalizePresetColor, THEME_COLOR_OPTIONS, toHexColor } from './presets';

/** mm:ss for a duration in seconds. */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const PRESETS_KEY = 'focusTimerPresets';
const SELECTED_PRESET_KEY = 'selectedFocusPreset';

/** Saved presets, defaults first so a custom one can never shadow them. */
function readPresets() {
  const saved = localStorage.getItem(PRESETS_KEY);
  if (!saved) return [...DEFAULT_PRESETS];
  try {
    const parsed = JSON.parse(saved).map((p) => ({
      ...p,
      color: normalizePresetColor(p.color),
    }));
    const defaultIds = DEFAULT_PRESETS.map((p) => p.id);
    return [...DEFAULT_PRESETS, ...parsed.filter((p) => !defaultIds.includes(p.id))];
  } catch (error) {
    console.error('Failed to load presets:', error);
    return [...DEFAULT_PRESETS];
  }
}

/**
 * The persisted timer, resolved against the wall clock so a session that ran
 * out while the tab was closed comes back finished rather than frozen.
 *
 * Read before the first render rather than from a mount effect: the effect
 * painted a default 25:00 first, and it restored the preset after the timer,
 * which made the preset-change effect below reset the clock it had just
 * restored.
 */
function readPersistedTimer() {
  const presets = readPresets();
  const selectedPreset = localStorage.getItem(SELECTED_PRESET_KEY) || 'pomodoro';
  const preset = presets.find((p) => p.id === selectedPreset) || presets[0];
  const base = {
    presets,
    selectedPreset,
    timeLeft: preset.workTime,
    isRunning: false,
    isBreak: false,
    sessionsCompleted: 0,
    sessionTask: null,
    expiredWhileAway: false,
  };

  const state = localStorageService.getTimerState();
  if (!state) return base;

  const restored = {
    ...base,
    isBreak: state.isBreak || false,
    sessionsCompleted: state.pomodorosCompleted || 0,
    sessionTask: state.focusTask || null,
  };

  if (state.isRunning && state.lastSaved) {
    const elapsed = Math.floor((Date.now() - state.lastSaved) / 1000);
    const timeLeft = Math.max(0, state.timeLeft - elapsed);
    return {
      ...restored,
      timeLeft,
      isRunning: timeLeft > 0,
      expiredWhileAway: timeLeft === 0 && state.timeLeft > 0,
    };
  }

  return { ...restored, timeLeft: state.timeLeft || preset.workTime };
}

/**
 * All of the focus timer's state and behaviour: the countdown, session
 * bookkeeping, persistence to localStorage, the tab title, the fullscreen flag
 * and preset CRUD. The component that calls this renders the result and does
 * nothing else.
 *
 * The countdown anchors to a wall-clock end time rather than counting down a
 * variable, because browsers throttle `setInterval` in background tabs. The
 * whole point of a focus timer is that it stays right while you are looking at
 * something else.
 */
export function usePomodoro() {
  const [searchParams] = useSearchParams();
  const [restored] = useState(readPersistedTimer);
  const [timeLeft, setTimeLeft] = useState(restored.timeLeft);
  const [isRunning, setIsRunning] = useState(restored.isRunning);
  const [isBreak, setIsBreak] = useState(restored.isBreak);
  const [sessionsCompleted, setSessionsCompleted] = useState(
    restored.sessionsCompleted
  );
  const [selectedPreset, setSelectedPreset] = useState(restored.selectedPreset);
  const [presets, setPresets] = useState(restored.presets);
  const [sessionTask, setSessionTask] = useState(restored.sessionTask);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [newPresetName, setNewPresetName] = useState('');
  const editingPresetHex = useMemo(
    () => toHexColor(editingPreset?.color || THEME_COLOR_OPTIONS[0]),
    [editingPreset]
  );
  // The colour picker's draft follows whichever preset is open. Reset during
  // render rather than from an effect, so the picker never shows the previous
  // preset's colour for a frame.
  const [presetColorDraft, setPresetColorDraft] = useState(editingPresetHex);
  const [colorDraftFor, setColorDraftFor] = useState(editingPresetHex);
  if (colorDraftFor !== editingPresetHex) {
    setColorDraftFor(editingPresetHex);
    setPresetColorDraft(editingPresetHex);
  }
  const timerContainerRef = useRef(null);
  const [circumference, setCircumference] = useState(2 * Math.PI * 180);
  const prevPresetRef = useRef(selectedPreset);
  const prevIsBreakRef = useRef(isBreak);
  const originalTitleRef = useRef(null);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  const currentPreset = presets.find(p => p.id === selectedPreset) || presets[0];
  const workTime = currentPreset.workTime;
  const breakTime = currentPreset.shortBreak;
  const longBreakTime = currentPreset.longBreak;
  const sessionsUntilLongBreak = currentPreset.sessionsUntilLongBreak || 4;

  const showNotification = (title, message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/favicon.ico' });
    }
  };

  const updateStreakCounters = () => {
    const today = new Date();
    const todayKey = today.toDateString();
    const existing = localStorageService.getFocusStreak();
    const lastDate = existing.lastDate ? new Date(existing.lastDate) : null;
    let nextCount = 1;

    if (lastDate) {
      const diff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      if (diff === 0) {
        nextCount = existing.count || 1;
      } else if (diff === 1) {
        nextCount = (existing.count || 0) + 1;
      }
    }

    localStorageService.saveFocusStreak({ count: nextCount, lastDate: todayKey });
  };


  const handleComplete = useCallback(() => {
    const isWorkComplete = !isBreak;
    if (isWorkComplete) {
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);
      setIsBreak(true);
      
      const nextBreakTime = newSessionsCompleted % sessionsUntilLongBreak === 0 ? longBreakTime : breakTime;
      setTimeLeft(nextBreakTime);
      
      const sessions = localStorageService.getFocusSessions();
      sessions.push({
        date: new Date().toISOString(),
        duration: workTime,
        type: 'work',
        task: sessionTask
      });
      localStorageService.saveFocusSessions(sessions);
      localStorageService.saveOnboarding({ focusStarted: true });
      updateStreakCounters();
      localStorageService.saveLastSession({
        presetId: selectedPreset,
        duration: workTime,
        task: sessionTask,
        completedAt: new Date().toISOString()
      });
      notificationService.createNotification(
        'timer',
        'Session Complete',
        `${newSessionsCompleted} session${newSessionsCompleted !== 1 ? 's' : ''} completed. Time for a break.`,
        { type: 'navigate', path: '/focus' },
        {},
        // Every finished session is its own event. Without a key these fell
        // into the 60s same-title duplicate guard, which swallowed the record
        // and with it the chime whenever two sessions landed close together.
        `timer:complete:${Date.now()}`
      );

      showNotification('Work Session Complete', `${newSessionsCompleted} session${newSessionsCompleted !== 1 ? 's' : ''} completed. Time for a break.`);

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
        toast.success('Session complete', { description: 'Time for a break.' });
      }
    } else {
      setIsBreak(false);
      setTimeLeft(workTime);
      showNotification('Break Complete', 'The next session is ready when you are.');
      // The break end writes no notification record, so its chime has to be
      // asked for directly or the timer simply goes quiet.
      notificationService.playChime();
    }
    setIsRunning(false);
  }, [isBreak, sessionsCompleted, breakTime, longBreakTime, workTime, sessionsUntilLongBreak, selectedPreset, sessionTask]);

  // A session that ran out while the tab was closed still owes its completion
  // work: the streak, the session log and the notification.
  const expiredWhileAwayRef = useRef(restored.expiredWhileAway);
  useEffect(() => {
    if (!expiredWhileAwayRef.current) return;
    expiredWhileAwayRef.current = false;
    handleComplete();
  }, [handleComplete]);

  useEffect(() => {
    localStorageService.saveTimerState({
      timeLeft,
      isRunning,
      isBreak,
      pomodorosCompleted: sessionsCompleted,
      workTime,
      breakTime,
      longBreakTime,
      focusTask: sessionTask,
    });
  }, [timeLeft, isRunning, isBreak, sessionsCompleted, workTime, breakTime, longBreakTime, sessionTask]);

  // Inbound intent (task -> focus, resume, auto-start). Answered during render
  // so the session name and a `start=1` countdown are already right in the
  // first paint after the navigation; handledIntent records which query string
  // this render answered so it runs once per arrival.
  const intent = searchParams.toString();
  const [handledIntent, setHandledIntent] = useState(null);
  if (intent !== handledIntent) {
    setHandledIntent(intent);

    const titleParam = searchParams.get('title');
    const taskId = searchParams.get('taskId');

    if (titleParam) {
      setSessionTask({
        id: taskId || null,
        title: decodeURIComponent(titleParam)
      });
    } else if (searchParams.get('resume') === '1') {
      const last = localStorageService.getLastSession();
      if (last?.task) {
        setSessionTask(last.task);
      }
    }

    if (searchParams.get('start') === '1' && !hasAutoStarted) {
      setIsRunning(true);
      setHasAutoStarted(true);
    }
  }

  // The onboarding flag is a write to storage, so it waits for the commit.
  useEffect(() => {
    if (hasAutoStarted) localStorageService.saveOnboarding({ focusStarted: true });
  }, [hasAutoStarted]);

  useEffect(() => {
    // Only reset timer when preset changes or session type changes (work <-> break)
    // Don't reset when timer is paused
    const presetChanged = prevPresetRef.current !== selectedPreset;
    const sessionTypeChanged = prevIsBreakRef.current !== isBreak;
    
    if ((presetChanged || sessionTypeChanged) && !isRunning) {
      const currentTime = isBreak 
        ? (sessionsCompleted % sessionsUntilLongBreak === 0 ? longBreakTime : breakTime)
        : workTime;
      setTimeLeft(currentTime);
    }
    
    // Update refs
    prevPresetRef.current = selectedPreset;
    prevIsBreakRef.current = isBreak;
  }, [selectedPreset, isBreak, workTime, breakTime, longBreakTime, sessionsCompleted, sessionsUntilLongBreak, isRunning]);

  // Keep a ref of the latest timeLeft so the ticking effect can anchor to
  // wall-clock time without re-running on every second.
  const timeLeftRef = useRef(timeLeft);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    if (!isRunning) return undefined;

    // Anchor the session to a wall-clock end time. Browsers throttle
    // setInterval in background tabs, so remaining time is computed from
    // Date.now() on every tick instead of counted down, so there is no drift.
    const endAt = Date.now() + timeLeftRef.current * 1000;
    let completed = false;
    const tick = () => {
      if (completed) return;
      const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        completed = true;
        handleComplete();
      }
    };

    const interval = setInterval(tick, 1000);
    // Resync the display the moment the tab becomes visible again.
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [isRunning, handleComplete]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Show the countdown in the browser tab while a session is running, so
  // the timer stays visible when you switch tabs to do the actual work.
  // (Navigating to another route re-runs usePageMeta, which resets the title.)
  useEffect(() => {
    if (isRunning) {
      if (originalTitleRef.current === null) originalTitleRef.current = document.title;
      document.title = `${formatTime(timeLeft)} · ${isBreak ? 'Break' : 'Focus'} | Zephyr`;
    } else if (originalTitleRef.current !== null) {
      document.title = originalTitleRef.current;
      originalTitleRef.current = null;
    }
  }, [isRunning, timeLeft, isBreak]);

  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullScreen]);

  // Calculate circumference based on container size
  useEffect(() => {
    const updateCircumference = () => {
      if (timerContainerRef.current) {
        const containerSize = timerContainerRef.current.offsetWidth;
        // Radius is 45% of container, so calculate: 2 * PI * (containerSize * 0.45)
        const radius = containerSize * 0.45;
        setCircumference(2 * Math.PI * radius);
      }
    };

    updateCircumference();
    window.addEventListener('resize', updateCircumference);
    return () => window.removeEventListener('resize', updateCircumference);
  }, []);

  const toggleTimer = () => {
    if (!isRunning) {
      localStorageService.saveOnboarding({ focusStarted: true });
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    const currentTime = isBreak
      ? (sessionsCompleted % sessionsUntilLongBreak === 0 ? longBreakTime : breakTime)
      : workTime;
    setTimeLeft(currentTime);
  };

  const skipSession = () => {
    setIsRunning(false);
    handleComplete();
  };

  const currentSessionTime = isBreak 
    ? (sessionsCompleted % sessionsUntilLongBreak === 0 ? longBreakTime : breakTime)
    : workTime;
  const progress = ((currentSessionTime - timeLeft) / currentSessionTime) * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const totalFocusTime = Math.floor((sessionsCompleted * workTime) / 60);
  const getSessionType = () => {
    if (isBreak) {
      return sessionsCompleted % sessionsUntilLongBreak === 0 
        ? { text: 'Long Break', icon: Clock, color: 'text-purple-500' } 
        : { text: 'Short Break', icon: Clock, color: 'text-green-500' };
    }
    return { text: 'Focus Time', icon: Target, color: 'text-primary' };
  };

  const sessionType = getSessionType();

  // The timer's own keys: Space start/pause, R reset, S skip, F full screen
  // (Esc leaves it). They stand down while you are typing, while a dialog is
  // open, and when a modifier is held so they never shadow a browser shortcut.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || e.target.isContentEditable) return;
      if (document.querySelector('[role="dialog"][data-state="open"]')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault();
          resetTimer();
          break;
        case 's':
          // Skipping a session that hasn't started would just log a no-op.
          if (timeLeft === currentSessionTime) return;
          e.preventDefault();
          skipSession();
          break;
        case 'f':
          e.preventDefault();
          setIsFullScreen((full) => !full);
          break;
        case 'escape':
          if (isFullScreen) {
            e.preventDefault();
            setIsFullScreen(false);
          }
          break;
        default:
          break;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

  const handlePresetChange = (presetId) => {
    setSelectedPreset(presetId);
    localStorage.setItem('selectedFocusPreset', presetId);
    setIsRunning(false);
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setTimeLeft(isBreak ? (sessionsCompleted % sessionsUntilLongBreak === 0 ? preset.longBreak : preset.shortBreak) : preset.workTime);
    }
  };

  const handleSavePreset = () => {
    if (!editingPreset || !newPresetName.trim()) return;
    
    const updatedPreset = { ...editingPreset, name: newPresetName.trim() };
    const updatedPresets = presets.map(p => 
      p.id === editingPreset.id ? updatedPreset : p
    );
    
    setPresets(updatedPresets);
    const customPresets = updatedPresets.filter(p => !DEFAULT_PRESETS.find(dp => dp.id === p.id));
    localStorage.setItem('focusTimerPresets', JSON.stringify(customPresets));
    
    if (selectedPreset === editingPreset.id) {
      setSelectedPreset(editingPreset.id);
      const currentTime = isBreak 
        ? (sessionsCompleted % updatedPreset.sessionsUntilLongBreak === 0 ? updatedPreset.longBreak : updatedPreset.shortBreak)
        : updatedPreset.workTime;
      if (!isRunning) {
        setTimeLeft(currentTime);
      }
    }
    
    setEditingPreset(null);
    setNewPresetName('');
    setIsSettingsOpen(false);
  };

  const handleCreatePreset = () => {
    const newPreset = {
      id: `custom-${Date.now()}`,
      name: 'New Timer',
      icon: TimerIcon,
      color: THEME_COLOR_OPTIONS[0],
      workTime: 25 * 60,
      shortBreak: 5 * 60,
      longBreak: 15 * 60,
      sessionsUntilLongBreak: 4
    };
    
    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    const customPresets = updatedPresets.filter(p => !DEFAULT_PRESETS.find(dp => dp.id === p.id));
    localStorage.setItem('focusTimerPresets', JSON.stringify(customPresets));
    setSelectedPreset(newPreset.id);
    setEditingPreset(newPreset);
    setNewPresetName('New Timer');
    setIsSettingsOpen(true);
  };

  const handleDeletePreset = (presetId) => {
    if (DEFAULT_PRESETS.find(p => p.id === presetId)) return;
    
    const updatedPresets = presets.filter(p => p.id !== presetId);
    setPresets(updatedPresets);
    const customPresets = updatedPresets.filter(p => !DEFAULT_PRESETS.find(dp => dp.id === p.id));
    localStorage.setItem('focusTimerPresets', JSON.stringify(customPresets));
    
    if (selectedPreset === presetId) {
      setSelectedPreset('pomodoro');
      localStorage.setItem('selectedFocusPreset', 'pomodoro');
    }
  };

  /** Cancel an edit: close the dialog and drop the draft without saving it. */
  const cancelPresetEdit = () => {
    setIsSettingsOpen(false);
    setEditingPreset(null);
    setNewPresetName('');
  };

  return {
    // Countdown
    timeLeft,
    isRunning,
    progress,
    strokeDashoffset,
    circumference,
    currentSessionTime,
    sessionType,
    timerContainerRef,
    toggleTimer,
    resetTimer,
    skipSession,

    // Session bookkeeping
    sessionsCompleted,
    totalFocusTime,
    sessionTask,
    setSessionTask,

    // Presets
    presets,
    selectedPreset,
    currentPreset,
    handlePresetChange,
    handleCreatePreset,
    handleDeletePreset,

    // Preset editor
    isSettingsOpen,
    setIsSettingsOpen,
    editingPreset,
    setEditingPreset,
    editingPresetHex,
    newPresetName,
    setNewPresetName,
    presetColorDraft,
    setPresetColorDraft,
    handleSavePreset,
    cancelPresetEdit,

    // Fullscreen
    isFullScreen,
    setIsFullScreen,
  };
}
