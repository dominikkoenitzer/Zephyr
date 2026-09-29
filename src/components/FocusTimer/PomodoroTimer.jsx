import { useMemo } from 'react';
import {
  Play, Pause, SkipForward, Maximize2, RotateCcw, Plus, Trash2, Edit2, Target,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { NightSurface } from '../ui/night-surface';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useStoreValue, useTasks } from '../../hooks/useStore';
import { localStorageService } from '../../services/localStorage';
import { activeStreak, streakAtRisk } from '../../lib/streak';
import { sortByUrgency } from '../../lib/taskFilters';
import { DEFAULT_PRESETS } from './presets';
import FullScreenMode from './FullScreenMode';
import SunDial from './SunDial';
import PresetSettingsDialog from './PresetSettingsDialog';
import { formatTime, usePomodoro } from './usePomodoro';

const NO_TASK = 'none';

const readStreak = () => localStorageService.getFocusStreak();

const PomodoroTimer = () => {
  const {
    timeLeft,
    isRunning,
    progress,
    currentSessionTime,
    sessionType,
    isBreak,
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
        isBreak={isBreak}
      />
    );
  }

  const card = 'rounded-3xl bg-card p-6 shadow-(--shadow-card)';
  const roundControl =
    'flex h-12 w-12 items-center justify-center rounded-full bg-hero-foreground/10 text-hero-foreground transition-colors hover:bg-hero-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun disabled:pointer-events-none disabled:opacity-40';

  return (
    <div className="grid w-full grid-cols-1 items-start gap-(--panel-gap) xl:grid-cols-12">
      {/* The timer: one night card with the ring at its centre */}
      <NightSurface as="section" aria-label="Timer" className="flex min-h-[34rem] flex-col p-5 sm:p-7 xl:col-span-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
              <span className="rounded-full bg-hero-foreground/12 px-3 py-1">{sessionType.text}</span>
              <span className="text-hero-foreground/65">{currentPreset.name}</span>
            </p>
            {/* What this session is for. Finishing the session offers to tick
                the task off. */}
            {sessionTask?.title && !sessionTask.id ? (
              <p className="mt-3 flex items-center gap-2 text-[17px] font-semibold">
                <Target className="h-4 w-4 shrink-0 text-sun" />
                <span className="max-w-[14rem] truncate sm:max-w-md">{sessionTask.title}</span>
              </p>
            ) : taskOptions.length > 0 || sessionTask?.id ? (
              <div className="mt-3 flex items-center gap-2">
                <Target className="h-4 w-4 shrink-0 text-sun" aria-hidden="true" />
                <Select value={sessionTask?.id || NO_TASK} onValueChange={chooseTask}>
                  <SelectTrigger
                    aria-label="Task for this session"
                    className="h-9 w-[min(22rem,62vw)] rounded-full border-0 bg-hero-foreground/10 px-4 text-left text-[15px] font-semibold text-hero-foreground [&>span]:truncate hover:bg-hero-foreground/15 focus:ring-2 focus:ring-sun focus:ring-offset-0 [&>svg]:text-hero-foreground/70"
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
          <button
            type="button"
            onClick={() => setIsFullScreen(true)}
            className={cn(roundControl, 'h-10 w-10')}
            aria-label="Full screen"
            title="Full screen (F)"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {/* The day the session is: the sun crosses the sky and sets at the end */}
        <div ref={timerContainerRef} className="mx-auto flex w-full max-w-xl flex-1 items-center py-6">
          <SunDial progress={progress} isBreak={isBreak}>
            <p className="text-[3.75rem] font-semibold leading-none tracking-[-0.04em] tabular-nums sm:text-[5.25rem]">
              {formatTime(timeLeft)}
            </p>
          </SunDial>
        </div>
        <p className="-mt-2 mb-6 text-center text-sm font-medium text-hero-foreground/65">
          {Math.round(progress)}% through
        </p>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button type="button" onClick={resetTimer} aria-label="Reset timer" title="Reset (R)" className={roundControl}>
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={toggleTimer}
            aria-label={isRunning ? 'Pause timer' : 'Start timer'}
            title={isRunning ? 'Pause (Space)' : 'Start (Space)'}
            className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-hero-foreground text-hero-to shadow-lg transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sun/60"
          >
            {isRunning ? <Pause className="h-7 w-7" strokeWidth={2.5} /> : <Play className="ml-1 h-7 w-7" strokeWidth={2.5} />}
          </button>
          <button
            type="button"
            onClick={skipSession}
            aria-label="Skip session"
            title="Skip (S)"
            className={roundControl}
            disabled={timeLeft === currentSessionTime}
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        {currentPreset.description && (
          <p className="mx-auto mt-6 max-w-md text-center text-[13px] leading-relaxed text-hero-foreground/65">
            {currentPreset.description}
          </p>
        )}
      </NightSurface>

      <div className="space-y-(--panel-gap) xl:col-span-4">
        {/* Presets */}
        <section className={card} aria-labelledby="presets-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="presets-title" className="text-[17px] font-semibold tracking-[-0.015em]">Presets</h2>
            <button
              type="button"
              onClick={handleCreatePreset}
              className="flex h-8 items-center gap-1 rounded-full border border-foreground/15 px-3 text-[13px] font-semibold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              New
            </button>
          </div>
          <ul className="mt-4 space-y-1">
            {presets.map((preset) => {
              const defaultPreset = DEFAULT_PRESETS.find((dp) => dp.id === preset.id);
              const isSelected = selectedPreset === preset.id;
              const isDefault = !!defaultPreset;

              return (
                <li key={preset.id} className="group/preset">
                  <div
                    onClick={() => handlePresetChange(preset.id)}
                    className={cn(
                      '-mx-2 flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors',
                      isSelected ? 'bg-accent' : 'hover:bg-accent/60'
                    )}
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: preset.color, opacity: isSelected ? 1 : 0.45 }}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        'min-w-0 flex-1 truncate text-[15px]',
                        isSelected ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground group-hover/preset:text-foreground'
                      )}
                    >
                      {preset.name}
                    </span>

                    <span className="relative shrink-0">
                      <span className="block rounded-full bg-card px-2.5 py-0.5 text-[12px] font-semibold tabular-nums text-foreground transition-opacity sm:group-hover/preset:opacity-0 sm:group-focus-within/preset:opacity-0">
                        {Math.floor(preset.workTime / 60)} min
                      </span>
                      <span className="pointer-events-none absolute -top-1.5 right-0 hidden items-center gap-1 opacity-0 transition-opacity sm:flex sm:group-hover/preset:pointer-events-auto sm:group-hover/preset:opacity-100 sm:group-focus-within/preset:pointer-events-auto sm:group-focus-within/preset:opacity-100">
                        <button
                          type="button"
                          aria-label={`Edit ${preset.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-muted-foreground shadow-(--shadow-sm) transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-muted-foreground shadow-(--shadow-sm) transition-colors hover:text-destructive-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        </section>

        {/* Today's figures */}
        <section className={card} aria-labelledby="today-title">
          <h2 id="today-title" className="text-[17px] font-semibold tracking-[-0.015em]">So far</h2>
          <dl className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Sessions', value: sessionsCompleted },
              { label: 'Minutes', value: totalFocusTime },
              { label: 'Day streak', value: streakDays, quiet: streakDays === 0 },
            ].map((f) => (
              <div key={f.label} className="flex flex-col-reverse rounded-2xl bg-accent px-3 py-3">
                <dt className="mt-1 text-[12px] font-medium text-muted-foreground">{f.label}</dt>
                <dd className={cn('text-[1.75rem] font-semibold leading-none tracking-[-0.03em] tabular-nums', f.quiet && 'text-muted-foreground')}>
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>

          {/* A streak is only worth showing if you can act on it. */}
          {atRisk && (
            <p className="mt-4 rounded-2xl bg-primary/10 px-3 py-2.5 text-[13px] font-medium text-primary-strong">
              Finish a session today to keep your {streakDays}-day streak.
            </p>
          )}
        </section>

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
  );
};

export default PomodoroTimer;
