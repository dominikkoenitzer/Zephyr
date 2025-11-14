import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, Settings, Award, Clock, Target, Maximize2, X, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { NumberInput } from '../ui/number-input';
import { localStorageService } from '../../services/localStorage';
import { ambientSoundService, SOUND_OPTIONS } from '../../services/ambientSounds';
import { achievementSoundService } from '../../services/achievementSound';

const DEFAULT_WORK_TIME = 25 * 60; // 25 minutes in seconds
const DEFAULT_BREAK_TIME = 5 * 60; // 5 minutes in seconds
const DEFAULT_LONG_BREAK_TIME = 15 * 60; // 15 minutes in seconds;

// Subtle completion indicator in bottom right
const CompletionIndicator = ({ show, pomodorosCompleted }) => {
  if (!show) return null;
  
  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <div className="bg-background/95 backdrop-blur-md rounded-xl p-4 shadow-lg border-2 border-primary/30 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Session Complete!</p>
            <p className="text-xs text-muted-foreground">
              {pomodorosCompleted} pomodoro{pomodorosCompleted !== 1 ? 's' : ''} completed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Full Screen Focus Mode
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
  formatTime 
}) => {
  const circumference = 2 * Math.PI * 180;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8">
      {/* Exit Button */}
      <div className="absolute top-6 right-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onExit}
          className="h-12 w-12 rounded-full hover:bg-background/80"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
      
      <div className="flex flex-col items-center justify-center space-y-16 max-w-4xl w-full">
        {/* Session Type */}
        <div className="text-center space-y-4">
          {sessionType.icon && (
            <div className="flex justify-center">
              <div className={`p-4 rounded-2xl ${isBreak ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                <sessionType.icon className={`h-12 w-12 ${sessionType.color}`} />
              </div>
            </div>
          )}
          <h2 className={`text-4xl font-bold ${sessionType.color}`}>
            {sessionType.text}
          </h2>
        </div>

        {/* Large Circular Timer */}
        <div className="relative w-[600px] h-[600px]">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="300"
              cy="300"
              r="180"
              stroke="currentColor"
              strokeWidth="20"
              fill="none"
              className="text-muted/10"
            />
            <circle
              cx="300"
              cy="300"
              r="180"
              stroke="currentColor"
              strokeWidth="20"
              fill="none"
              strokeLinecap="round"
              className={`transition-all duration-1000 ${isBreak ? 'text-green-500' : 'text-primary'}`}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset
              }}
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-9xl font-mono font-bold text-foreground mb-4 tracking-tight">
              {formatTime(timeLeft)}
            </div>
            <div className="text-2xl text-muted-foreground font-medium">
              {Math.round(progress)}% complete
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-6">
          <Button
            onClick={onToggle}
            size="lg"
            className={`w-28 h-28 rounded-full shadow-2xl transition-all ${
              isRunning ? 'bg-primary/90 hover:bg-primary' : 'hover:scale-105'
            }`}
            variant={isRunning ? "default" : "default"}
          >
            {isRunning ? <Pause className="h-12 w-12" /> : <Play className="h-12 w-12 ml-1" />}
          </Button>
          
          <Button
            onClick={onReset}
            size="lg"
            variant="outline"
            className="h-16 px-8 text-lg rounded-full hover:scale-105 transition-transform border-2"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Reset
          </Button>

          <Button
            onClick={onSkip}
            size="lg"
            variant="ghost"
            className="h-16 px-8 text-lg rounded-full hover:scale-105 transition-transform"
          >
            <SkipForward className="h-5 w-5 mr-2" />
            Skip
          </Button>
        </div>

        {/* Status Message */}
        <div className="text-center">
          <p className="text-2xl text-muted-foreground font-medium">
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
  const [timeLeft, setTimeLeft] = useState(DEFAULT_WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  const [workTime, setWorkTime] = useState(DEFAULT_WORK_TIME);
  const [breakTime, setBreakTime] = useState(DEFAULT_BREAK_TIME);
  const [longBreakTime, setLongBreakTime] = useState(DEFAULT_LONG_BREAK_TIME);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedSound, setSelectedSound] = useState('silence');
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [isSoundDialogOpen, setIsSoundDialogOpen] = useState(false);

  const showNotification = (title, message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/favicon.ico' });
    }
  };

  const celebrate = async () => {
    // Play achievement sound
    try {
      await achievementSoundService.playAchievementSound();
    } catch (error) {
      console.error('Failed to play achievement sound:', error);
    }
    
    // Show celebration
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2500);
  };

  const handleComplete = useCallback((currentIsBreak = isBreak, currentPomodoros = pomodorosCompleted) => {
    const isWorkComplete = !currentIsBreak;
    if (isWorkComplete) {
      const newPomodorosCompleted = currentPomodoros + 1;
      
      setPomodorosCompleted(newPomodorosCompleted);
      setIsBreak(true);
      
      const nextBreakTime = newPomodorosCompleted % 4 === 0 ? longBreakTime : breakTime;
      setTimeLeft(nextBreakTime);
      
      // Save completed session
      const sessions = localStorageService.getFocusSessions();
      sessions.push({
        date: new Date().toISOString(),
        duration: workTime,
        type: 'work'
      });
      localStorageService.saveFocusSessions(sessions);
      
      // Celebrate!
      celebrate();
      showNotification('Work Session Complete', `${newPomodorosCompleted} pomodoro${newPomodorosCompleted !== 1 ? 's' : ''} completed. Time for a break.`);
    } else {
      setIsBreak(false);
      setTimeLeft(workTime);
      showNotification('Break Complete', 'Recharged and ready to focus again');
    }
    setIsRunning(false);
  }, [isBreak, pomodorosCompleted, breakTime, longBreakTime, workTime]);

  // Load state from localStorage on mount
  useEffect(() => {
    const state = localStorageService.getTimerState();
    if (state) {
      try {
        // Calculate time elapsed since last save if timer was running
        if (state.isRunning && state.lastSaved) {
          const timeElapsed = Math.floor((Date.now() - state.lastSaved) / 1000);
          const newTimeLeft = Math.max(0, state.timeLeft - timeElapsed);
          
          setTimeLeft(newTimeLeft);
          
          // If time ran out while away, handle completion
          if (newTimeLeft === 0 && state.timeLeft > 0) {
            handleComplete(state.isBreak, state.pomodorosCompleted);
            setIsRunning(false);
          } else {
            setIsRunning(state.isRunning);
          }
        } else {
          setTimeLeft(state.timeLeft || DEFAULT_WORK_TIME);
          setIsRunning(false);
        }
        
        setIsBreak(state.isBreak || false);
        setPomodorosCompleted(state.pomodorosCompleted || 0);
        setWorkTime(state.workTime || DEFAULT_WORK_TIME);
        setBreakTime(state.breakTime || DEFAULT_BREAK_TIME);
        setLongBreakTime(state.longBreakTime || DEFAULT_LONG_BREAK_TIME);
      } catch (error) {
        console.error('Failed to load timer state:', error);
      }
    }
    setIsInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save state to localStorage whenever relevant state changes (but not on initial load)
  useEffect(() => {
    if (isInitialized) {
      const state = {
        timeLeft,
        isRunning,
        isBreak,
        pomodorosCompleted,
        workTime,
        breakTime,
        longBreakTime,
      };
      localStorageService.saveTimerState(state);
    }
  }, [timeLeft, isRunning, isBreak, pomodorosCompleted, workTime, breakTime, longBreakTime, isInitialized]);

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

  // Request notification permission on first interaction
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Load sound preference
  useEffect(() => {
    const savedSound = localStorage.getItem('focusSound') || 'silence';
    const savedVolume = parseFloat(localStorage.getItem('focusSoundVolume') || '0.5');
    setSelectedSound(savedSound);
    setSoundVolume(savedVolume);
    ambientSoundService.setVolume(savedVolume);
  }, []);

  // Play/stop sound based on selection and timer state
  useEffect(() => {
    const playSoundWhenReady = async () => {
      if (isRunning && !isBreak && selectedSound !== 'silence') {
        try {
          await ambientSoundService.init();
          await ambientSoundService.playSound(selectedSound);
        } catch (error) {
          console.error('Failed to play sound:', error);
        }
      } else {
        ambientSoundService.stop();
      }
    };

    playSoundWhenReady();

    return () => {
      ambientSoundService.stop();
    };
  }, [isRunning, isBreak, selectedSound]);

  // Apply theme based on selected sound
  useEffect(() => {
    const sound = SOUND_OPTIONS.find(s => s.id === selectedSound);
    if (sound && sound.theme) {
      const root = document.documentElement;
      root.setAttribute('data-sound-theme', sound.theme);
      
      // Apply theme colors
      if (sound.color) {
        const rgb = hexToRgb(sound.color);
        if (rgb) {
          root.style.setProperty('--sound-accent', `${rgb.r} ${rgb.g} ${rgb.b}`);
        }
      }
    } else {
      document.documentElement.removeAttribute('data-sound-theme');
      document.documentElement.style.removeProperty('--sound-accent');
    }
  }, [selectedSound]);

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const handleSoundChange = async (soundId) => {
    setSelectedSound(soundId);
    localStorage.setItem('focusSound', soundId);
    
    // Always try to play when user selects a sound (for testing)
    if (soundId !== 'silence') {
      try {
        await ambientSoundService.init(); // Ensure audio context is ready
        await ambientSoundService.playSound(soundId);
      } catch (error) {
        console.error('Failed to play sound on selection:', error);
      }
    } else {
      ambientSoundService.stop();
    }
    
    // Also play if timer is running
    if (isRunning && !isBreak && soundId !== 'silence') {
      ambientSoundService.playSound(soundId);
    }
  };

  const handleVolumeChange = (volume) => {
    setSoundVolume(volume);
    localStorage.setItem('focusSoundVolume', volume.toString());
    ambientSoundService.setVolume(volume);
  };

  // Prevent body scroll when in full screen
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
    setTimeLeft(isBreak ? (pomodorosCompleted % 4 === 0 ? longBreakTime : breakTime) : workTime);
  };

  const resetToDefaults = () => {
    setWorkTime(DEFAULT_WORK_TIME);
    setBreakTime(DEFAULT_BREAK_TIME);
    setLongBreakTime(DEFAULT_LONG_BREAK_TIME);
    setTimeLeft(DEFAULT_WORK_TIME);
    setIsBreak(false);
    setIsRunning(false);
    setIsSettingsOpen(false);
  };

  const skipSession = () => {
    setIsRunning(false);
    handleComplete();
  };

  const currentSessionTime = isBreak ? (pomodorosCompleted % 4 === 0 ? longBreakTime : breakTime) : workTime;
  const progress = ((currentSessionTime - timeLeft) / currentSessionTime) * 100;
  const circumference = 2 * Math.PI * 140; // radius of 140
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const totalFocusTime = Math.floor((pomodorosCompleted * workTime) / 60);

  // Session type
  const getSessionType = () => {
    if (isBreak) {
      return pomodorosCompleted % 4 === 0 
        ? { text: 'Long Break', icon: Clock, color: 'text-purple-500' } 
        : { text: 'Short Break', icon: Clock, color: 'text-green-500' };
    }
    return { text: 'Focus Time', icon: Target, color: 'text-primary' };
  };

  const sessionType = getSessionType();

  // Full screen mode
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
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Completion Indicator */}
      <CompletionIndicator 
        show={showCelebration} 
        pomodorosCompleted={pomodorosCompleted}
      />

      {/* Main Timer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timer Card - Takes 2 columns on large screens */}
        <Card className="glass-card border-none lg:col-span-2 animate-fade-in-up">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {sessionType.icon && (
                  <div className={`p-3 rounded-xl ${isBreak ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                    <sessionType.icon className={`h-6 w-6 ${sessionType.color}`} />
                  </div>
                )}
                <div>
                  <CardTitle className={`text-2xl font-bold ${sessionType.color}`}>
                    {sessionType.text}
                  </CardTitle>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullScreen(true)}
                className="h-10 w-10 rounded-lg"
                title="Enter Full Screen Mode"
              >
                <Maximize2 className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Circular Timer */}
            <div className="flex justify-center items-center py-8">
              <div className="relative w-[400px] h-[400px]">
                {/* Background circle */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="200"
                    cy="200"
                    r="140"
                    stroke="currentColor"
                    strokeWidth="16"
                    fill="none"
                    className="text-muted/10"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="200"
                    cy="200"
                    r="140"
                    stroke="currentColor"
                    strokeWidth="16"
                    fill="none"
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ${isBreak ? 'text-green-500' : 'text-primary'}`}
                    style={{
                      strokeDasharray: circumference,
                      strokeDashoffset: strokeDashoffset
                    }}
                  />
                </svg>
                
                {/* Timer Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-8xl font-mono font-bold text-foreground mb-3 tracking-tight">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-lg text-muted-foreground font-medium">
                    {Math.round(progress)}% complete
                  </div>
                </div>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex justify-center items-center gap-4">
              <Button
                onClick={toggleTimer}
                size="lg"
                className={`w-24 h-24 rounded-full shadow-xl transition-all ${
                  isRunning ? '' : 'hover:scale-105'
                }`}
                variant={isRunning ? "secondary" : "default"}
              >
                {isRunning ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10 ml-1" />}
              </Button>
              
              <Button
                onClick={resetTimer}
                size="lg"
                variant="outline"
                className="h-14 px-6 rounded-full hover:scale-105 transition-transform border-2"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Reset
              </Button>

              <Button
                onClick={skipSession}
                size="lg"
                variant="ghost"
                className="h-14 px-6 rounded-full hover:scale-105 transition-transform"
                disabled={timeLeft === currentSessionTime}
              >
                <SkipForward className="h-5 w-5 mr-2" />
                Skip
              </Button>
            </div>

            {/* Status Message */}
            <div className="text-center">
              <p className="text-muted-foreground text-base font-medium">
                {isRunning 
                  ? (isBreak ? "Take a moment to recharge" : "Stay focused and maintain your flow")
                  : "Ready to begin"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats & Controls Sidebar */}
        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {/* Stats Cards */}
          <div className="space-y-4">
            <Card className="glass-card border-none hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground">{pomodorosCompleted}</div>
                    <div className="text-xs text-muted-foreground">Pomodoros</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-none hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground">{totalFocusTime}</div>
                    <div className="text-xs text-muted-foreground">Minutes Focused</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <Dialog open={isSoundDialogOpen} onOpenChange={setIsSoundDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-3 h-12">
                  {selectedSound !== 'silence' ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                  Ambient Sound
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Ambient Sounds</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    {SOUND_OPTIONS.map((sound) => {
                      const IconComponent = sound.icon;
                      return (
                        <button
                          key={sound.id}
                          onClick={() => handleSoundChange(sound.id)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            selectedSound === sound.id
                              ? 'border-primary bg-primary/10 shadow-md'
                              : 'border-border hover:border-primary/50 hover:bg-accent/50'
                          }`}
                        >
                          <div className="mb-2">
                            <IconComponent className="h-6 w-6 text-primary" />
                          </div>
                          <div className="font-medium text-sm text-foreground">{sound.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{sound.description}</div>
                          {selectedSound === sound.id && sound.id !== 'silence' && (
                            <div className="mt-2 text-xs text-primary font-medium">Playing...</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                    Click a sound to test it. Sounds will play automatically during focus sessions.
                  </div>
                  {selectedSound !== 'silence' && (
                    <div className="space-y-2 pt-2 border-t">
                      <label className="text-sm font-medium text-foreground block">
                        Volume: {Math.round(soundVolume * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={soundVolume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-3 h-12">
                  <Settings className="h-4 w-4" />
                  Timer Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Timer Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground block">
                      Focus Duration (minutes)
                    </label>
                    <NumberInput
                      min={1}
                      max={60}
                      value={Math.floor(workTime / 60)}
                      onChange={(e) => setWorkTime(parseInt(e.target.value) * 60 || DEFAULT_WORK_TIME)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground block">
                      Short Break (minutes)
                    </label>
                    <NumberInput
                      min={1}
                      max={30}
                      value={Math.floor(breakTime / 60)}
                      onChange={(e) => setBreakTime(parseInt(e.target.value) * 60 || DEFAULT_BREAK_TIME)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground block">
                      Long Break (minutes)
                    </label>
                    <NumberInput
                      min={1}
                      max={60}
                      value={Math.floor(longBreakTime / 60)}
                      onChange={(e) => setLongBreakTime(parseInt(e.target.value) * 60 || DEFAULT_LONG_BREAK_TIME)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => setIsSettingsOpen(false)} 
                        className="flex-1"
                      >
                        Save Settings
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setIsSettingsOpen(false)} 
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={resetToDefaults}
                      className="w-full"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset to Defaults
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
