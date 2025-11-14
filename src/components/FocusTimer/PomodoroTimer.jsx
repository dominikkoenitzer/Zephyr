import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, Settings, Award, Flame } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { localStorageService } from '../../services/localStorage';

const DEFAULT_WORK_TIME = 25 * 60; // 25 minutes in seconds
const DEFAULT_BREAK_TIME = 5 * 60; // 5 minutes in seconds
const DEFAULT_LONG_BREAK_TIME = 15 * 60; // 15 minutes in seconds

const STORAGE_KEY = 'zephyr_timer_state';

// Celebration confetti component
const Confetti = ({ show }) => {
  if (!show) return null;
  
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ['bg-primary', 'bg-purple-500', 'bg-pink-500', 'bg-yellow-500', 'bg-green-500'][Math.floor(Math.random() * 5)]
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map(piece => (
        <div
          key={piece.id}
          className={`absolute w-3 h-3 ${piece.color} animate-confetti`}
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            animationDelay: `${piece.delay}s`
          }}
        />
      ))}
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
  const [sessionStreak, setSessionStreak] = useState(0);

  const showNotification = (title, message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/favicon.ico' });
    }
  };

  const celebrate = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  const handleComplete = useCallback((currentIsBreak = isBreak, currentPomodoros = pomodorosCompleted) => {
    const isWorkComplete = !currentIsBreak;
    if (isWorkComplete) {
      const newPomodorosCompleted = currentPomodoros + 1;
      const newStreak = sessionStreak + 1;
      
      setPomodorosCompleted(newPomodorosCompleted);
      setSessionStreak(newStreak);
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
      showNotification('🎉 Work Session Complete!', `Amazing! ${newStreak} in a row. Time for a well-deserved break!`);
    } else {
      setIsBreak(false);
      setTimeLeft(workTime);
      showNotification('✨ Break Complete!', 'Recharged and ready to focus again!');
    }
    setIsRunning(false);
  }, [isBreak, pomodorosCompleted, breakTime, longBreakTime, workTime, sessionStreak]);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        
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
          setTimeLeft(state.timeLeft);
          setIsRunning(false);
        }
        
        setIsBreak(state.isBreak || false);
        setPomodorosCompleted(state.pomodorosCompleted || 0);
        setWorkTime(state.workTime || DEFAULT_WORK_TIME);
        setBreakTime(state.breakTime || DEFAULT_BREAK_TIME);
        setLongBreakTime(state.longBreakTime || DEFAULT_LONG_BREAK_TIME);
        setSessionStreak(state.sessionStreak || 0);
      } catch (error) {
        console.error('Failed to load timer state:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save state to localStorage whenever relevant state changes
  useEffect(() => {
    const state = {
      timeLeft,
      isRunning,
      isBreak,
      pomodorosCompleted,
      workTime,
      breakTime,
      longBreakTime,
      sessionStreak,
      lastSaved: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [timeLeft, isRunning, isBreak, pomodorosCompleted, workTime, breakTime, longBreakTime, sessionStreak]);

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

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(isBreak ? (pomodorosCompleted % 4 === 0 ? longBreakTime : breakTime) : workTime);
  };

  const skipSession = () => {
    setIsRunning(false);
    handleComplete();
  };

  const currentSessionTime = isBreak ? (pomodorosCompleted % 4 === 0 ? longBreakTime : breakTime) : workTime;
  const progress = ((currentSessionTime - timeLeft) / currentSessionTime) * 100;
  const circumference = 2 * Math.PI * 120; // radius of 120
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const totalFocusTime = Math.floor((pomodorosCompleted * workTime) / 60);

  // Session type with emoji
  const getSessionType = () => {
    if (isBreak) {
      return pomodorosCompleted % 4 === 0 ? { text: 'Long Break', emoji: '🌙', color: 'text-purple-500' } : { text: 'Short Break', emoji: '☕', color: 'text-green-500' };
    }
    return { text: 'Focus Time', emoji: '🎯', color: 'text-primary' };
  };

  const sessionType = getSessionType();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Celebration Confetti */}
      <Confetti show={showCelebration} />

      {/* Main Timer Card with Circular Progress */}
      <Card className="glass-card border-none animate-fade-in-up">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
            <span className="text-4xl">{sessionType.emoji}</span>
            <span className={sessionType.color}>{sessionType.text}</span>
          </CardTitle>
          {!isBreak && sessionStreak > 0 && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-sm text-muted-foreground">
                {sessionStreak} session streak! 🔥
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Circular Timer */}
          <div className="flex justify-center items-center">
            <div className="relative w-80 h-80">
              {/* Background circle */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="160"
                  cy="160"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-muted/20"
                />
                {/* Progress circle */}
                <circle
                  cx="160"
                  cy="160"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="12"
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
                <div className="text-7xl font-mono font-bold text-foreground mb-2">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-muted-foreground">
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
              className={`rounded-full w-20 h-20 shadow-lg transition-all ${
                isRunning ? 'animate-pulse-glow' : 'hover:scale-110'
              }`}
              variant={isRunning ? "secondary" : "default"}
            >
              {isRunning ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
            </Button>
            
            <Button
              onClick={resetTimer}
              size="lg"
              variant="outline"
              className="rounded-full px-6 hover:scale-105 transition-transform"
            >
              Reset
            </Button>

            <Button
              onClick={skipSession}
              size="lg"
              variant="ghost"
              className="rounded-full px-6 hover:scale-105 transition-transform"
              disabled={timeLeft === currentSessionTime}
            >
              <SkipForward className="h-5 w-5 mr-2" />
              Skip
            </Button>
          </div>

          {/* Motivational Message */}
          <div className="text-center">
            <p className="text-muted-foreground italic">
              {isRunning 
                ? (isBreak ? "Recharge your energy ✨" : "You're in the zone! Keep going 💪")
                : "Ready when you are"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <Card className="glass-card border-none hover-lift">
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <div className="text-4xl font-bold text-primary mb-1">{pomodorosCompleted}</div>
            <div className="text-sm text-muted-foreground">Pomodoros Completed</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none hover-lift">
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
            <div className="text-4xl font-bold text-orange-500 mb-1">{sessionStreak}</div>
            <div className="text-sm text-muted-foreground">Current Streak</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none hover-lift">
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-4xl">⏱️</span>
            </div>
            <div className="text-4xl font-bold text-primary mb-1">{totalFocusTime}</div>
            <div className="text-sm text-muted-foreground">Minutes Focused</div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <div className="flex justify-center">
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 rounded-full px-6">
              <Settings className="h-4 w-4" />
              Customize Timer
            </Button>
          </DialogTrigger>
        </div>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Timer Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Focus Duration (minutes)</label>
              <Input
                type="number"
                min="1"
                max="60"
                value={Math.floor(workTime / 60)}
                onChange={(e) => setWorkTime(parseInt(e.target.value) * 60)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Short Break (minutes)</label>
              <Input
                type="number"
                min="1"
                max="30"
                value={Math.floor(breakTime / 60)}
                onChange={(e) => setBreakTime(parseInt(e.target.value) * 60)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Long Break (minutes)</label>
              <Input
                type="number"
                min="1"
                max="60"
                value={Math.floor(longBreakTime / 60)}
                onChange={(e) => setLongBreakTime(parseInt(e.target.value) * 60)}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={() => setIsSettingsOpen(false)} 
              className="w-full"
            >
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PomodoroTimer;
