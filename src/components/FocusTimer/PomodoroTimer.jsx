import { useMemo } from 'react';
import {
  Play, SkipForward, Maximize2, RotateCcw, Plus, Trash2, Edit2, Target,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useStoreValue, useTasks } from '../../hooks/useStore';
import { localStorageService } from '../../services/localStorage';
import { activeStreak, streakAtRisk } from '../../lib/streak';
import { sortByUrgency } from '../../lib/taskFilters';
import { DEFAULT_PRESETS } from './presets';
import FullScreenMode from './FullScreenMode';
import PresetSettingsDialog from './PresetSettingsDialog';
import { formatTime, usePomodoro } from './usePomodoro';

const NO_TASK = 'none';

const readStreak = () => localStorageService.getFocusStreak();

const PomodoroTimer = () => {
  const {
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
    sessionsCompleted,
    totalFocusTime,
    sessionTask,
    setSessionTask,
    presets,
    selectedPreset,
    currentPreset,
    handlePresetChange,
    handleCreatePreset,
    handleDeletePreset,
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
    isFullScreen,
    setIsFullScreen,
  } = usePomodoro();

  // The streak has been counted since the timer shipped and shown nowhere.
  const [streak] = useStoreValue(readStreak);
  const streakDays = activeStreak(streak);
  const atRisk = streakAtRisk(streak);

  // What you can point this session at. A task picked earlier stays listed
  // even after it is completed, so the picker never blanks out mid-session.
  const [tasks] = useTasks();
  const taskOptions = useMemo(() => {
    const active = sortByUrgency(tasks.filter((t) => !t.completed));
    if (sessionTask?.id && !active.some((t) => t.id === sessionTask.id)) {
      return [{ id: sessionTask.id, title: sessionTask.title }, ...active];
    }
    return active;
  }, [tasks, sessionTask]);

  const chooseTask = (value) => {
    if (value === NO_TASK) {
      setSessionTask(null);
      return;
    }
    const task = taskOptions.find((t) => t.id === value);
    if (task) setSessionTask({ id: task.id, title: task.title });
  };

  if (isFullScreen) {
    return (
      <FullScreenMode
        timeLeft={timeLeft}
        isRunning={isRunning}
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
    <div className="w-full space-y-(--section-gap)">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-(--panel-gap)">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Header — the bar already carries the page's name, so the state
              of the session is set as an eyebrow rather than a second title. */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="flex flex-wrap items-center gap-x-2.5 text-[12px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                <span className={isRunning ? 'text-foreground' : undefined}>{sessionType.text}</span>
                <span aria-hidden="true">·</span>
                <span>{currentPreset.name}</span>
              </h2>
              {/* What this session is for. Previously this could only be set
                  by arriving from a task's Focus button; now it is a picker,
                  and finishing the session offers to tick the task off. */}
              {sessionTask?.title && !sessionTask.id ? (
                <p className="mt-2 flex items-center gap-1.5 text-[16px] text-foreground">
                  <Target className="h-3.5 w-3.5 shrink-0 text-primary-strong" />
                  <span className="truncate max-w-[14rem] sm:max-w-sm">{sessionTask.title}</span>
                </p>
              ) : taskOptions.length > 0 || sessionTask?.id ? (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 shrink-0 text-primary-strong" aria-hidden="true" />
                  <Select value={sessionTask?.id || NO_TASK} onValueChange={chooseTask}>
                    <SelectTrigger
                      aria-label="Task for this session"
                      className="h-8 w-[min(20rem,60vw)] rounded-none border-0 border-b border-transparent bg-transparent px-0 text-[16px] text-foreground hover:border-border focus:ring-0 data-[state=open]:border-border"
                    >
                      <SelectValue placeholder="Focus on…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_TASK}>No specific task</SelectItem>
                      {taskOptions.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullScreen(true)}
              className="h-8 w-8 sm:h-9 sm:w-9"
              title="Full Screen"
            >
              <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>

          {/* Timer */}
          <div className="flex justify-center items-center py-6 sm:py-8 md:py-12">
            <div ref={timerContainerRef} className="relative w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[400px] md:h-[400px]">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-muted-foreground/25"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
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
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-mono font-light mb-1 sm:mb-2 tracking-tight"
                  style={{ color: currentPreset.color }}
                >
                  {formatTime(timeLeft)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {Math.round(progress)}%
                </div>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex justify-center items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={toggleTimer}
              aria-label={isRunning ? "Pause timer" : "Start timer"}
              title={isRunning ? "Pause timer" : "Start timer"}
              className={`
                h-14 w-14 sm:h-16 sm:w-16 rounded-full transition-all duration-300
                flex items-center justify-center relative
                ${isRunning
                  ? 'bg-foreground/10 hover:bg-foreground/15'
                  : 'btn-shine hover:scale-105 active:scale-95'
                }
              `}
              style={isRunning ? {} : { backgroundColor: currentPreset.color }}
            >
              {isRunning ? (
                <div className="flex items-center justify-center gap-1 z-10">
                  <div className="h-3.5 w-0.5 sm:h-4 sm:w-1 bg-foreground rounded-full" />
                  <div className="h-3.5 w-0.5 sm:h-4 sm:w-1 bg-foreground rounded-full" />
                </div>
              ) : (
                <Play className="h-6 w-6 sm:h-7 sm:w-7 text-white ml-0.5 z-10" strokeWidth={2.5} />
              )}
            </button>
            
            <Button
              onClick={resetTimer}
              aria-label="Reset timer"
              variant="ghost"
              size="sm"
              className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">Reset</span>
            </Button>

            <Button
              onClick={skipSession}
              aria-label="Skip session"
              variant="ghost"
              size="sm"
              className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground hover:text-foreground"
              disabled={timeLeft === currentSessionTime}
            >
              <SkipForward className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">Skip</span>
            </Button>
          </div>

          {/* Description */}
          {currentPreset.description && (
            <div className="text-center pt-3 sm:pt-4">
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed px-2">
                {currentPreset.description}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Presets — the same hairline rows the task list uses */}
          <div>
            <h3 className="mb-1 flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              <span>Presets</span>
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
            </h3>
            <ul className="divide-y divide-border">
              {presets.map((preset) => {
                const defaultPreset = DEFAULT_PRESETS.find((dp) => dp.id === preset.id);
                const isSelected = selectedPreset === preset.id;
                const isDefault = !!defaultPreset;

                return (
                  <li key={preset.id} className="group/preset">
                    <div
                      onClick={() => handlePresetChange(preset.id)}
                      className="flex cursor-pointer items-center gap-3 py-2.5"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full transition-colors"
                        style={{ backgroundColor: isSelected ? preset.color : 'transparent' }}
                        aria-hidden="true"
                      />
                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate text-[16px] transition-colors',
                          isSelected ? 'text-foreground' : 'text-muted-foreground group-hover/preset:text-foreground'
                        )}
                      >
                        {preset.name}
                      </span>

                      <span className="relative shrink-0">
                        <span className="block text-[13px] tabular-nums text-muted-foreground transition-opacity sm:group-hover/preset:opacity-0 sm:group-focus-within/preset:opacity-0">
                          {Math.floor(preset.workTime / 60)} min
                        </span>
                        <span className="pointer-events-none absolute -top-1.5 right-0 hidden items-center gap-0.5 opacity-0 transition-opacity sm:flex sm:group-hover/preset:pointer-events-auto sm:group-hover/preset:opacity-100 sm:group-focus-within/preset:pointer-events-auto sm:group-focus-within/preset:opacity-100">
                          <button
                            type="button"
                            aria-label={`Edit ${preset.name}`}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPreset(preset);
                              setNewPresetName(preset.name);
                              setIsSettingsOpen(true);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {!isDefault && (
                            <button
                              type="button"
                              aria-label={`Delete ${preset.name}`}
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePreset(preset.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </span>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={handleCreatePreset}
              className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              New preset
            </button>
          </div>

          {/* Today's figures, set like the ones on the home screen */}
          <dl className="grid grid-cols-3 gap-4 border-t border-border pt-6">
            <div>
              <dd className="text-3xl font-semibold tabular-nums tracking-[-0.03em] text-foreground">
                {sessionsCompleted}
              </dd>
              <dt className="mt-1.5 text-[12px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Sessions
              </dt>
            </div>
            <div>
              <dd className="text-3xl font-semibold tabular-nums tracking-[-0.03em] text-foreground">
                {totalFocusTime}
              </dd>
              <dt className="mt-1.5 text-[12px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Minutes
              </dt>
            </div>
            <div>
              <dd
                className={cn(
                  'text-3xl font-semibold tabular-nums tracking-[-0.03em]',
                  streakDays > 0 ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {streakDays}
              </dd>
              <dt className="mt-1.5 text-[12px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Day streak
              </dt>
            </div>
          </dl>

          {/* The warning gets its own line: inside the column it wrapped mid
              label, and a streak is only worth showing if you can act on it. */}
          {atRisk && (
            <p className="text-[13px] text-muted-foreground">
              Finish a session today to keep your {streakDays}-day streak.
            </p>
          )}

          <PresetSettingsDialog
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            preset={editingPreset}
            onPresetChange={setEditingPreset}
            name={newPresetName}
            onNameChange={setNewPresetName}
            colorDraft={presetColorDraft}
            onColorDraftChange={setPresetColorDraft}
            colorHex={editingPresetHex}
            onSave={handleSavePreset}
            onCancel={cancelPresetEdit}
          />
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
