import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, Target, Timer as TimerIcon } from 'lucide-react';
import { localStorageService } from '../../services/localStorage';
import { notificationService } from '../../services/notificationService';
import { DEFAULT_PRESETS, normalizePresetColor, THEME_COLOR_OPTIONS, toHexColor } from './presets';

/** mm:ss for a duration in seconds. */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * All of the focus timer's state and behaviour: the countdown, session
 * bookkeeping, persistence to localStorage, the tab title, the fullscreen flag
 * and preset CRUD. The component that calls this renders the result and does
 * nothing else.
 *
 * The countdown anchors to a wall-clock end time rather than counting down a
 * variable, because browsers throttle `setInterval` in background tabs — the
 * whole point of a focus timer is that it stays right while you are looking at
 * something else.
 */
export function usePomodoro() {
  const [searchParams] = useSearchParams();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState('pomodoro');
  const [presets, setPresets] = useState(DEFAULT_PRESETS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [newPresetName, setNewPresetName] = useState('');
  const timerContainerRef = useRef(null);
  const [circumference, setCircumference] = useState(2 * Math.PI * 180);
  const prevPresetRef = useRef(selectedPreset);
  const prevIsBreakRef = useRef(isBreak);
  const originalTitleRef = useRef(null);
  const [sessionTask, setSessionTask] = useState(null);
  const [, setStreak] = useState(localStorageService.getFocusStreak());
  const [, setNextPromptVisible] = useState(false);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const [presetColorDraft, setPresetColorDraft] = useState('#3b82f6');

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

    const updated = localStorageService.saveFocusStreak({ count: nextCount, lastDate: todayKey });
    setStreak(updated);
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
      setNextPromptVisible(true);
      
      notificationService.createNotification(
        'timer',
        'Session Complete',
        `${newSessionsCompleted} session${newSessionsCompleted !== 1 ? 's' : ''} completed. Time for a break.`,
        { type: 'navigate', path: '/focus' }
      );
      
      showNotification('Work Session Complete', `${newSessionsCompleted} session${newSessionsCompleted !== 1 ? 's' : ''} completed. Time for a break.`);
    } else {
      setIsBreak(false);
      setTimeLeft(workTime);
      showNotification('Break Complete', 'Recharged and ready to focus again');
    }
    setIsRunning(false);
  }, [isBreak, sessionsCompleted, breakTime, longBreakTime, workTime, sessionsUntilLongBreak, selectedPreset, sessionTask]);

  useEffect(() => {
    const state = localStorageService.getTimerState();
    if (state) {
      try {
        if (state.isRunning && state.lastSaved) {
          const timeElapsed = Math.floor((Date.now() - state.lastSaved) / 1000);
          const newTimeLeft = Math.max(0, state.timeLeft - timeElapsed);
          setTimeLeft(newTimeLeft);
          
          if (newTimeLeft === 0 && state.timeLeft > 0) {
            handleComplete();
            setIsRunning(false);
          } else {
            setIsRunning(state.isRunning);
          }
        } else {
          setTimeLeft(state.timeLeft || workTime);
          setIsRunning(false);
        }
        
        setIsBreak(state.isBreak || false);
        setSessionsCompleted(state.pomodorosCompleted || 0);
        if (state.focusTask) {
          setSessionTask(state.focusTask);
        }
      } catch (error) {
        console.error('Failed to load timer state:', error);
      }
    }
    
    const savedPresets = localStorage.getItem('focusTimerPresets');
    if (savedPresets) {
      try {
        const parsed = JSON.parse(savedPresets).map(p => ({
          ...p,
          color: normalizePresetColor(p.color),
        }));
        // Merge with defaults, ensuring defaults come first
        const defaultIds = DEFAULT_PRESETS.map(p => p.id);
        const customPresets = parsed.filter(p => !defaultIds.includes(p.id));
        setPresets([...DEFAULT_PRESETS, ...customPresets]);
      } catch (error) {
        console.error('Failed to load presets:', error);
      }
    } else {
      setPresets([...DEFAULT_PRESETS]);
    }
    
    const savedPreset = localStorage.getItem('selectedFocusPreset');
    if (savedPreset) {
      setSelectedPreset(savedPreset);
    }
    
    setIsInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isInitialized) {
      const state = {
        timeLeft,
        isRunning,
        isBreak,
        pomodorosCompleted: sessionsCompleted,
        workTime,
        breakTime,
        longBreakTime,
        focusTask: sessionTask,
      };
      localStorageService.saveTimerState(state);
    }
  }, [timeLeft, isRunning, isBreak, sessionsCompleted, workTime, breakTime, longBreakTime, sessionTask, isInitialized]);

  // Handle inbound intent (task -> focus, resume, auto-start)
  useEffect(() => {
    if (!isInitialized) return;

    const titleParam = searchParams.get('title');
    const taskId = searchParams.get('taskId');
    const resume = searchParams.get('resume') === '1';
    const autoStartFlag = searchParams.get('start') === '1';

    if (titleParam) {
      setSessionTask({
        id: taskId || null,
        title: decodeURIComponent(titleParam)
      });
    } else if (resume) {
      const last = localStorageService.getLastSession();
      if (last?.task) {
        setSessionTask(last.task);
      }
    }

    if (autoStartFlag && !hasAutoStarted) {
      setIsRunning(true);
      setHasAutoStarted(true);
      localStorageService.saveOnboarding({ focusStarted: true });
    }
  }, [isInitialized, searchParams, hasAutoStarted]);

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
    // Date.now() on every tick instead of counted down — no drift.
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
  // (Navigating to another route re-runs useSEO, which resets the title.)
  useEffect(() => {
    if (isRunning) {
      if (originalTitleRef.current === null) originalTitleRef.current = document.title;
      document.title = `${formatTime(timeLeft)} · ${isBreak ? 'Break' : 'Focus'} — Zephyr`;
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
      setNextPromptVisible(false);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    const currentTime = isBreak
      ? (sessionsCompleted % sessionsUntilLongBreak === 0 ? longBreakTime : breakTime)
      : workTime;
    setTimeLeft(currentTime);
    setNextPromptVisible(false);
  };

  // Space starts/pauses the timer (unless you're typing somewhere).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code !== 'Space' || e.repeat) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || e.target.isContentEditable) return;
      e.preventDefault();
      toggleTimer();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

  const skipSession = () => {
    setIsRunning(false);
    setNextPromptVisible(false);
    handleComplete();
  };

  const currentSessionTime = isBreak 
    ? (sessionsCompleted % sessionsUntilLongBreak === 0 ? longBreakTime : breakTime)
    : workTime;
  const progress = ((currentSessionTime - timeLeft) / currentSessionTime) * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const totalFocusTime = Math.floor((sessionsCompleted * workTime) / 60);
  const editingPresetHex = useMemo(() => toHexColor(editingPreset?.color || THEME_COLOR_OPTIONS[0]), [editingPreset]);

  useEffect(() => {
    setPresetColorDraft(editingPresetHex);
  }, [editingPresetHex]);

  const getSessionType = () => {
    if (isBreak) {
      return sessionsCompleted % sessionsUntilLongBreak === 0 
        ? { text: 'Long Break', icon: Clock, color: 'text-purple-500' } 
        : { text: 'Short Break', icon: Clock, color: 'text-green-500' };
    }
    return { text: 'Focus Time', icon: Target, color: 'text-primary' };
  };

  const sessionType = getSessionType();

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
