import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, Target, Timer as TimerIcon } from 'lucide-react';
import { localStorageService } from '../../services/localStorage';
import { DEFAULT_PRESETS, THEME_COLOR_OPTIONS, toHexColor } from './presets';
import { ROUTE_META } from '../../routes/meta';

import { formatTime } from '../../lib/time';
import { longBreakDue as isLongBreakDue } from '../../lib/timer';
import { useStoreValue } from '../../hooks/useStore';
import { finishPhase, PRESETS_KEY, readPresets, SELECTED_PRESET_KEY } from '../../services/focusTimer';
import { presetsToStore } from '../../lib/presets';

// Re-exported so the Focus page keeps importing it from here.
export { formatTime };

// Read as booleans, so the timer's once-a-second save does not hand the
// component a fresh settings object and a second render each tick.
const readAutoStartBreaks = () => Boolean(localStorageService.getSettings()?.autoStartBreaks);
const readAutoStartFocus = () => Boolean(localStorageService.getSettings()?.autoStartFocus);

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
    expiredAt: null,
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
      // When it ran out, so an automatic next phase starts from then.
      expiredAt: timeLeft === 0 && state.timeLeft > 0 ? state.lastSaved + state.timeLeft * 1000 : null,
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
  const [searchParams, setSearchParams] = useSearchParams();
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
  // Counts finished phases, so the countdown re-anchors after every one, even
  // when an automatic start leaves it running in the same kind of phase.
  const [phaseCount, setPhaseCount] = useState(0);
  const [autoStartBreaks] = useStoreValue(readAutoStartBreaks);
  const [autoStartFocus] = useStoreValue(readAutoStartFocus);

  const currentPreset = presets.find(p => p.id === selectedPreset) || presets[0];
  const workTime = currentPreset.workTime;
  const breakTime = currentPreset.shortBreak;
  const longBreakTime = currentPreset.longBreak;
  const sessionsUntilLongBreak = currentPreset.sessionsUntilLongBreak || 4;

  // `endedAt` is when the phase really ran out, which a background tab or a
  // closed one learns late; lib/timer decides what comes next from it.
  const handleComplete = useCallback((endedAt = Date.now()) => {
    const next = finishPhase({
      isBreak,
      completed: sessionsCompleted,
      preset: currentPreset,
      selectedPreset,
      sessionTask,
      autoStartBreaks,
      autoStartFocus,
      endedAt,
    });
    setSessionsCompleted(next.sessionsCompleted);
    setIsBreak(next.isBreak);
    setTimeLeft(next.timeLeft);
    setIsRunning(next.isRunning);
    setPhaseCount((n) => n + 1);
  }, [isBreak, sessionsCompleted, currentPreset, selectedPreset, sessionTask, autoStartBreaks, autoStartFocus]);

  // A session that ran out while the tab was closed still owes its completion
  // work: the streak, the session log and the notification. It is finished as
  // of when it ran out, so an automatic next phase has already been running.
  const expiredAtRef = useRef(restored.expiredAt);
  useEffect(() => {
    if (!expiredAtRef.current) return;
    const endedAt = expiredAtRef.current;
    expiredAtRef.current = null;
    handleComplete(endedAt);
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
      sessionTotal: isBreak
        ? (isLongBreakDue(sessionsCompleted, sessionsUntilLongBreak) ? longBreakTime : breakTime)
        : workTime,
      focusTask: sessionTask,
    });
  }, [timeLeft, isRunning, isBreak, sessionsCompleted, sessionsUntilLongBreak, workTime, breakTime, longBreakTime, sessionTask]);

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
        title: titleParam
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

  // Once answered, the intent leaves the address bar. Left there, `?start=1`
  // started the timer again on every reload.
  useEffect(() => {
    if (intent) setSearchParams({}, { replace: true });
  }, [intent, setSearchParams]);

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
      const longDue = isLongBreakDue(sessionsCompleted, sessionsUntilLongBreak);
      setTimeLeft(isBreak ? (longDue ? longBreakTime : breakTime) : workTime);
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
        handleComplete(endAt);
      }
    };

    const interval = setInterval(tick, 1000);
    // Resync the display the moment the tab becomes visible again.
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [isRunning, handleComplete, phaseCount]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Show the countdown in the browser tab while a session is running, so
  // the timer stays visible when you switch tabs to do the actual work.
  // Pausing puts back the Focus page's own title. It used to put back
  // whatever title was there when the countdown began, and arriving from Help
  // with a session running left the Focus page called "Help & FAQ".
  useEffect(() => {
    if (isRunning) {
      originalTitleRef.current = true;
      document.title = `${formatTime(timeLeft)} · ${isBreak ? 'Break' : 'Focus'} | Zephyr`;
    } else if (originalTitleRef.current) {
      document.title = ROUTE_META['/focus'].title;
      originalTitleRef.current = null;
    }
  }, [isRunning, timeLeft, isBreak]);

  useEffect(() => {
    const root = document.documentElement;
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
      root.dataset.fullscreen = '';
    } else {
      document.body.style.overflow = '';
      delete root.dataset.fullscreen;
    }
    return () => {
      document.body.style.overflow = '';
      delete root.dataset.fullscreen;
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

  // Whether the next break is the long one; the rule lives in lib/timer.
  const longBreakDue = isLongBreakDue(sessionsCompleted, sessionsUntilLongBreak);

  const toggleTimer = () => {
    if (!isRunning) {
      localStorageService.saveOnboarding({ focusStarted: true });
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(isBreak ? (longBreakDue ? longBreakTime : breakTime) : workTime);
  };

  // Skipping is not finishing. It moves on to the next phase and records
  // nothing: no session in the log, no streak, no notification. It used to
  // call handleComplete, so five quick skips logged five 25-minute sessions.
  const skipSession = () => {
    setIsRunning(false);
    if (isBreak) {
      setIsBreak(false);
      setTimeLeft(workTime);
    } else {
      setIsBreak(true);
      setTimeLeft(longBreakDue ? longBreakTime : breakTime);
    }
  };

  const currentSessionTime = isBreak ? (longBreakDue ? longBreakTime : breakTime) : workTime;
  const progress = ((currentSessionTime - timeLeft) / currentSessionTime) * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const getSessionType = () => {
    if (isBreak) {
      return longBreakDue
        ? { text: 'Long break', icon: Clock, color: 'text-night' }
        : { text: 'Short break', icon: Clock, color: 'text-night' };
    }
    return { text: 'Focus', icon: Target, color: 'text-primary' };
  };

  const sessionType = getSessionType();

  // The timer's own keys: Space start/pause, R reset, S skip, F full screen
  // (Esc leaves it). They stand down while you are typing, while a dialog is
  // open, and when a modifier is held so they never shadow a browser shortcut.
  // A key something else already handled (the second key of a `g` chord, a
  // choice in the open task list) is not theirs either.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.defaultPrevented || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      // Esc leaves full screen whatever has focus there, its buttons included.
      if (e.key === 'Escape' && isFullScreen) {
        e.preventDefault();
        setIsFullScreen(false);
        return;
      }
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || e.target.isContentEditable) return;
      if (document.querySelector('[role="dialog"][data-state="open"], [role="listbox"][data-state="open"]')) return;

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
      const n = preset.sessionsUntilLongBreak || 4;
      const long = isLongBreakDue(sessionsCompleted, n);
      setTimeLeft(isBreak ? (long ? preset.longBreak : preset.shortBreak) : preset.workTime);
    }
  };

  const handleSavePreset = () => {
    if (!editingPreset || !newPresetName.trim()) return;
    
    const updatedPreset = { ...editingPreset, name: newPresetName.trim() };
    const updatedPresets = presets.map(p => 
      p.id === editingPreset.id ? updatedPreset : p
    );
    
    setPresets(updatedPresets);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presetsToStore(updatedPresets, DEFAULT_PRESETS)));
    
    if (selectedPreset === editingPreset.id) {
      setSelectedPreset(editingPreset.id);
      const n = updatedPreset.sessionsUntilLongBreak || 4;
      const long = isLongBreakDue(sessionsCompleted, n);
      const currentTime = isBreak ? (long ? updatedPreset.longBreak : updatedPreset.shortBreak) : updatedPreset.workTime;
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
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presetsToStore(updatedPresets, DEFAULT_PRESETS)));
    setSelectedPreset(newPreset.id);
    setEditingPreset(newPreset);
    setNewPresetName('New Timer');
    setIsSettingsOpen(true);
  };

  const handleDeletePreset = (presetId) => {
    if (DEFAULT_PRESETS.find(p => p.id === presetId)) return;
    
    const updatedPresets = presets.filter(p => p.id !== presetId);
    setPresets(updatedPresets);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presetsToStore(updatedPresets, DEFAULT_PRESETS)));
    
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
    isBreak,
    timerContainerRef,
    toggleTimer,
    resetTimer,
    skipSession,

    // Session bookkeeping
    sessionsCompleted,
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
