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
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center p-8">
      <div className="absolute top-8 right-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={onExit}
          className="h-14 w-14 rounded-full hover:bg-background/80 backdrop-blur-sm border border-border/50"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
      
      <div className="flex flex-col items-center justify-center space-y-20 max-w-5xl w-full">
        <div className="text-center space-y-6">
          {sessionType.icon && (
            <div className="flex justify-center">
              <div 
                className="p-6 rounded-3xl backdrop-blur-xl border-2 shadow-2xl"
                style={{ 
                  backgroundColor: `${preset.color}15`,
                  borderColor: `${preset.color}40`
                }}
              >
                <sessionType.icon 
                  className="h-16 w-16" 
                  style={{ color: preset.color }}
                />
              </div>
            </div>
          )}
          <h2 
            className="text-5xl font-bold"
            style={{ color: preset.color }}
          >
            {sessionType.text}
          </h2>
          {preset.description && (
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl leading-relaxed">
              {preset.description}
            </p>
          )}
        </div>

        <div className="relative w-[700px] h-[700px]">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="350"
              cy="350"
              r="200"
              stroke="currentColor"
              strokeWidth="24"
              fill="none"
              className="text-muted/10"
            />
            <circle
              cx="350"
              cy="350"
              r="200"
              stroke="currentColor"
              strokeWidth="24"
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
              className="text-[140px] font-mono font-bold mb-6 tracking-tight"
              style={{ color: preset.color }}
            >
              {formatTime(timeLeft)}
            </div>
            <div className="text-3xl text-muted-foreground font-medium">
              {Math.round(progress)}% complete
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center gap-8">
          <Button
            onClick={onToggle}
            size="lg"
            className="w-36 h-36 rounded-full shadow-2xl hover:scale-105 transition-transform"
            style={{ backgroundColor: preset.color }}
          >
            {isRunning ? <Pause className="h-16 w-16" /> : <Play className="h-16 w-16 ml-2" />}
          </Button>
          
          <Button
            onClick={onReset}
            size="lg"
            variant="outline"
            className="h-20 px-10 text-xl rounded-full hover:scale-105 transition-transform border-2 backdrop-blur-sm"
          >
            <RotateCcw className="h-6 w-6 mr-3" />
            Reset
          </Button>

          <Button
            onClick={onSkip}
            size="lg"
            variant="ghost"
            className="h-20 px-10 text-xl rounded-full hover:scale-105 transition-transform backdrop-blur-sm"
          >
            <SkipForward className="h-6 w-6 mr-3" />
            Skip
          </Button>
        </div>

        <div className="text-center">
          <p className="text-3xl text-muted-foreground font-medium">
            {isRunning 
              ? (isBreak ? "Take a moment to recharge" : "Stay focused and maintain your flow")
              : "Ready to begin"}
          </p>
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
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <CompletionIndicator 
        show={showCelebration} 
        pomodorosCompleted={sessionsCompleted}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="glass-card border-none lg:col-span-2 animate-fade-in-up">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {sessionType.icon && (
                  <div 
                    className="p-4 rounded-2xl backdrop-blur-xl border-2 shadow-lg"
                    style={{ 
                      backgroundColor: `${currentPreset.color}15`,
                      borderColor: `${currentPreset.color}40`
                    }}
                  >
                    <sessionType.icon 
                      className="h-7 w-7" 
                      style={{ color: currentPreset.color }}
                    />
                  </div>
                )}
                <div>
                  <CardTitle 
                    className="text-3xl font-bold"
                    style={{ color: currentPreset.color }}
                  >
                    {sessionType.text}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentPreset.name} Timer
                  </p>
                  {currentPreset.description && (
                    <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
                      {currentPreset.description}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullScreen(true)}
                className="h-12 w-12 rounded-xl hover:bg-accent/50"
                title="Enter Full Screen Mode"
              >
                <Maximize2 className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-10">
            <div className="flex justify-center items-center py-8">
              <div className="relative w-[500px] h-[500px]">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="250"
                    cy="250"
                    r="160"
                    stroke="currentColor"
                    strokeWidth="20"
                    fill="none"
                    className="text-muted/10"
                  />
                  <circle
                    cx="250"
                    cy="250"
                    r="160"
                    stroke="currentColor"
                    strokeWidth="20"
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
                    className="text-[100px] font-mono font-bold mb-4 tracking-tight"
                    style={{ color: currentPreset.color }}
                  >
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-xl text-muted-foreground font-medium">
                    {Math.round(progress)}% complete
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center items-center gap-5">
              <Button
                onClick={toggleTimer}
                size="lg"
                className="w-28 h-28 rounded-full shadow-2xl hover:scale-105 transition-transform"
                style={{ backgroundColor: currentPreset.color }}
              >
                {isRunning ? <Pause className="h-12 w-12" /> : <Play className="h-12 w-12 ml-1" />}
              </Button>
              
              <Button
                onClick={resetTimer}
                size="lg"
                variant="outline"
                className="h-16 px-8 rounded-full hover:scale-105 transition-transform border-2 backdrop-blur-sm"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Reset
              </Button>

              <Button
                onClick={skipSession}
                size="lg"
                variant="ghost"
                className="h-16 px-8 rounded-full hover:scale-105 transition-transform backdrop-blur-sm"
                disabled={timeLeft === currentSessionTime}
              >
                <SkipForward className="h-5 w-5 mr-2" />
                Skip
              </Button>
            </div>

            <div className="text-center space-y-4">
              <p className="text-muted-foreground text-lg font-medium">
                {isRunning 
                  ? (isBreak ? "Take a moment to recharge" : "Stay focused and maintain your flow")
                  : "Ready to begin"}
              </p>
              {currentPreset.description && (
                <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentPreset.description}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Card className="glass-card border-none hover-lift">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TimerIcon className="h-5 w-5" />
                Timer Presets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {presets.map(preset => {
                const defaultPreset = DEFAULT_PRESETS.find(dp => dp.id === preset.id);
                const Icon = defaultPreset ? defaultPreset.icon : (preset.icon || TimerIcon);
                const isSelected = selectedPreset === preset.id;
                const isDefault = !!defaultPreset;
                
                return (
                  <div
                    key={preset.id}
                    className={`
                      w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer
                      ${isSelected 
                        ? 'shadow-lg scale-[1.02]' 
                        : 'hover:scale-[1.01] hover:shadow-md'
                      }
                    `}
                    style={{
                      borderColor: isSelected ? preset.color : 'transparent',
                      backgroundColor: isSelected ? `${preset.color}15` : 'transparent',
                    }}
                    onClick={() => handlePresetChange(preset.id)}
                  >
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${preset.color}20` }}
                    >
                      {typeof Icon === 'function' ? (
                        <Icon className="h-5 w-5" style={{ color: preset.color }} />
                      ) : (
                        <TimerIcon className="h-5 w-5" style={{ color: preset.color }} />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-foreground">{preset.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.floor(preset.workTime / 60)} min focus
                      </div>
                      {preset.description && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {preset.description}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5" style={{ color: preset.color }} />
                    )}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPreset(preset);
                          setNewPresetName(preset.name);
                          setIsSettingsOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </button>
                      {!isDefault && (
                        <button
                          type="button"
                          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePreset(preset.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              
              <Button
                variant="outline"
                className="w-full justify-start gap-3 mt-2"
                onClick={handleCreatePreset}
              >
                <Plus className="h-4 w-4" />
                Create Custom Timer
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="glass-card border-none hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: `${currentPreset.color}20` }}
                  >
                    <Award className="h-6 w-6" style={{ color: currentPreset.color }} />
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-foreground">{sessionsCompleted}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Sessions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-none hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: `${currentPreset.color}20` }}
                  >
                    <Clock className="h-6 w-6" style={{ color: currentPreset.color }} />
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-foreground">{totalFocusTime}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Minutes Focused</div>
                  </div>
                </div>
              </CardContent>
            </Card>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Focus Time (min)</label>
                      <Input
                        type="number"
                        min={1}
                        max={120}
                        value={Math.floor(editingPreset.workTime / 60)}
                        onChange={(e) => {
                          const minutes = parseInt(e.target.value) || 1;
                          setEditingPreset({ ...editingPreset, workTime: minutes * 60 });
                        }}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Short Break (min)</label>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={Math.floor(editingPreset.shortBreak / 60)}
                        onChange={(e) => {
                          const minutes = parseInt(e.target.value) || 1;
                          setEditingPreset({ ...editingPreset, shortBreak: minutes * 60 });
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Long Break (min)</label>
                      <Input
                        type="number"
                        min={1}
                        max={120}
                        value={Math.floor(editingPreset.longBreak / 60)}
                        onChange={(e) => {
                          const minutes = parseInt(e.target.value) || 1;
                          setEditingPreset({ ...editingPreset, longBreak: minutes * 60 });
                        }}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Sessions Until Long Break</label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={editingPreset.sessionsUntilLongBreak || 4}
                        onChange={(e) => {
                          const count = parseInt(e.target.value) || 4;
                          setEditingPreset({ ...editingPreset, sessionsUntilLongBreak: count });
                        }}
                        className="w-full"
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
