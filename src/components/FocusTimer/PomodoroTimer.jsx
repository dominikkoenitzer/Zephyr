import { useState, useEffect, useCallback } from 'react';
import { 
  Play, Pause, SkipForward, Settings, Award, Clock, Target, Maximize2, X, 
  RotateCcw, Plus, Trash2, Save, Edit2, Sparkles, Zap, Coffee, BookOpen,
  Music, Timer as TimerIcon, CheckCircle2, Heart
} from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { CustomNumberInput } from '../ui/custom-number-input';
import { localStorageService } from '../../services/localStorage';
import { achievementSoundService } from '../../services/achievementSound';

const DEFAULT_PRESETS = [
  {
    id: 'pomodoro',
    name: 'Pomodoro',
    icon: Target,
    color: '#ef4444',
    workTime: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
    sessionsUntilLongBreak: 4,
    description: 'The Pomodoro Technique: Work for 25 minutes, then take a 5-minute break. After 4 cycles, take a longer 15-minute break.'
  },
  {
    id: 'short',
    name: 'Short Focus',
    icon: Zap,
    color: '#3b82f6',
    workTime: 15 * 60,
    shortBreak: 3 * 60,
    longBreak: 10 * 60,
    sessionsUntilLongBreak: 4,
    description: 'Perfect for quick bursts of productivity. Work for 15 minutes, take a 3-minute break. After 4 sessions, enjoy a 10-minute longer break.'
  },
  {
    id: 'long',
    name: 'Deep Work',
    icon: BookOpen,
    color: '#8b5cf6',
    workTime: 45 * 60,
    shortBreak: 10 * 60,
    longBreak: 20 * 60,
    sessionsUntilLongBreak: 3,
    description: 'Designed for extended focus sessions. Work for 45 minutes, then take a 10-minute break. After 3 cycles, take a 20-minute longer break.'
  },
  {
    id: 'meditation',
    name: 'Meditation',
    icon: Heart,
    color: '#ec4899',
    workTime: 10 * 60,
    shortBreak: 2 * 60,
    longBreak: 5 * 60,
    sessionsUntilLongBreak: 3,
    description: 'Mindfulness and meditation timer. Meditate for 10 minutes, take a 2-minute break. After 3 sessions, take a 5-minute longer break.'
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: Settings,
    color: '#10b981',
    workTime: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
    sessionsUntilLongBreak: 4,
    description: 'Create your own custom timer with personalized work and break durations.'
  }
];

const CompletionIndicator = ({ show, pomodorosCompleted }) => {
  if (!show) return null;
  
  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none animate-fade-in-up">
      <div className="bg-gradient-to-br from-primary/95 to-primary/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border-2 border-primary/30">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Award className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-white">Session Complete!</p>
            <p className="text-sm text-white/90">
              {pomodorosCompleted} session{pomodorosCompleted !== 1 ? 's' : ''} completed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FullScreenMode = ({ 
  timeLeft, 
  isRunning, 
  isBreak, 
  progress, 
  sessionType, 
  onToggle, 
  onReset, 
  onSkip, 
  onExit,
  formatTime,
  preset
}) => {
  const circumference = 2 * Math.PI * 200;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8">
      <div className="absolute top-6 right-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onExit}
          className="h-9 w-9"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex flex-col items-center justify-center space-y-12 max-w-4xl w-full">
        <div className="text-center">
          <h2 
            className="text-3xl font-semibold mb-2"
            style={{ color: preset.color }}
          >
            {sessionType.text}
          </h2>
          {preset.description && (
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              {preset.description}
            </p>
          )}
        </div>

        <div className="relative w-[500px] h-[500px]">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="250"
              cy="250"
              r="180"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              className="text-muted/20"
            />
            <circle
              cx="250"
              cy="250"
              r="180"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              style={{
                color: preset.color,
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
                transition: 'stroke-dashoffset 1s ease-out'
              }}
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div 
              className="text-8xl font-mono font-light mb-3 tracking-tight"
              style={{ color: preset.color }}
            >
              {formatTime(timeLeft)}
            </div>
            <div className="text-base text-muted-foreground">
              {Math.round(progress)}%
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center gap-4">
          <button
            onClick={onToggle}
            className={`
              relative h-20 w-20 rounded-full transition-all duration-300
              flex items-center justify-center
              ${isRunning 
                ? 'bg-foreground/10 hover:bg-foreground/15' 
                : 'hover:scale-105 active:scale-95'
              }
            `}
            style={isRunning ? {} : { backgroundColor: preset.color }}
          >
            <div className={`
              absolute inset-0 rounded-full transition-opacity duration-300
              ${isRunning ? 'opacity-0' : 'opacity-100'}
            `} style={{ backgroundColor: preset.color }} />
            {isRunning ? (
              <div className="flex items-center justify-center gap-1.5">
                <div className="h-5 w-1.5 bg-foreground rounded-full" />
                <div className="h-5 w-1.5 bg-foreground rounded-full" />
              </div>
            ) : (
              <Play className="h-8 w-8 text-white ml-1" fill="currentColor" />
            )}
          </button>
          
          <Button
            onClick={onReset}
            variant="ghost"
            size="sm"
            className="h-10 px-4 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reset
          </Button>

          <Button
            onClick={onSkip}
            variant="ghost"
            size="sm"
            className="h-10 px-4 text-muted-foreground hover:text-foreground"
          >
            <SkipForward className="h-4 w-4 mr-1.5" />
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
};

const PomodoroTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState('pomodoro');
  const [presets, setPresets] = useState(DEFAULT_PRESETS);
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [newPresetName, setNewPresetName] = useState('');

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

  const celebrate = async () => {
    try {
      await achievementSoundService.playAchievementSound();
    } catch (error) {
      console.error('Failed to play achievement sound:', error);
    }
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2500);
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
        type: 'work'
      });
      localStorageService.saveFocusSessions(sessions);
      
      celebrate();
      showNotification('Work Session Complete', `${newSessionsCompleted} session${newSessionsCompleted !== 1 ? 's' : ''} completed. Time for a break.`);
    } else {
      setIsBreak(false);
      setTimeLeft(workTime);
      showNotification('Break Complete', 'Recharged and ready to focus again');
    }
    setIsRunning(false);
  }, [isBreak, sessionsCompleted, breakTime, longBreakTime, workTime, sessionsUntilLongBreak]);

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
      } catch (error) {
        console.error('Failed to load timer state:', error);
      }
    }
    
    const savedPresets = localStorage.getItem('focusTimerPresets');
    if (savedPresets) {
      try {
        const parsed = JSON.parse(savedPresets);
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
      };
      localStorageService.saveTimerState(state);
    }
  }, [timeLeft, isRunning, isBreak, sessionsCompleted, workTime, breakTime, longBreakTime, isInitialized]);

  useEffect(() => {
    if (!isRunning) {
      const currentTime = isBreak 
        ? (sessionsCompleted % sessionsUntilLongBreak === 0 ? longBreakTime : breakTime)
        : workTime;
      if (timeLeft !== currentTime) {
        setTimeLeft(currentTime);
      }
    }
  }, [selectedPreset, isBreak, workTime, breakTime, longBreakTime, sessionsCompleted, sessionsUntilLongBreak, isRunning]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handleComplete]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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

  const toggleTimer = () => {
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
  const circumference = 2 * Math.PI * 160;
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
      color: '#6366f1',
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

  if (isFullScreen) {
    return (
      <FullScreenMode
        timeLeft={timeLeft}
        isRunning={isRunning}
        isBreak={isBreak}
        progress={progress}
        sessionType={sessionType}
        onToggle={toggleTimer}
        onReset={resetTimer}
        onSkip={skipSession}
        onExit={() => setIsFullScreen(false)}
        formatTime={formatTime}
        preset={currentPreset}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <CompletionIndicator 
        show={showCelebration} 
        pomodorosCompleted={sessionsCompleted}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {sessionType.text}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {currentPreset.name}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullScreen(true)}
              className="h-9 w-9"
              title="Full Screen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Timer */}
          <div className="flex justify-center items-center py-12">
            <div className="relative w-[400px] h-[400px]">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="200"
                  cy="200"
                  r="140"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-muted/20"
                />
                <circle
                  cx="200"
                  cy="200"
                  r="140"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  style={{
                    color: currentPreset.color,
                    strokeDasharray: circumference,
                    strokeDashoffset: strokeDashoffset,
                    transition: 'stroke-dashoffset 1s ease-out'
                  }}
                />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div 
                  className="text-7xl font-mono font-light mb-2 tracking-tight"
                  style={{ color: currentPreset.color }}
                >
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.round(progress)}%
                </div>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={toggleTimer}
              className={`
                relative h-16 w-16 rounded-full transition-all duration-300
                flex items-center justify-center
                ${isRunning 
                  ? 'bg-foreground/10 hover:bg-foreground/15' 
                  : 'hover:scale-105 active:scale-95'
                }
              `}
              style={isRunning ? {} : { backgroundColor: currentPreset.color }}
            >
              <div className={`
                absolute inset-0 rounded-full transition-opacity duration-300
                ${isRunning ? 'opacity-0' : 'opacity-100'}
              `} style={{ backgroundColor: currentPreset.color }} />
              {isRunning ? (
                <div className="flex items-center justify-center gap-1">
                  <div className="h-4 w-1 bg-foreground rounded-full" />
                  <div className="h-4 w-1 bg-foreground rounded-full" />
                </div>
              ) : (
                <Play className="h-7 w-7 text-white ml-0.5" fill="currentColor" />
              )}
            </button>
            
            <Button
              onClick={resetTimer}
              variant="ghost"
              size="sm"
              className="h-9 px-3 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Reset
            </Button>

            <Button
              onClick={skipSession}
              variant="ghost"
              size="sm"
              className="h-9 px-3 text-muted-foreground hover:text-foreground"
              disabled={timeLeft === currentSessionTime}
            >
              <SkipForward className="h-4 w-4 mr-1.5" />
              Skip
            </Button>
          </div>

          {/* Description */}
          {currentPreset.description && (
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                {currentPreset.description}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Presets */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground px-1">Presets</h3>
            <div className="space-y-1.5">
              {presets.map(preset => {
                const defaultPreset = DEFAULT_PRESETS.find(dp => dp.id === preset.id);
                const Icon = defaultPreset ? defaultPreset.icon : (preset.icon || TimerIcon);
                const isSelected = selectedPreset === preset.id;
                const isDefault = !!defaultPreset;
                
                return (
                  <div
                    key={preset.id}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer group
                      ${isSelected 
                        ? 'bg-accent' 
                        : 'hover:bg-accent/50'
                      }
                    `}
                    onClick={() => handlePresetChange(preset.id)}
                  >
                    {typeof Icon === 'function' ? (
                      <Icon className="h-4 w-4 flex-shrink-0" style={{ color: isSelected ? preset.color : undefined }} />
                    ) : (
                      <TimerIcon className="h-4 w-4 flex-shrink-0" style={{ color: isSelected ? preset.color : undefined }} />
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{preset.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.floor(preset.workTime / 60)} min
                      </div>
                    </div>
                    {isSelected && (
                      <div 
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: preset.color }}
                      />
                    )}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        className="h-7 w-7 flex items-center justify-center rounded hover:bg-background transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPreset(preset);
                          setNewPresetName(preset.name);
                          setIsSettingsOpen(true);
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      {!isDefault && (
                        <button
                          type="button"
                          className="h-7 w-7 flex items-center justify-center rounded hover:bg-background transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePreset(preset.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              
              <button
                onClick={handleCreatePreset}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                New Preset
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="pt-4 border-t border-border space-y-4">
            <div>
              <div className="text-2xl font-semibold text-foreground">{sessionsCompleted}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Sessions</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">{totalFocusTime}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Minutes</div>
            </div>
          </div>

          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Timer Preset</DialogTitle>
              </DialogHeader>
              {editingPreset && (
                <div className="space-y-6 py-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-foreground">Preset Name</label>
                    <Input
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      placeholder="Enter preset name"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Focus Time (min)</label>
                      <CustomNumberInput
                        min={1}
                        max={120}
                        step={1}
                        value={Math.floor(editingPreset.workTime / 60)}
                        onChange={(e) => {
                          const minutes = parseInt(e.target.value) || 1;
                          setEditingPreset({ ...editingPreset, workTime: minutes * 60 });
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Short Break (min)</label>
                      <CustomNumberInput
                        min={1}
                        max={60}
                        step={1}
                        value={Math.floor(editingPreset.shortBreak / 60)}
                        onChange={(e) => {
                          const minutes = parseInt(e.target.value) || 1;
                          setEditingPreset({ ...editingPreset, shortBreak: minutes * 60 });
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Long Break (min)</label>
                      <CustomNumberInput
                        min={1}
                        max={120}
                        step={1}
                        value={Math.floor(editingPreset.longBreak / 60)}
                        onChange={(e) => {
                          const minutes = parseInt(e.target.value) || 1;
                          setEditingPreset({ ...editingPreset, longBreak: minutes * 60 });
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Sessions Until Long Break</label>
                      <CustomNumberInput
                        min={1}
                        max={10}
                        step={1}
                        value={editingPreset.sessionsUntilLongBreak || 4}
                        onChange={(e) => {
                          const count = parseInt(e.target.value) || 4;
                          setEditingPreset({ ...editingPreset, sessionsUntilLongBreak: count });
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block text-foreground">Color</label>
                    <div className="grid grid-cols-6 gap-2">
                      {['#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'].map(color => (
                        <button
                          key={color}
                          onClick={() => setEditingPreset({ ...editingPreset, color })}
                          className={`
                            w-full aspect-square rounded-lg border-2 transition-all
                            ${editingPreset.color === color ? 'scale-110 border-foreground' : 'border-transparent hover:scale-105'}
                          `}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsSettingsOpen(false);
                        setEditingPreset(null);
                        setNewPresetName('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSavePreset}
                      disabled={!newPresetName.trim()}
                      style={{ backgroundColor: editingPreset.color }}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Preset
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
